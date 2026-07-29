<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Http\Services\PaymentService;
use App\Http\Services\Security\ScopeResolver;
use App\Models\Hospital\PaymentInvoice;
use App\Models\Hospital\Invoice;
use App\Models\Hospital\InvoiceSplit;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Illuminate\Validation\Rule;
use Exception;

#[OA\Tag(name: "Paiements", description: "Gestion des encaissements des factures")]
class PaymentController extends Controller
{
    protected $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Récupère l'ID de l'hôpital selon le profil de l'utilisateur.
     */
    private function getHospitalId()
    {
        $user = auth()->user();
        if ($user->profile_admin) return $user->profile_admin->hospital_id;
        if ($user->profile_reception) return $user->profile_reception->hospital_id;
        if ($user->profile_lab) return $user->profile_lab->hospital_id;
        
        abort(403, "Profil non autorisé à gérer les paiements.");
    }

    /**
     * 👉 NOUVEAU : Synchronise les statuts des Splits et de la Facture globale
     * après chaque mouvement financier.
     */
    private function syncInvoiceStatuses($invoiceId)
    {
        $invoice = Invoice::with('splits')->find($invoiceId);
        if (!$invoice) return;

        $allSplitsPaid = true;

        // 1. On vérifie et on met à jour le statut de CHAQUE part (Patient & Assurance)
        foreach ($invoice->splits as $split) {
            $totalPaidForSplit = PaymentInvoice::where('invoice_split_id', $split->id)->sum('amount');
            
            $status = ($totalPaidForSplit >= $split->amount_to_pay) ? 'PAID' : 'UNPAID';

            if ($split->status !== $status) {
                $split->update(['status' => $status]);
            }

            if ($status === 'UNPAID') {
                $allSplitsPaid = false;
            }
        }

        // Sécurité : S'il n'y a aucun split (ancienne facture), on base sur le total général
        if ($invoice->splits->isEmpty()) {
            $totalPaid = PaymentInvoice::where('invoice_id', $invoice->id)->sum('amount');
            $allSplitsPaid = ($totalPaid >= $invoice->total_amount);
        }

        // 2. On met à jour la facture globale
        $newInvoiceStatus = $allSplitsPaid ? 'PAID' : 'UNPAID';
        if ($invoice->status !== $newInvoiceStatus) {
            $invoice->update(['status' => $newInvoiceStatus]);
        }
    }

