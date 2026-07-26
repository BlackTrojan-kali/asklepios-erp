<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\GuarantorClaim;
use App\Models\Hospital\InvoiceSplit;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Exception;

#[OA\Tag(name: "Bordereaux Assurance", description: "Gestion des réclamations (Tiers Payant) vers les assurances")]
class GuarantorClaimController extends Controller
{
    /**
     * Détermine l'ID du centre de l'utilisateur connecté.
     */
    private function getCenterId(Request $request)
    {
        $user = Auth::user();
        if ($user->profile_reception) return $user->profile_reception->center_id;
        if ($user->profile_admin) return $request->center_id ?? null;
        return null;
    }

    #[OA\Get(
        path: "/api/shared/guarantor-claims", 
        summary: "Lister les bordereaux avec filtres",
        security: [["sanctum" => []]]
    )]
    #[OA\Parameter(name: "center_id", in: "query", required: false, description: "Filtrer par centre", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "insurance_company_id", in: "query", required: false, description: "Filtrer par assurance", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "status", in: "query", required: false, description: "Filtrer par statut (DRAFT, SUBMITTED, PAID, DISPUTED)", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "claim_month", in: "query", required: false, description: "Filtrer par mois (YYYY-MM)", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Liste des bordereaux récupérée avec succès")]
    public function index(Request $request)
    {
        $query = GuarantorClaim::with(['insuranceCompany', 'center'])
                    ->withCount('invoiceSplits'); 

        // Filtre par centre (sécurité)
        if ($centerId = $this->getCenterId($request)) {
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
            $query->whereMonth('claim_month', date('m', strtotime($request->claim_month)))
                  ->whereYear('claim_month', date('Y', strtotime($request->claim_month)));
        }

        $query->orderBy('created_at', 'desc');

        return response()->json($query->paginate($request->query('per_page', 15)), 200);
    }

    #[OA\Post(
        path: "/api/shared/guarantor-claims", 
        summary: "Créer un nouveau bordereau de réclamation",
        security: [["sanctum" => []]]
    )]
    #[OA\Response(response: 201, description: "Bordereau généré avec succès")]
    #[OA\Response(response: 422, description: "Erreur de validation (Assurance manquante, factures invalides...)")]
    public function store(Request $request)
    {
        $request->validate([
            'insurance_company_id' => 'required|exists:insurance_companies,id',
            'claim_month'          => 'required|date',
            'split_ids'            => 'required|array|min:1',
            'split_ids.*'          => 'exists:invoice_splits,id'
        ]);

        try {
            return DB::transaction(function () use ($request) {
                // 1. Création du bordereau
                $claim = GuarantorClaim::create([
                    'center_id'            => $this->getCenterId($request) ?? 1,
                    'insurance_company_id' => $request->insurance_company_id,
                    'claim_month'          => $request->claim_month,
                    'total_claim_amount'   => 0, 
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

    #[OA\Get(
        path: "/api/shared/guarantor-claims/{id}", 
        summary: "Voir les détails d'un bordereau",
        security: [["sanctum" => []]]
    )]
    #[OA\Response(response: 200, description: "Détails du bordereau récupérés avec succès")]
    public function show($id)
    {
        $claim = GuarantorClaim::with([
            'insuranceCompany', 
            'center.hospital',
            'invoiceSplits.invoice.patient.coverages', // 👉 Ajout pour le N° de Police
            'invoiceSplits.invoice.consultations',
            'invoiceSplits.invoice.patient'
        ])->findOrFail($id);

        return response()->json($claim, 200);
    }

    #[OA\Put(
        path: "/api/shared/guarantor-claims/{id}", 
        summary: "Mettre à jour le statut (ex: SUBMITTED, PAID)",
        security: [["sanctum" => []]]
    )]
    #[OA\Response(response: 200, description: "Bordereau mis à jour avec succès")]
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
            }

            return response()->json(['message' => 'Bordereau mis à jour', 'data' => $claim], 200);
        });
    }

    #[OA\Get(
        path: "/api/shared/invoice-splits/unclaimed", 
        summary: "Récupérer les parts assurances non réclamées",
        security: [["sanctum" => []]]
    )]
    #[OA\Parameter(name: "insurance_company_id", in: "query", required: true, description: "ID de la compagnie d'assurance", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "claim_month", in: "query", required: true, description: "Mois ciblé au format YYYY-MM", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Liste des factures impayées récupérées avec succès")]
    #[OA\Response(response: 422, description: "Paramètres invalides (ex: format de date incorrect)")]
    public function getUnclaimedSplits(Request $request)
    {
        $request->validate([
            'insurance_company_id' => 'required|integer',
            'claim_month'          => 'required|date_format:Y-m' // Format YYYY-MM
        ]);

        $splits = InvoiceSplit::with(['invoice.patient'])
            ->where('type', 'INSURANCE')
            ->where('status', 'UNPAID')
            ->whereNull('guarantor_claim_id')
            ->whereHas('invoice.patient.coverages', function ($q) use ($request) {
                // Filtre sur la compagnie d'assurance
                $q->where('insurance_company_id', $request->insurance_company_id);
            })
            ->whereHas('invoice', function ($q) use ($request) {
                // Carbon trouve automatiquement le 28, 29, 30 ou 31 du mois sélectionné à 23h59m59s
                $endOfMonth = Carbon::createFromFormat('Y-m', $request->claim_month)->endOfMonth();
                $q->where('created_at', '<=', $endOfMonth);
            })
            ->get();  
            
        // IL N'Y A PLUS DE dd($splits) ICI !

        return response()->json($splits, 200);
    }
    #[OA\Delete(
        path: "/api/shared/guarantor-claims/{id}", 
        summary: "Supprimer un bordereau (DRAFT uniquement)",
        security: [["sanctum" => []]]
    )]
    #[OA\Response(response: 200, description: "Bordereau supprimé avec succès")]
    #[OA\Response(response: 403, description: "Impossible de supprimer ce bordereau")]
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

    #[OA\Get(
        path: "/api/shared/guarantor-claims/{id}/download", 
        summary: "Générer le PDF du bordereau d'assurance",
        security: [["sanctum" => []]]
    )]
    #[OA\Parameter(name: "action", in: "query", required: false, description: "'stream' (aperçu) ou 'download' (télécharger)", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Flux ou téléchargement du PDF généré")]
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