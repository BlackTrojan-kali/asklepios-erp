<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Http\Services\InvoiceService;
use App\Http\Services\InvoicePdfService;
use App\Models\Hospital\Admission;
use App\Models\Hospital\Consultation;
use App\Models\Hospital\Invoice;
use App\Models\Hospital\PerformedMedicalAct;
use App\Models\PatientCoverage; // Pour le Tiers Payant
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Exception;
use Illuminate\Support\Facades\Auth;

#[OA\Tag(name: "Facturation", description: "Génération, historique et impression des factures")]
class InvoiceController extends Controller
{
    protected $invoiceService;
    protected $invoicePdfService;

    public function __construct(InvoiceService $invoiceService, InvoicePdfService $invoicePdfService)
    {
        $this->invoiceService = $invoiceService;
        $this->invoicePdfService = $invoicePdfService;
    }

    /**
     * Récupère l'ID de l'hôpital selon le profil de l'utilisateur connecté
     */
    private function getHospitalId()
    {
        $user = Auth::user();
    
        if ($user->profile_admin) return $user->profile_admin->hospital_id;
        if ($user->profile_reception) return $user->profile_reception->hospital_id;
        if ($user->profile_doctor) return $user->profile_doctor->hospital_id;
        abort(403, "Profil non autorisé à accéder aux ressources financières.");
    }

    private function getCenterId()
    {
        $user = Auth::user();
        if($user->profile_doctor) return $user->profile_doctor->center_id;
        if($user->profile_reception) return $user->profile_reception->center_id;
        
        return null; // Sécurité si c'est un admin global par exemple
    }

