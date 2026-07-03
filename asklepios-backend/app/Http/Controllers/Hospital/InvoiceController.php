<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Http\Services\InvoiceService;
use App\Http\Services\InvoicePdfService;
use App\Models\Hospital\Admission;
use App\Models\Hospital\Consultation;
use App\Models\Hospital\Invoice;
use App\Models\Hospital\PerformedMedicalAct;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Exception;

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
        $user = auth()->user();
        if ($user->profile_admin) return $user->profile_admin->hospital_id;
        if ($user->profile_reception) return $user->profile_reception->hospital_id;
        if ($user->profile_doctor) return $user->profile_doctor->hospital_id;
        
        abort(403, "Profil non autorisé à accéder aux ressources financières.");
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
    #[OA\Parameter(name: "status", in: "query", required: false, description: "Filtrer par statut (UNPAID, PAID)", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Liste récupérée avec succès")]
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        $user = auth()->user();

        // Sécurité de base : On reste confiné au périmètre de l'hôpital de l'utilisateur connecté
        // 👉 AJOUT CRITIQUE : 'payments' est ajouté au with() pour optimiser les Accessors (total_paid, remaining_debt)
        $query = Invoice::whereHas('patient', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->with(['patient', 'center', 'payments']);

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
    
    #[OA\Response(response: 200, description: "element récupéré avec succès")]
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
            'payments.reception.user' // Historique des encaissements sur cette facture
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
    
    #[OA\Response(response: 200, description: "element récupéré avec succès")]
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
        path: "/api/shared/visits/{visitId}/unbilled-preview",
        summary: "Prévisualiser les éléments non facturés d'une visite",
        security: [["sanctum" => []]],
        tags: ["Facturation"]
    )]
    #[OA\Get(path: "/api/shared/patients/{patientId}/unbilled-preview")]
    
    #[OA\Response(response: 200, description: "element récupérée avec succès")]
    public function previewUnbilledForPatient($patientId)
    {
        // Consultations non facturées de TOUTES les visites du patient
        $consultationsCount = Consultation::whereHas('patientVisit', function($q) use ($patientId) {
            $q->where('patient_id', $patientId);
        })->where('is_billed', false)->count();

        // Actes non facturés
        $actsTotal = PerformedMedicalAct::whereHas('visit', function($q) use ($patientId) {
            $q->where('patient_id', $patientId);
        })->where('is_billed', false)->sum('applied_price');

        $admissions = Admission::with('bed.facilityRoom.category')
            ->where('patient_id', $patientId)
            ->where('is_billed', false)
            ->get();
        
        $admissionsTotal = 0;
        foreach ($admissions as $admission) {
            $room = $admission->bed->facilityRoom;
            // 👉 CORRECTION ICI : price_per_night au lieu de base_price
            $nightPrice = $room && $room->category ? $room->category->price_per_night : 0;
            
            $startDate = \Carbon\Carbon::parse($admission->admission_date);
            $endDate = $admission->actual_discharge_date ? \Carbon\Carbon::parse($admission->actual_discharge_date) : now();
            
            // Calcul du nombre de nuits (Minimum 1)
            $nights = max(1, $startDate->diffInDays($endDate));
            
            $admissionsTotal += ($nightPrice * $nights);
        }
        return response()->json([
            'unbilled_consultations_count' => $consultationsCount,
            'unbilled_acts_total'          => $actsTotal,
            'unbilled_admissions_total'    => $admissionsTotal,
            'total_without_consultation'   => $actsTotal + $admissionsTotal
        ]);
    }

    #[OA\Post(path: "/api/shared/patients/{patientId}/generate-invoice")]
    
    #[OA\Response(response: 201, description: "element crée avec succès")]
    public function generateForPatient(Request $request, $patientId)
    {
        $request->validate(['consultation_price' => 'nullable|numeric|min:0']);
        $price = $request->input('consultation_price', 0);

        try {
            $invoice = $this->invoiceService->generateInvoiceForPatient($patientId, $price);
            return response()->json([
                'message' => 'Facture générée avec succès.',
                'data'    => $invoice
            ], 201);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
    // 👉 LA MÉTHODE MANQUANTE POUR ANNULER LA FACTURE 
    #[OA\Delete(
        path: "/api/shared/invoices/{id}",
        summary: "Annuler une facture proforma non payée",
        description: "Supprime une facture au statut UNPAID et libère automatiquement les actes.",
        security: [["sanctum" => []]],
        tags: ["Facturation"]
    )]
    
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