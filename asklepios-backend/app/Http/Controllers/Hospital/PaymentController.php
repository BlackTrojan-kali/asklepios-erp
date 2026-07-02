<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Http\Services\PaymentService;
use App\Models\Hospital\PaymentInvoice;
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
        
        abort(403, "Profil non autorisé à gérer les paiements.");
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

        // 2. Restrictions de Rôles
        if ($user->profile_reception) {
            // La réception ne voit que les paiements liés aux factures de SON centre
            $query->whereHas('invoice', function($q) use ($user) {
                $q->where('center_id', $user->profile_reception->center_id);
            });
        } elseif ($user->profile_admin) {
            // L'admin peut filtrer spécifiquement par centre s'il le souhaite
            if ($request->filled('center_id')) {
                $query->whereHas('invoice', function($q) use ($request) {
                    $q->where('center_id', $request->center_id);
                });
            }
        }

        // 3. Filtre par facture précise (si on veut voir les versements d'une seule facture)
        if ($request->filled('invoice_id')) {
            $query->where('invoice_id', $request->invoice_id);
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
            'invoice_id'     => 'required|exists:invoices,id',
            'amount'         => 'required|numeric|min:1',
            'payment_method' => ['required', Rule::in(['CASH', 'MOBILE_MONEY', 'CARD', 'INSURANCE', 'BANK_TRANSFER'])],
        ]);

        // Assigner automatiquement l'agent de réception s'il est connecté
        $user = auth()->user();
        $validated['reception_id'] = $user->profile_reception ? $user->profile_reception->id : null;

        try {
            $payment = $this->paymentService->createPayment($validated);
            
            // Recharger la facture avec le nouveau statut pour renvoyer au frontend
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
    
    #[OA\Response(response: 201, description: "élément supprimé avec succès")]
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'amount'         => 'sometimes|required|numeric|min:1',
            'payment_method' => ['sometimes', 'required', Rule::in(['CASH', 'MOBILE_MONEY', 'CARD', 'INSURANCE', 'BANK_TRANSFER'])],
        ]);

        try {
            $payment = $this->paymentService->updatePayment($id, $validated);
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
            $this->paymentService->deletePayment($id);

            return response()->json([
                'message' => 'Paiement annulé avec succès. La facture a été recalculée.'
            ], 200);

        } catch (Exception $e) {
            return response()->json(['message' => 'Erreur lors de l\'annulation.', 'error' => $e->getMessage()], 500);
        }
    }
}