   #[OA\Get(
        path: "/api/shared/invoices",
        summary: "Historique des factures (Paginé et filtrable)",
        description: "Filtres disponibles selon le rôle : center_id (Réception), patient_id (Docteur), ou global (Admin).",
        security: [["sanctum" => []]],
        tags: ["Facturation"]
    )]
    #[OA\Parameter(name: "center_id", in: "query", required: false, description: "Filtrer par centre (Cliniq/Succursale)", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "patient_id", in: "query", required: false, description: "Filtrer par patient spécifique", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "patient_code", in: "query", required: false, description: "Filtrer par code patient (ex: H1-0001)", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "status", in: "query", required: false, description: "Filtrer par statut (UNPAID, PAID)", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Liste récupérée avec succès")]
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        $user = auth()->user();

        // Sécurité de base : On reste confiné au périmètre de l'hôpital de l'utilisateur connecté
        // Chargement des 'splits' pour calculer automatiquement part patient et assurance
        $query = Invoice::whereHas('patient', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->with([
            'patient',
            'center',
            'payments.reception.user',
            'labRequests.profileDoctor.user',
            'consultations.profileDoctor.user',
            'splits'
        ]);
        
        // --- APPLICATION DES RESTRICTIONS DE RÔLES & FILTRES ---

        // 1. Si c'est la Réception : Restriction stricte au centre où elle travaille
        if ($user->profile_reception) {
            $query->where('center_id', $user->profile_reception->center_id);
        } 
        // 2. Si c'est un Docteur : Il peut filtrer par patient pour son suivi
        elseif ($user->profile_doctor) {
            if ($request->filled('patient_id')) {
                $query->where('patient_id', $request->patient_id);
            }
        }
        // 3. Si c'est l'Admin : Accès total, il peut filtrer par n'importe quel centre de son hôpital
        elseif ($user->profile_admin) {
            if ($request->filled('center_id')) {
                $query->where('center_id', $request->center_id);
            }
        }

        // Filtre optionnel sur le statut de paiement (PAID / UNPAID)
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filtre optionnel sur le type de facture (LABORATORY / CONSULTATION)
        if ($request->filled('type')) {
            if ($request->type === 'LABORATORY') {
                $query->whereHas('labRequests');
            } elseif ($request->type === 'CONSULTATION') {
                $query->whereDoesntHave('labRequests');
            }
        }

        // Filtre par code patient (Recherche via la relation "patient")
        if ($request->filled('patient_code')) {
            $query->whereHas('patient', function($q) use ($request) {
                // On utilise LIKE pour permettre une recherche partielle
                $q->where('patient_code', 'like', '%' . $request->patient_code . '%');
            });
        }

        $query->orderBy('created_at', 'desc');

        $perPage = $request->query('per_page', 15);
        return response()->json($query->paginate($perPage), 200);
    }

    #[OA\Get(
        path: "/api/shared/invoices/{id}",
        summary: "Prévisualiser les détails d'une facture",
        security: [["sanctum" => []]],
        tags: ["Facturation"]
    )]
    #[OA\Response(response: 200, description: "Élément récupéré avec succès")]
    public function show($id)
    {
        $hospitalId = $this->getHospitalId();

        // Récupération de la facture avec chargement complet de toutes ses composantes
        $invoice = Invoice::whereHas('patient', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->with([
            'patient',
            'center',
            'consultations.profileDoctor.user',
            'performedMedicalActs.medicalActCatalog', 
            'performedMedicalActs.equipment',
            'admissions.bed.facilityRoom.category',
            'labRequests.lines.test.category',
            'payments.reception.user', // Historique des encaissements sur cette facture
            'splits.guarantorClaim' // Chargement des divisions (Tiers payant)
        ])->findOrFail($id);

        return response()->json($invoice, 200);
    }

    #[OA\Get(
        path: "/api/shared/invoices/{id}/download",
        summary: "Télécharger ou afficher la facture au format PDF détaillé",
        security: [["sanctum" => []]],
        tags: ["Facturation"]
    )]
    #[OA\Parameter(name: "action", in: "query", required: false, description: "values: 'stream' (aperçu) ou 'download' (télécharger)", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "PDF généré avec succès")]
    public function downloadPdf(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();
        
        // Vérification d'existence et de propriété
        $invoice = Invoice::whereHas('patient', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        $action = $request->query('action', 'stream');
        if (!in_array($action, ['stream', 'download'])) {
            $action = 'stream';
        }

        return $this->invoicePdfService->generateInvoicePdf($invoice->id, $action);
    }

    #[OA\Get(
        path: "/api/shared/patients/{patientId}/unbilled-preview",
        summary: "Prévisualiser les éléments non facturés d'un patient",
        security: [["sanctum" => []]],
        tags: ["Facturation"]
    )]
    #[OA\Response(response: 200, description: "Éléments récupérés avec succès")]
    public function previewUnbilledForPatient($patientId)
    {
        // 1. Consultations non facturées
        $consultationsCount = Consultation::where(function($query) use ($patientId) {
            $query->whereHas('patientVisit', function($subQ) use ($patientId) {
                $subQ->where('patient_id', $patientId);
            })->orWhereHas('admission', function($subQ) use ($patientId) {
                $subQ->where('patient_id', $patientId);
            });
        })->where('is_billed', false)->whereNull('invoice_id')->count();
        
        // 2. Actes médicaux non facturés
        $actsTotal = PerformedMedicalAct::where(function($query) use ($patientId) {
            $query->whereHas('patientVisit', function($subQ) use ($patientId) {
                $subQ->where('patient_id', $patientId);
            })->orWhereHas('admission', function($subQ) use ($patientId) {
                $subQ->where('patient_id', $patientId);
            });
        })->where('is_billed', false)->whereNull('invoice_id')->sum('applied_price');

        // 3. Admissions (frais de séjour / chambre) non facturées
        $admissions = Admission::with('bed.facilityRoom.category')
            ->where('patient_id', $patientId)
            ->where('is_billed', false)
            ->whereNull('invoice_id')
            ->get();
        
        $admissionsTotal = 0;
        foreach ($admissions as $admission) {
            $room = $admission->bed->facilityRoom ?? null;
            $nightPrice = $room && $room->category ? $room->category->price_per_night : 0;
            
            $startDate = \Carbon\Carbon::parse($admission->admission_date);
            $endDate = $admission->actual_discharge_date ? \Carbon\Carbon::parse($admission->actual_discharge_date) : now();
            
            $nights = max(1, $startDate->diffInDays($endDate));
            $admissionsTotal += ($nightPrice * $nights);
        }

        // Récupération des assurances actives pour informer la réception
        $activeCoverages = PatientCoverage::with('insuranceCompany')
            ->where('patient_id', $patientId)
            ->where('is_active', true)
            ->whereDate('valid_until', '>=', now())
            ->orderBy('priority_order', 'asc')
            ->get();

        return response()->json([
            'unbilled_consultations_count' => $consultationsCount,
            'unbilled_acts_total'          => $actsTotal,
            'unbilled_admissions_total'    => $admissionsTotal,
            'total_without_consultation'   => $actsTotal + $admissionsTotal,
            'active_coverages'             => $activeCoverages
        ]);
    }

    #[OA\Post(path: "/api/shared/patients/{patientId}/generate-invoice", summary: "Générer une facture globale pour un patient")]
    #[OA\Response(response: 201, description: "Facture générée avec succès")]
    public function generateForPatient(Request $request, $patientId)
    {
        $request->validate(['consultation_price' => 'nullable|numeric|min:0']);
        $price = $request->input('consultation_price', 0);
        $centerId = $this->getCenterId();

        try {
            $invoice = $this->invoiceService->generateInvoiceForPatient($patientId, $price, $centerId);
            
            // On recharge la facture fraîchement créée avec ses relations (dont les divisions de paiement)
            $invoice->load(['splits', 'patient']);

            return response()->json([
                'message' => 'Facture générée avec succès.',
                'data'    => $invoice
            ], 201);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    #[OA\Post(path: "/api/shared/visits/{visitId}/generate-invoice", summary: "Générer une facture pour une visite spécifique")]
    #[OA\Response(response: 201, description: "Facture générée avec succès")]
    public function generateForVisit(Request $request, $visitId)
    {
        $request->validate(['consultation_price' => 'nullable|numeric|min:0']);
        $price = $request->input('consultation_price', 0);

        try {
            $invoice = $this->invoiceService->generateInvoiceForVisit($visitId, $price);
            
            // On recharge la facture fraîchement créée avec ses relations (dont les divisions de paiement)
            $invoice->load(['splits', 'patient']);

            return response()->json([
                'message' => 'Facture de visite générée avec succès.',
                'data'    => $invoice
            ], 201);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    #[OA\Delete(
        path: "/api/shared/invoices/{id}",
        summary: "Annuler une facture proforma non payée",
        description: "Supprime une facture au statut UNPAID et libère automatiquement les actes.",
        security: [["sanctum" => []]],
        tags: ["Facturation"]
    )]
    
    #[OA\Put(
        path: "/api/shared/invoices/{id}",
        summary: "Mettre à jour une facture",
        security: [["sanctum" => []]],
        tags: ["Facturation"]
    )]
    public function update(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);
        
        $validated = $request->validate([
            'total_amount' => 'nullable|numeric|min:0',
            'center_id'    => 'nullable|integer',
        ]);

        $user = auth()->user();
        $centerId = $validated['center_id'] ?? $this->getCenterId() ?? $user->profile_reception?->center_id;

        if ($centerId) {
            $invoice->center_id = $centerId;
        }

        if (isset($validated['total_amount']) && $validated['total_amount'] > 0) {
            $invoice->total_amount = $validated['total_amount'];
        }

        $invoice->save();

        return response()->json([
            'message' => 'Facture mise à jour avec succès.',
            'data'    => $invoice
        ], 200);
    }

    #[OA\Response(response: 200, description: "élément supprimé avec succès")]
    public function destroy($id)
    {
        try {
            $this->invoiceService->cancelInvoice($id);

            return response()->json([
                'message' => 'La facture a été annulée avec succès. Les soins associés ont été remis en attente.'
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'L\'annulation de la facture a échoué.',
                'error'   => $e->getMessage()
            ], 422);
        }
    }
}