    #[OA\Get(
        path: "/api/shared/payments",
        summary: "Historique des paiements (Paginé et filtrable)",
        description: "La réceptionniste ne voit que les paiements de son centre. L'admin voit tout son hôpital.",
        security: [["sanctum" => []]],
        tags: ["Paiements"]
    )]
    #[OA\Response(response: 200, description: "Liste récupérée avec succès")]
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        $user = auth()->user();

        // 1. Filtrer pour n'afficher que les paiements liés aux factures de l'hôpital courant
        $query = PaymentInvoice::whereHas('invoice.patient', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->with(['invoice.patient', 'reception.user']); // Eager loading pour afficher les infos
        
        $query = ScopeResolver::applyCenterScope($query,"id");
        // 2. Restrictions de Rôles
        if ($user->profile_reception) {
            $query->whereHas('invoice', function($q) use ($user) {
                $q->where('center_id', $user->profile_reception->center_id);
            });
        } elseif ($user->profile_admin) {
            if ($request->filled('center_id')) {
                $query->whereHas('invoice', function($q) use ($request) {
                    $q->where('center_id', $request->center_id);
                });
            }
        }

        // 3. Filtres avancés
        if ($request->filled('invoice_id')) {
            $query->where('invoice_id', $request->invoice_id);
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        if ($request->filled('start_time')) {
            $query->whereTime('created_at', '>=', $request->start_time);
        }

        if ($request->filled('end_time')) {
            $query->whereTime('created_at', '<=', $request->end_time);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('id', 'LIKE', "%{$search}%")
                  ->orWhere('invoice_id', 'LIKE', "%{$search}%")
                  ->orWhereHas('invoice.patient', function($pq) use ($search) {
                      $pq->where('first_name', 'LIKE', "%{$search}%")
                        ->orWhere('last_name', 'LIKE', "%{$search}%")
                        ->orWhere('patient_code', 'LIKE', "%{$search}%");
                  });
            });
        }

        $query->orderBy('created_at', 'desc');

        return response()->json($query->paginate($request->query('per_page', 15)), 200);
    }

    #[OA\Post(
        path: "/api/shared/payments",
        summary: "Enregistrer un paiement",
        security: [["sanctum" => []]],
        tags: ["Paiements"]
    )]
    #[OA\Response(response: 201, description: "élément enregistré avec succès")]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_id'       => 'required|exists:invoices,id',
            'invoice_split_id' => 'nullable|exists:invoice_splits,id', // 👉 On autorise le ciblage spécifique
            'amount'           => 'required|numeric|min:1',
            'payment_method'   => ['required', Rule::in(['CASH', 'MOBILE_MONEY', 'CARD', 'INSURANCE', 'BANK_TRANSFER'])],
        ]);

        // 👉 NOUVEAU : Auto-assignation de la part PATIENT
        // Si aucun Split n'est précisé, on cible la part PATIENT par défaut
        $splitId = $validated['invoice_split_id'] ?? null;
        if (!$splitId) {
            $patientSplit = InvoiceSplit::where('invoice_id', $validated['invoice_id'])
                ->where('type', 'PATIENT')
                ->first();
            $splitId = $patientSplit ? $patientSplit->id : null;
        }
        $validated['invoice_split_id'] = $splitId;

        // Assigner automatiquement l'agent de réception s'il est connecté
        $user = auth()->user();
        $validated['reception_id'] = $user->profile_reception ? $user->profile_reception->id : null;

        try {
            $payment = $this->paymentService->createPayment($validated);
            
            // 👉 NOUVEAU : On met à jour les statuts après l'encaissement
            $this->syncInvoiceStatuses($validated['invoice_id']);
            
            $payment->load('invoice');

            return response()->json([
                'message' => 'Paiement enregistré avec succès.',
                'invoice_status' => $payment->invoice->status,
                'data' => $payment
            ], 201);

        } catch (Exception $e) {
            return response()->json(['message' => 'Erreur lors de l\'enregistrement du paiement.', 'error' => $e->getMessage()], 500);
        }
    }

    #[OA\Put(
        path: "/api/admin/payments/{id}",
        summary: "Modifier un paiement (Correction d'erreur)",
        security: [["sanctum" => []]],
        tags: ["Paiements"]
    )]
    #[OA\Response(response: 201, description: "élément mis à jour avec succès")]
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'amount'         => 'sometimes|required|numeric|min:1',
            'payment_method' => ['sometimes', 'required', Rule::in(['CASH', 'MOBILE_MONEY', 'CARD', 'INSURANCE', 'BANK_TRANSFER'])],
        ]);

        try {
            $payment = $this->paymentService->updatePayment($id, $validated);
            
            // 👉 NOUVEAU : On met à jour les statuts suite à la correction du montant
            $this->syncInvoiceStatuses($payment->invoice_id);
            
            $payment->load('invoice');

            return response()->json([
                'message' => 'Paiement mis à jour avec succès.',
                'new_invoice_status' => $payment->invoice->status,
                'data' => $payment
            ], 200);

        } catch (Exception $e) {
            return response()->json(['message' => 'Erreur lors de la mise à jour.', 'error' => $e->getMessage()], 500);
        }
    }

    #[OA\Delete(
        path: "/api/admin/payments/{id}",
        summary: "Supprimer un paiement (Annulation)",
        security: [["sanctum" => []]],
        tags: ["Paiements"]
    )]
    #[OA\Response(response: 200, description: "élément supprimé avec succès")]
    public function destroy($id)
    {
        try {
            $payment = PaymentInvoice::findOrFail($id);
            $invoiceId = $payment->invoice_id;

            $this->paymentService->deletePayment($id);

            // 👉 NOUVEAU : On met à jour les statuts (la facture pourrait repasser en UNPAID)
            $this->syncInvoiceStatuses($invoiceId);

            return response()->json([
                'message' => 'Paiement annulé avec succès. Les statuts de la facture ont été recalculés.'
            ], 200);

        } catch (Exception $e) {
            return response()->json(['message' => 'Erreur lors de l\'annulation.', 'error' => $e->getMessage()], 500);
        }
    }
}