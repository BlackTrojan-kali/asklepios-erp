<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\GuarantorClaim;
use App\Models\Hospital\InvoiceSplit;
use App\Models\Hospital\PaymentInvoice; // 👉 NOUVEAU
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
    private function getCenterId(Request $request)
    {
        $user = Auth::user();
        if ($user->profile_reception) return $user->profile_reception->center_id;
        if ($user->profile_admin) return $request->center_id ?? null;
        return null;
    }

    #[OA\Get(path: "/api/shared/guarantor-claims", summary: "Lister les bordereaux avec filtres", security: [["sanctum" => []]])]
    public function index(Request $request)
    {
        $query = GuarantorClaim::with(['insuranceCompany', 'center'])
                    ->withCount('invoiceSplits'); 

        if ($centerId = $this->getCenterId($request)) {
            $query->where('center_id', $centerId);
        } elseif ($request->filled('center_id')) {
            $query->where('center_id', $request->center_id);
        }

        if ($request->filled('insurance_company_id')) $query->where('insurance_company_id', $request->insurance_company_id);
        if ($request->filled('status')) $query->where('status', $request->status);
        
        if ($request->filled('claim_month')) {
            $query->whereMonth('claim_month', date('m', strtotime($request->claim_month)))
                  ->whereYear('claim_month', date('Y', strtotime($request->claim_month)));
        }

        $query->orderBy('created_at', 'desc');

        return response()->json($query->paginate($request->query('per_page', 15)), 200);
    }

    #[OA\Post(path: "/api/shared/guarantor-claims", summary: "Créer un nouveau bordereau", security: [["sanctum" => []]])]
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
                $claim = GuarantorClaim::create([
                    'center_id'            => $this->getCenterId($request) ?? 1,
                    'insurance_company_id' => $request->insurance_company_id,
                    'claim_month'          => $request->claim_month,
                    'total_claim_amount'   => 0, 
                    'status'               => 'DRAFT',
                ]);

                InvoiceSplit::whereIn('id', $request->split_ids)
                    ->where('type', 'INSURANCE')
                    ->where('status', 'UNPAID')
                    ->whereNull('guarantor_claim_id')
                    ->update(['guarantor_claim_id' => $claim->id]);

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

    #[OA\Get(path: "/api/shared/guarantor-claims/{id}", summary: "Voir les détails d'un bordereau", security: [["sanctum" => []]])]
    public function show($id)
    {
        $claim = GuarantorClaim::with([
            'insuranceCompany', 
            'center.hospital',
            'invoiceSplits.invoice.patient.coverages', 
            'invoiceSplits.invoice.consultations',
            'invoiceSplits.invoice.patient'
        ])->findOrFail($id);

        return response()->json($claim, 200);
    }

    #[OA\Put(path: "/api/shared/guarantor-claims/{id}", summary: "Mettre à jour le statut", security: [["sanctum" => []]])]
    public function update(Request $request, $id)
    {
        $request->validate([
            'status'        => 'sometimes|in:DRAFT,SUBMITTED,PAID,DISPUTED',
            'claim_refence' => 'sometimes|string|nullable'
        ]);

        $claim = GuarantorClaim::with('invoiceSplits.invoice')->findOrFail($id);

        return DB::transaction(function () use ($request, $claim) {
            $oldStatus = $claim->status;
            $claim->update($request->only(['status', 'claim_refence']));

            // 👉 NOUVEAU : Si le bordereau passe en "PAID" (et qu'il ne l'était pas déjà)
            if ($claim->status === 'PAID' && $oldStatus !== 'PAID') {
                $user = auth()->user();
                $receptionId = $user->profile_reception->id ?? null;

                foreach ($claim->invoiceSplits as $split) {
                    if ($split->status !== 'PAID') {
                        // 1. Marquer la part (split) comme payée
                        $split->update(['status' => 'PAID']);

                        // 2. Générer le paiement d'assurance pour la traçabilité
                        PaymentInvoice::create([
                            'invoice_id'       => $split->invoice_id,
                            'invoice_split_id' => $split->id,
                            'reception_id'     => $receptionId,
                            'amount'           => $split->amount_to_pay,
                            'payment_method'   => 'INSURANCE', // Moteur de paiement
                        ]);

                        // 3. Vérifier si la Facture Mère est désormais totalement soldée
                        $invoice = $split->invoice;
                        $hasUnpaidSplits = InvoiceSplit::where('invoice_id', $invoice->id)
                                            ->where('status', 'UNPAID')
                                            ->exists();
                        
                        // Si le patient a déjà payé sa part, la facture globale passe à PAID !
                        if (!$hasUnpaidSplits && $invoice->status !== 'PAID') {
                            $invoice->update(['status' => 'PAID']);
                        }
                    }
                }
            }

            return response()->json(['message' => 'Bordereau mis à jour avec succès.', 'data' => $claim], 200);
        });
    }

    #[OA\Get(path: "/api/shared/invoice-splits/unclaimed", summary: "Récupérer les parts assurances non réclamées", security: [["sanctum" => []]])]
    public function getUnclaimedSplits(Request $request)
    {
        $request->validate([
            'insurance_company_id' => 'required|integer',
            'claim_month'          => 'required|date_format:Y-m' 
        ]);

        $splits = InvoiceSplit::with(['invoice.patient'])
            ->where('type', 'INSURANCE')
            ->where('status', 'UNPAID')
            ->whereNull('guarantor_claim_id')
            ->whereHas('invoice.patient.coverages', function ($q) use ($request) {
                $q->where('insurance_company_id', $request->insurance_company_id);
            })
            ->whereHas('invoice', function ($q) use ($request) {
                $endOfMonth = Carbon::createFromFormat('Y-m', $request->claim_month)->endOfMonth();
                $q->where('created_at', '<=', $endOfMonth);
            })
            ->get();  

        return response()->json($splits, 200);
    }

    #[OA\Delete(path: "/api/shared/guarantor-claims/{id}", summary: "Supprimer un bordereau (DRAFT uniquement)", security: [["sanctum" => []]])]
    public function destroy($id)
    {
        $claim = GuarantorClaim::findOrFail($id);

        if ($claim->status !== 'DRAFT') {
            return response()->json(['message' => 'Impossible de supprimer un bordereau déjà soumis ou payé.'], 403);
        }

        return DB::transaction(function () use ($claim) {
            $claim->invoiceSplits()->update(['guarantor_claim_id' => null]);
            $claim->delete();

            return response()->json(['message' => 'Bordereau supprimé. Les factures sont de nouveau en attente de réclamation.'], 200);
        });
    }

    #[OA\Get(path: "/api/shared/guarantor-claims/{id}/download", summary: "Générer le PDF du bordereau d'assurance", security: [["sanctum" => []]])]
    public function downloadPdf(Request $request, $id)
    {
        $claim = GuarantorClaim::with([
            'insuranceCompany', 
            'center.hospital',
            'invoiceSplits.invoice.patient'
        ])->findOrFail($id);

        $action = $request->query('action', 'stream');

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

        $pdf = Pdf::loadView('pdf.guarantor_claim', $data)->setPaper('a4', 'landscape');

        $fileName = 'Bordereau_' . str_replace(' ', '_', $claim->insuranceCompany->name) . '_' . date('m_Y', strtotime($claim->claim_month)) . '.pdf';

        return $action === 'download' ? $pdf->download($fileName) : $pdf->stream($fileName);
    }
}