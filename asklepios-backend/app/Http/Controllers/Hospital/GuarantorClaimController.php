<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\Hospital\GuarantorClaim;
use App\Models\Hospital\InvoiceSplit;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Exception;

#[OA\Tag(name: "Bordereaux Assurance", description: "Gestion des réclamations (Tiers Payant) vers les assurances")]
class GuarantorClaimController extends Controller
{
    private function getCenterId()
    {
        $user = Auth::user();
        if ($user->profile_reception) return $user->profile_reception->center_id;
        if ($user->profile_admin) return $request->center_id ?? null; // À adapter selon votre logique admin
        return null;
    }

    #[OA\Get(path: "/api/shared/guarantor-claims", summary: "Lister les bordereaux avec filtres")]
    public function index(Request $request)
    {
        $query = GuarantorClaim::with(['insuranceCompany', 'center'])
                    ->withCount('invoiceSplits'); // Ajoute un champ invoice_splits_count

        // Filtre par centre (sécurité)
        if ($centerId = $this->getCenterId()) {
            $query->where('center_id', $centerId);
        } elseif ($request->filled('center_id')) {
            $query->where('center_id', $request->center_id);
        }

        // Filtres optionnels
        if ($request->filled('insurance_company_id')) {
            $query->where('insurance_company_id', $request->insurance_company_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('claim_month')) {
            // Recherche par mois (format YYYY-MM)
            $query->whereMonth('claim_month', date('m', strtotime($request->claim_month)))
                  ->whereYear('claim_month', date('Y', strtotime($request->claim_month)));
        }

        $query->orderBy('created_at', 'desc');

        return response()->json($query->paginate($request->query('per_page', 15)), 200);
    }

    #[OA\Post(path: "/api/shared/guarantor-claims", summary: "Créer un nouveau bordereau de réclamation")]
    public function store(Request $request)
    {
        $request->validate([
            'insurance_company_id' => 'required|exists:insurance_companies,id',
            'claim_month'          => 'required|date',
            'split_ids'            => 'required|array|min:1', // Le frontend doit envoyer les IDs des splits à inclure
            'split_ids.*'          => 'exists:invoice_splits,id'
        ]);

        try {
            return DB::transaction(function () use ($request) {
                // 1. Création du bordereau
                $claim = GuarantorClaim::create([
                    'center_id'            => $this->getCenterId() ?? 1, // Fallback à gérer selon votre auth
                    'insurance_company_id' => $request->insurance_company_id,
                    'claim_month'          => $request->claim_month,
                    'total_claim_amount'   => 0, // Sera recalculé juste après
                    'status'               => 'DRAFT',
                ]);

                // 2. Attacher les splits (parts assurance) à ce bordereau
                InvoiceSplit::whereIn('id', $request->split_ids)
                    ->where('type', 'INSURANCE')
                    ->where('status', 'UNPAID')
                    ->whereNull('guarantor_claim_id')
                    ->update(['guarantor_claim_id' => $claim->id]);

                // 3. Recalculer le total
                $claim->recalculateTotalAmount();

                return response()->json([
                    'message' => 'Bordereau généré avec succès',
                    'data'    => $claim->load('insuranceCompany')
                ], 201);
            });
        } catch (Exception $e) {
            return response()->json(['message' => 'Erreur lors de la création : ' . $e->getMessage()], 422);
        }
    }

    #[OA\Get(path: "/api/shared/guarantor-claims/{id}", summary: "Voir les détails d'un bordereau")]
    public function show($id)
    {
        $claim = GuarantorClaim::with([
            'insuranceCompany', 
            'center.hospital',
            'invoiceSplits.invoice.patient' // Charge les factures et les patients liés pour l'affichage
        ])->findOrFail($id);

        return response()->json($claim, 200);
    }

    #[OA\Put(path: "/api/shared/guarantor-claims/{id}", summary: "Mettre à jour le statut (ex: SUBMITTED, PAID)")]
    public function update(Request $request, $id)
    {
        $request->validate([
            'status'        => 'sometimes|in:DRAFT,SUBMITTED,PAID,DISPUTED',
            'claim_refence' => 'sometimes|string|nullable'
        ]);

        $claim = GuarantorClaim::findOrFail($id);

        return DB::transaction(function () use ($request, $claim) {
            $claim->update($request->only(['status', 'claim_refence']));

            // Si le bordereau passe en "PAID", on marque toutes ses lignes de facture comme "PAID"
            if ($claim->status === 'PAID') {
                $claim->invoiceSplits()->update(['status' => 'PAID']);
                
                // Note : Vous pourriez aussi vouloir déclencher un événement pour marquer les Invoices globales comme PAID si la part patient l'est aussi.
            }

            return response()->json(['message' => 'Bordereau mis à jour', 'data' => $claim], 200);
        });
    }

    #[OA\Delete(path: "/api/shared/guarantor-claims/{id}", summary: "Supprimer un bordereau (DRAFT uniquement)")]
    public function destroy($id)
    {
        $claim = GuarantorClaim::findOrFail($id);

        if ($claim->status !== 'DRAFT') {
            return response()->json(['message' => 'Impossible de supprimer un bordereau déjà soumis ou payé.'], 403);
        }

        return DB::transaction(function () use ($claim) {
            // Libérer les lignes de facture associées
            $claim->invoiceSplits()->update(['guarantor_claim_id' => null]);
            $claim->delete();

            return response()->json(['message' => 'Bordereau supprimé. Les factures sont de nouveau en attente de réclamation.'], 200);
        });
    }

    #[OA\Get(path: "/api/shared/guarantor-claims/{id}/download", summary: "Générer le PDF du bordereau d'assurance")]
    public function downloadPdf(Request $request, $id)
    {
        $claim = GuarantorClaim::with([
            'insuranceCompany', 
            'center.hospital',
            'invoiceSplits.invoice.patient'
        ])->findOrFail($id);

        $action = $request->query('action', 'stream');

        // Préparation des Logos (similaire à InvoicePdfService)
        $hospitalLogoBase64 = null;
        if ($claim->center->hospital && $claim->center->hospital->logo_url) {
            $hospitalLogoPath = public_path($claim->center->hospital->logo_url);
            if (file_exists($hospitalLogoPath)) {
                $hospitalLogoBase64 = 'data:image/' . pathinfo($hospitalLogoPath, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($hospitalLogoPath));
            }
        }

        $data = [
            'claim'              => $claim,
            'splits'             => $claim->invoiceSplits,
            'hospitalLogoBase64' => $hospitalLogoBase64,
            'generated_at'       => now()->format('d/m/Y H:i')
        ];

        // Format paysage recommandé pour les tableaux contenant beaucoup de colonnes
        $pdf = Pdf::loadView('pdf.guarantor_claim', $data)->setPaper('a4', 'landscape');

        $fileName = 'Bordereau_' . str_replace(' ', '_', $claim->insuranceCompany->name) . '_' . date('m_Y', strtotime($claim->claim_month)) . '.pdf';

        return $action === 'download' ? $pdf->download($fileName) : $pdf->stream($fileName);
    }
}