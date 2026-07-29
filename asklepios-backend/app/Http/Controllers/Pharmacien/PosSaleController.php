<?php

namespace App\Http\Controllers\Pharmacien;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy\PosSale;
use App\Models\Pharmacy\PosSaleItem;
use App\Models\Pharmacy\CashRegisterSession;
use App\Models\Pharmacy\Batch;
use App\Http\Services\StockMovementService;
use App\Http\Services\Security\ScopeResolver; // 🟢 CORRECTION CRITIQUE : Le bon namespace !
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Exception;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Ventes POS (Pharmacy)", description: "Gestion des ventes directes en caisse et des factures PDF")]
class PosSaleController extends Controller
{
    /**
     * Lister les ventes de la succursale du pharmacien connecté ou les ventes autorisées pour l'admin
     */
    #[OA\Get(
        path: "/api/pharmacy/pos-sales",
        operationId: "getPosSales",
        summary: "Lister les ventes (Admin / Pharmacien)",
        security: [["bearerAuth" => []]],
        tags: ["Ventes POS (Pharmacy)"]
    )]
    #[OA\Response(response: 200, description: "Liste des ventes récupérée avec succès")]
    #[OA\Response(response: 403, description: "Accès refusé")]
   public function index(Request $request)
    {
        $user = auth()->user();
        
        // 1. Requête de base pour l'hôpital de l'admin
        $query = PosSale::with(['session.user', 'items.article', 'patient', 'branch'])
            ->whereHas('branch', function ($q) use ($user) {
                $q->where('hospital_id', $user->profile_admin->hospital_id);
            });
        // 🟢 2. ON APPLIQUE LE SCOPE MULTI-SITES ICI
        $query = ScopeResolver::applyPharmacyScope($query, 'pharmacy_branch_id');

        // 3. Les filtres classiques de l'admin
        if ($request->filled('pharmacy_branch_id')) {
            $query->where('pos_sales.pharmacy_branch_id', $request->query('pharmacy_branch_id'));
        }
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->query('payment_method'));
        }
        if ($request->filled('start_date')) {
            $query->where('created_at', '>=', $request->query('start_date') . ' 00:00:00');
        }
        if ($request->filled('end_date')) {
            $query->where('created_at', '<=', $request->query('end_date') . ' 23:59:59');
        }

        $query->latest();

        if ($request->has('per_page')) {
            return response()->json($query->paginate($request->query('per_page', 15)), 200);
        }

        return response()->json($query->get(), 200);
    }


    /**
     * Détails d'une vente
     */
    #[OA\Get(
        path: "/api/pharmacy/pos-sales/{id}",
        operationId: "getPosSaleDetails",
        summary: "Détails d'une vente",
        security: [["bearerAuth" => []]],
        tags: ["Ventes POS (Pharmacy)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la vente", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Détails de la vente récupérés avec succès")]
    #[OA\Response(response: 403, description: "Accès refusé")]
    #[OA\Response(response: 404, description: "Vente non trouvée")]
    public function show($id)
    {
        $user = Auth::user();
        $query = PosSale::with(['session.user', 'session.register', 'branch.country', 'items.article', 'items.batch', 'patient']);

        if ($user->profile_admin) {
            $query->whereHas('branch', function ($q) use ($user) {
                $q->where('hospital_id', $user->profile_admin->hospital_id);
            });
            
            // 🟢 SÉCURITÉ
            $query = ScopeResolver::applyPharmacyScope($query, 'pharmacy_branch_id');

        } elseif ($user->profile_pharm) {
            if (!$user->profile_pharm->branch_id) {
                return response()->json(['message' => 'Accès refusé. Vous n\'êtes affecté à aucune succursale.'], 403);
            }
            $query->where('pharmacy_branch_id', $user->profile_pharm->branch_id);
        } else {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $sale = $query->findOrFail($id);

        return response()->json($sale, 200);
    }

    /**
     * Créer une vente et enregistrer la sortie de stock (FEFO)
     */
    public function store(Request $request)
    {
        // La création de vente POS reste le privilège du Pharmacien (Caissier)
        $profile = Auth::user()->profile_pharm;
        if (!$profile || !$profile->branch_id) {
            return response()->json(['message' => 'Accès refusé. Seul un caissier affecté à une succursale peut effectuer une vente.'], 403);
        }

        $branchId = $profile->branch_id;

        // Récupérer la session active de caisse du caissier
        $session = CashRegisterSession::where('user_id', Auth::id())
            ->whereNull('closed_at')
            ->first();

        if (!$session) {
            return response()->json([
                'message' => 'Vous n\'avez pas de session de caisse active ouverte. Veuillez d\'abord ouvrir une session.'
            ], 400);
        }

        $validated = $request->validate([
            'customer_name' => 'nullable|string|max:255',
            'patient_id' => 'nullable|integer|exists:patients,id',
            'has_prescription' => 'nullable|boolean',
            'prescription_ref' => 'nullable|string|max:255',
            'payment_method' => 'required|string|in:CASH,MOBILE_MONEY,CARD',
            'payment_account_id' => 'nullable|integer',
            'amount_received' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.article_id' => 'required|integer|exists:articles,id',
            'items.*.batch_id' => 'nullable|integer|exists:batches,id',
            'items.*.qty' => 'required|numeric|min:0.1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0|max:100',
        ]);

        $destinationAccount = null;
        if (in_array($validated['payment_method'], ['MOBILE_MONEY', 'CARD'])) {
            if (!isset($validated['payment_account_id']) || is_null($validated['payment_account_id'])) {
                return response()->json(['message' => 'Le choix du compte de trésorerie récepteur est obligatoire pour les paiements dématérialisés.'], 422);
            }

            $accountType = $validated['payment_method'] === 'MOBILE_MONEY' ? 'mobile_money' : 'bank';
            $destinationAccount = \App\Models\Pharmacy\PaymentAccount::where('pharmacy_branch_id', $branchId)
                ->where('type', $accountType)
                ->where('status', 'active')
                ->find($validated['payment_account_id']);

            if (!$destinationAccount) {
                return response()->json(['message' => 'Le compte de trésorerie sélectionné est invalide ou inactif pour ce mode de paiement.'], 422);
            }
        }

        $patient = null;
        if (isset($validated['patient_id']) && !is_null($validated['patient_id'])) {
            $patient = \App\Models\Patient::find($validated['patient_id']);
        }

        $customerName = $validated['customer_name'] ?? 'Anonyme';
        if ($patient) {
            $customerName = trim($patient->first_name . ' ' . ($patient->last_name ?? ''));
        }

        DB::beginTransaction();

        try {
            $totalAmount = 0;
            $itemsData = [];
            
            // Calculer les totaux d'abord
            foreach ($validated['items'] as $item) {
                $discount = $item['discount'] ?? 0;
                $subTotal = $item['qty'] * $item['unit_price'] * (1 - $discount / 100);
                $totalAmount += $subTotal;
                
                // Résoudre le lot (batch_id) si non fourni (pour les articles sans suivi de lots)
                $batchIdItem = $item['batch_id'] ?? null;
                if (!$batchIdItem) {
                    $batch = Batch::where('article_id', $item['article_id'])->first();
                    if (!$batch) {
                        $batch = Batch::create([
                            'article_id' => $item['article_id'],
                            'batch_number' => 'DEFAULT',
                            'purchase_price' => 0.0,
                            'expire_date' => null,
                        ]);
                    }
                    $batchIdItem = $batch->id;
                }
                
                $itemsData[] = [
                    'article_id' => $item['article_id'],
                    'batch_id' => $batchIdItem,
                    'qty' => $item['qty'],
                    'unit_price' => $item['unit_price'],
                    'discount' => $discount,
                    'sub_total' => $subTotal,
                ];
            }

            // Calcul du reliquat pour espèces
            $changeDue = 0;
            $amountReceived = $totalAmount;
            if ($validated['payment_method'] === 'CASH') {
                $amountReceived = $validated['amount_received'] ?? 0;
                if ($amountReceived < $totalAmount) {
                    throw new Exception("Le montant perçu est insuffisant. Net à payer : {$totalAmount} XAF.");
                }
                $changeDue = $amountReceived - $totalAmount;
            }

            // Créer la vente
            $sale = PosSale::create([
                'pharmacy_branch_id' => $branchId,
                'cash_register_session_id' => $session->id,
                'customer_name' => $customerName,
                'patient_id' => $validated['patient_id'] ?? null,
                'has_prescription' => $validated['has_prescription'] ?? false,
                'prescription_ref' => $validated['prescription_ref'] ?? null,
                'total_amount' => $totalAmount,
                'payment_method' => $validated['payment_method'],
                'payment_account_id' => $validated['payment_account_id'] ?? null,
                'amount_received' => $amountReceived,
                'change_due' => $changeDue,
            ]);

            // Enregistrer chaque élément de vente et déduire le stock physique
            $stockMovementService = new StockMovementService();
            foreach ($itemsData as $item) {
                PosSaleItem::create([
                    'pos_sale_id' => $sale->id,
                    'article_id' => $item['article_id'],
                    'batch_id' => $item['batch_id'],
                    'qty' => $item['qty'],
                    'unit_price' => $item['unit_price'],
                    'discount' => $item['discount'],
                    'sub_total' => $item['sub_total'],
                ]);

                // Sortie de stock avec gestion des mouvements
                $stockMovementService->recordMovement(
                    'EXIT',
                    'SALE',
                    $sale->id,
                    $item['batch_id'],
                    $item['qty'],
                    null,
                    "Vente POS #{$sale->id}"
                );
            }

            // Enregistrer le flux financier de la vente en Mobile Money ou Carte dans la trésorerie
            if (in_array($validated['payment_method'], ['MOBILE_MONEY', 'CARD']) && $destinationAccount) {
                \App\Models\Pharmacy\PaymentTransaction::create([
                    'pharmacy_branch_id' => $branchId,
                    'cash_register_session_id' => $session->id,
                    'type' => 'cash_in',
                    'payment_method' => $validated['payment_method'],
                    'amount' => $totalAmount,
                    'destination_account_id' => $destinationAccount->id,
                    'reference' => 'SALE-' . $sale->id,
                    'description' => "Paiement Client - Vente POS #{$sale->id}",
                    'status' => 'completed',
                    'user_id' => Auth::id(),
                    'confirmed_by_id' => Auth::id(),
                    'confirmed_at' => now(),
                ]);

                $destinationAccount->increment('balance', $totalAmount);
            }

            DB::commit();

            return response()->json($sale->load(['items.article', 'items.batch']), 201);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    /**
     * Générer le PDF de la facture de vente
     */
    public function exportPdf($id)
    {
        $user = Auth::user();
        
        $query = PosSale::with([
            'session.user',
            'session.register',
            'branch.hospital',
            'branch.country',
            'items.article',
            'items.batch'
        ]);

        if ($user->profile_admin) {
            $hospitalId = $user->profile_admin->hospital_id;
            $query->whereHas('branch', function ($q) use ($hospitalId) {
                $q->where('hospital_id', $hospitalId);
            });
            
            // 🟢 SÉCURITÉ : Restriction à l'export
            $query = ScopeResolver::applyPharmacyScope($query, 'pos_sales.pharmacy_branch_id');
            
        } elseif ($user->profile_pharm) {
            $branchId = $user->profile_pharm->branch_id;
            if (!$branchId) {
                abort(403, "Accès refusé.");
            }
            $query->where('pharmacy_branch_id', $branchId);
        } else {
            abort(403, "Accès refusé.");
        }

        $sale = $query->findOrFail($id);

        $pdf = Pdf::loadView('exports.pdf.sale_invoice', compact('sale'));
        
        return $pdf->stream("facture_vente_{$sale->id}.pdf");
    }
}