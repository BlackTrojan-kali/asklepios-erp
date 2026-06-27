<?php

namespace App\Http\Controllers\Pharmacien;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy\PosSale;
use App\Models\Pharmacy\PosSaleItem;
use App\Models\Pharmacy\CashRegisterSession;
use App\Models\Pharmacy\Batch;
use App\Http\Services\StockMovementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Exception;

class PosSaleController extends Controller
{
    /**
     * Lister les ventes de la succursale du pharmacien connecté
     */
    public function index()
    {
        $profile = Auth::user()->profile_pharm;
        if (!$profile || !$profile->branch_id) {
            return response()->json(['message' => 'Accès refusé. Vous n\'êtes affecté à aucune succursale.'], 403);
        }

        $sales = PosSale::where('pharmacy_branch_id', $profile->branch_id)
            ->with(['session.user', 'items.article'])
            ->latest()
            ->get();

        return response()->json($sales, 200);
    }

    /**
     * Détails d'une vente
     */
    public function show($id)
    {
        $profile = Auth::user()->profile_pharm;
        if (!$profile || !$profile->branch_id) {
            return response()->json(['message' => 'Accès refusé. Vous n\'êtes affecté à aucune succursale.'], 403);
        }

        $sale = PosSale::where('pharmacy_branch_id', $profile->branch_id)
            ->with(['session.user', 'session.register', 'branch.country', 'items.article', 'items.batch'])
            ->findOrFail($id);

        return response()->json($sale, 200);
    }

    /**
     * Créer une vente et enregistrer la sortie de stock (FEFO)
     */
    public function store(Request $request)
    {
        $profile = Auth::user()->profile_pharm;
        if (!$profile || !$profile->branch_id) {
            return response()->json(['message' => 'Accès refusé. Vous n\'êtes affecté à aucune succursale.'], 403);
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
            'has_prescription' => 'nullable|boolean',
            'prescription_ref' => 'nullable|string|max:255',
            'payment_method' => 'required|string|in:CASH,MOBILE_MONEY,CARD',
            'amount_received' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.article_id' => 'required|integer|exists:articles,id',
            'items.*.batch_id' => 'nullable|integer|exists:batches,id',
            'items.*.qty' => 'required|numeric|min:0.1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0|max:100',
        ]);

        $customerName = $validated['customer_name'] ?? 'Client Passage';

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
                $batchId = $item['batch_id'] ?? null;
                if (!$batchId) {
                    $batch = Batch::where('article_id', $item['article_id'])->first();
                    if (!$batch) {
                        $batch = Batch::create([
                            'article_id' => $item['article_id'],
                            'batch_number' => 'DEFAULT',
                            'purchase_price' => 0.0,
                            'expire_date' => null,
                        ]);
                    }
                    $batchId = $batch->id;
                }
                
                $itemsData[] = [
                    'article_id' => $item['article_id'],
                    'batch_id' => $batchId,
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
                'has_prescription' => $validated['has_prescription'] ?? false,
                'prescription_ref' => $validated['prescription_ref'] ?? null,
                'total_amount' => $totalAmount,
                'payment_method' => $validated['payment_method'],
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
        $profile = Auth::user()->profile_pharm;
        if (!$profile || !$profile->branch_id) {
            abort(403, "Accès refusé.");
        }

        $sale = PosSale::where('pharmacy_branch_id', $profile->branch_id)
            ->with([
                'session.user',
                'session.register',
                'branch.hospital',
                'branch.country',
                'items.article',
                'items.batch'
            ])
            ->findOrFail($id);

        $pdf = Pdf::loadView('exports.pdf.sale_invoice', compact('sale'));
        
        return $pdf->stream("facture_vente_{$sale->id}.pdf");
    }
}
