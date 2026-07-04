<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy\PaymentAccount;
use App\Models\Pharmacy\PaymentTransaction;
use App\Models\Pharmacy\PharmacyBranch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Transactions de Trésorerie (Admin)", description: "Gestion des flux de trésorerie (versements, décaissements, transferts)")]
class PaymentTransactionController extends Controller
{
    private function getHospitalId()
    {
        $user = Auth::user();
        if ($user->profile_admin) {
            return $user->profile_admin->hospital_id;
        } else if ($user->profile_pharm) {
            return $user->profile_pharm->hospital_id ?? $user->profile_pharm->branch->hospital_id ?? null;
        }
        abort(403, "Profil non autorisé.");
    }

    /**
     * Lister toutes les transactions de trésorerie
     */
    #[OA\Get(
        path: "/api/admin/payment-transactions",
        operationId: "getAdminPaymentTransactions",
        summary: "Lister toutes les transactions de trésorerie",
        security: [["bearerAuth" => []]],
        tags: ["Transactions de Trésorerie (Admin)"]
    )]
    #[OA\Parameter(name: "pharmacy_branch_id", in: "query", required: false, description: "Filtre par succursale", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "type", in: "query", required: false, description: "Filtre par type (cash_in, cash_out, transfer)", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "status", in: "query", required: false, description: "Filtre par statut (pending, completed, cancelled)", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "payment_method", in: "query", required: false, description: "Méthode de paiement", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "paginated", in: "query", required: false, description: "true pour paginer", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Liste des transactions récupérée avec succès")]
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        $user = Auth::user();

        $query = PaymentTransaction::whereHas('branch', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->with(['branch', 'sourceAccount', 'destinationAccount', 'user', 'confirmedBy', 'session.register']);

        if ($user->profile_pharm) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('pharmacy_branch_id')) {
            $query->where('pharmacy_branch_id', $request->query('pharmacy_branch_id'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->query('payment_method'));
        }

        $query->latest();

        if ($request->query('paginated') === 'true') {
            $perPage = $request->query('per_page', 15);
            return response()->json($query->paginate($perPage), 200);
        }

        return response()->json($query->get(), 200);
    }

    /**
     * Détails d'une transaction de trésorerie
     */
    #[OA\Get(
        path: "/api/admin/payment-transactions/{id}",
        operationId: "getAdminPaymentTransactionDetails",
        summary: "Détails d'une transaction",
        security: [["bearerAuth" => []]],
        tags: ["Transactions de Trésorerie (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la transaction", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Détails de la transaction récupérés avec succès")]
    public function show($id)
    {
        $hospitalId = $this->getHospitalId();

        $transaction = PaymentTransaction::whereHas('branch', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->with(['branch', 'sourceAccount', 'destinationAccount', 'user', 'confirmedBy', 'session.register'])->findOrFail($id);

        return response()->json($transaction, 200);
    }

    /**
     * Créer une transaction de trésorerie manuelle (Admin / Caissier)
     */
    #[OA\Post(
        path: "/api/admin/payment-transactions",
        operationId: "storeAdminPaymentTransaction",
        summary: "Créer une transaction de trésorerie manuelle",
        security: [["bearerAuth" => []]],
        tags: ["Transactions de Trésorerie (Admin)"]
    )]
    #[OA\Response(response: 201, description: "Transaction créée avec succès")]
    public function store(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        $user = Auth::user();

        $session = null;
        if ($user->profile_pharm) {
            $session = \App\Models\Pharmacy\CashRegisterSession::where('user_id', $user->id)
                ->whereNull('closed_at')
                ->first();
            if (!$session) {
                return response()->json(['message' => 'Vous devez avoir une session de caisse active.'], 400);
            }
        }

        $validated = $request->validate([
            'pharmacy_branch_id' => $session ? 'nullable|integer' : 'required|integer',
            'type' => ['required', Rule::in(['cash_in', 'cash_out', 'transfer'])],
            'payment_method' => ['required', Rule::in(['CASH', 'MOBILE_MONEY', 'CARD'])],
            'amount' => 'required|numeric|min:0.01',
            'source_account_id' => [
                'nullable',
                'integer',
                Rule::requiredIf(function () use ($request, $session) {
                    // Requis pour les sorties/transferts administratifs (sans session de caisse active)
                    return !$session && in_array($request->input('type'), ['cash_out', 'transfer']);
                })
            ],
            'destination_account_id' => [
                'nullable',
                'integer',
                Rule::requiredIf(function () use ($request, $session) {
                    // Requis pour les versements (transferts) de caisse vers les comptes
                    if ($request->input('type') === 'transfer') {
                        return true;
                    }
                    // Requis pour les apports administratifs directs (sans session de caisse active)
                    return !$session && $request->input('type') === 'cash_in';
                })
            ],
            'reference' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'status' => ['nullable', Rule::in(['pending', 'completed'])],
            'receipt' => 'nullable|image|max:4096',
        ]);

        $branchId = $session ? $session->register->pharmacy_branch_id : $validated['pharmacy_branch_id'];
        $branch = PharmacyBranch::where('hospital_id', $hospitalId)->findOrFail($branchId);

        // Valider les comptes si fournis
        if (isset($validated['source_account_id']) && !is_null($validated['source_account_id'])) {
            $sourceAccount = PaymentAccount::where('pharmacy_branch_id', $branch->id)->findOrFail($validated['source_account_id']);
            if ($validated['type'] === 'transfer' && $sourceAccount->balance < $validated['amount']) {
                return response()->json(['message' => 'Le solde du compte d\'origine est insuffisant.'], 400);
            }
        }

        if (isset($validated['destination_account_id']) && !is_null($validated['destination_account_id'])) {
            PaymentAccount::where('pharmacy_branch_id', $branch->id)->findOrFail($validated['destination_account_id']);
        }

        return DB::transaction(function () use ($validated, $branch, $request, $user, $session) {
            $receiptPath = null;
            if ($request->hasFile('receipt')) {
                $receiptPath = $request->file('receipt')->store('receipts', 'public');
            }

            // Par défaut, un transfert créé par un caissier est 'pending', les autres types sont 'completed'
            $status = $validated['status'] ?? ($user->profile_pharm && $validated['type'] === 'transfer' ? 'pending' : 'completed');

            $transaction = PaymentTransaction::create([
                'pharmacy_branch_id' => $branch->id,
                'cash_register_session_id' => $session ? $session->id : null,
                'type' => $validated['type'],
                'payment_method' => $validated['payment_method'],
                'amount' => $validated['amount'],
                'source_account_id' => $validated['source_account_id'] ?? null,
                'destination_account_id' => $validated['destination_account_id'] ?? null,
                'reference' => $validated['reference'] ?? null,
                'description' => $validated['description'] ?? null,
                'status' => $status,
                'receipt_path' => $receiptPath,
                'user_id' => Auth::id(),
                'confirmed_by_id' => $status === 'completed' ? Auth::id() : null,
                'confirmed_at' => $status === 'completed' ? now() : null,
            ]);

            // Mettre à jour les soldes immédiatement si complété
            if ($status === 'completed') {
                if ($transaction->sourceAccount) {
                    $transaction->sourceAccount->decrement('balance', $transaction->amount);
                }
                if ($transaction->destinationAccount) {
                    $transaction->destinationAccount->increment('balance', $transaction->amount);
                }
            } else {
                // Si c'est un versement bancaire initié au statut PENDING, l'argent sort tout de même du compte d'origine immédiatement.
                if ($transaction->sourceAccount) {
                    $transaction->sourceAccount->decrement('balance', $transaction->amount);
                }
            }

            return response()->json($transaction->load(['branch', 'sourceAccount', 'destinationAccount', 'user']), 201);
        });
    }

    /**
     * Confirmer un versement en attente (Admin uniquement)
     */
    #[OA\Post(
        path: "/api/admin/payment-transactions/{id}/confirm",
        operationId: "confirmAdminPaymentTransaction",
        summary: "Confirmer un versement en attente",
        security: [["bearerAuth" => []]],
        tags: ["Transactions de Trésorerie (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la transaction", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\MediaType(
            mediaType: "multipart/form-data",
            schema: new OA\Schema(
                required: ["reference"],
                properties: [
                    new OA\Property(property: "reference", type: "string", example: "BORD-9081"),
                    new OA\Property(property: "receipt", type: "string", format: "binary")
                ]
            )
        )
    )]
    #[OA\Response(response: 200, description: "Transaction confirmée avec succès")]
    public function confirm(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();

        $transaction = PaymentTransaction::whereHas('branch', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        if ($transaction->status !== 'pending') {
            return response()->json(['message' => 'Cette transaction n\'est pas en attente.'], 400);
        }

        $validated = $request->validate([
            'reference' => 'required|string|max:255',
            'receipt' => 'nullable|image|max:4096',
        ]);

        return DB::transaction(function () use ($transaction, $validated, $request) {
            if ($request->hasFile('receipt')) {
                $path = $request->file('receipt')->store('receipts', 'public');
                $transaction->receipt_path = $path;
            }

            $transaction->reference = $validated['reference'];
            $transaction->status = 'completed';
            $transaction->confirmed_by_id = Auth::id();
            $transaction->confirmed_at = now();
            $transaction->save();

            // L'argent arrive enfin sur le compte de destination
            if ($transaction->destinationAccount) {
                $transaction->destinationAccount->increment('balance', $transaction->amount);
            }

            return response()->json($transaction->load(['branch', 'sourceAccount', 'destinationAccount', 'user', 'confirmedBy']), 200);
        });
    }

    /**
     * Annuler un versement en attente (Admin uniquement)
     */
    #[OA\Post(
        path: "/api/admin/payment-transactions/{id}/cancel",
        operationId: "cancelAdminPaymentTransaction",
        summary: "Annuler un versement en attente",
        security: [["bearerAuth" => []]],
        tags: ["Transactions de Trésorerie (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la transaction", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Transaction annulée avec succès")]
    public function cancel(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();

        $transaction = PaymentTransaction::whereHas('branch', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        if ($transaction->status !== 'pending') {
            return response()->json(['message' => 'Cette transaction n\'est pas en attente.'], 400);
        }

        return DB::transaction(function () use ($transaction) {
            $transaction->status = 'cancelled';
            $transaction->confirmed_by_id = Auth::id();
            $transaction->confirmed_at = now();
            $transaction->save();

            // Restituer les fonds sur le compte d'origine
            if ($transaction->sourceAccount) {
                $transaction->sourceAccount->increment('balance', $transaction->amount);
            }

            return response()->json($transaction->load(['branch', 'sourceAccount', 'destinationAccount', 'user', 'confirmedBy']), 200);
        });
    }
}
