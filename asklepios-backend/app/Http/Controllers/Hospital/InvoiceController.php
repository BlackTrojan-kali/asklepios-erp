<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Http\Services\InvoiceService;
use App\Http\Services\InvoicePdfService;
use App\Http\Services\Security\ScopeResolver;
use App\Models\Hospital\Admission;
use App\Models\Hospital\Consultation;
use App\Models\Hospital\Invoice;
use App\Models\Hospital\PerformedMedicalAct;
use App\Models\Laboratory\LabRequest;
use App\Models\PatientCoverage;
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
        return null;
    }

    #[OA\Get(path: "/api/shared/invoices", summary: "Historique des factures", security: [["sanctum" => []]], tags: ["Facturation"])]
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        $user = auth()->user();

        $query = Invoice::whereHas('patient', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->with([
            'patient', 'center', 'payments.reception.user',
            'labRequests.profileDoctor.user', 'consultations.profileDoctor.user', 'splits'
        ]);
        
        $query = ScopeResolver::applyCenterScope($query,"center_id");
        if ($user->profile_reception) {
            $query->where('center_id', $user->profile_reception->center_id);
        } elseif ($user->profile_doctor) {
            if ($request->filled('patient_id')) $query->where('patient_id', $request->patient_id);
        } elseif ($user->profile_admin) {
            if ($request->filled('center_id')) $query->where('center_id', $request->center_id);
        }

        if ($request->filled('status')) $query->where('status', $request->status);
        
        if ($request->filled('type')) {
            if ($request->type === 'LABORATORY') $query->whereHas('labRequests');
            elseif ($request->type === 'CONSULTATION') $query->whereDoesntHave('labRequests');
        }

        if ($request->filled('patient_code')) {
            $query->whereHas('patient', function($q) use ($request) {
                $q->where('patient_code', 'like', '%' . $request->patient_code . '%');
            });
        }

        $query->orderBy('created_at', 'desc');

        return response()->json($query->paginate($request->query('per_page', 15)), 200);
    }

    #[OA\Get(path: "/api/shared/invoices/{id}", summary: "Prévisualiser les détails", security: [["sanctum" => []]], tags: ["Facturation"])]
    public function show($id)
    {
        $hospitalId = $this->getHospitalId();

        $invoice = Invoice::whereHas('patient', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->with([
            'patient', 'center', 'consultations.profileDoctor.user',
            'performedMedicalActs.medicalActCatalog', 'performedMedicalActs.equipment',
            'admissions.bed.facilityRoom.category', 'labRequests.lines.test.category',
            'payments.reception.user', 'splits.guarantorClaim'
        ])->findOrFail($id);

        return response()->json($invoice, 200);
    }

    #[OA\Get(path: "/api/shared/invoices/{id}/download", summary: "Télécharger le PDF", security: [["sanctum" => []]], tags: ["Facturation"])]
    public function downloadPdf(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();
        
        $invoice = Invoice::whereHas('patient', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        $action = $request->query('action', 'stream');
        if (!in_array($action, ['stream', 'download'])) $action = 'stream';

        return $this->invoicePdfService->generateInvoicePdf($invoice->id, $action);
    }

    #[OA\Get(path: "/api/shared/patients/{patientId}/unbilled-preview", summary: "Aperçu des impayés", security: [["sanctum" => []]], tags: ["Facturation"])]
    public function previewUnbilledForPatient($patientId)
    {
        $consultationsCount = Consultation::where(function($query) use ($patientId) {
            $query->whereHas('patientVisit', fn($subQ) => $subQ->where('patient_id', $patientId))
                  ->orWhereHas('admission', fn($subQ) => $subQ->where('patient_id', $patientId));
        })->where('is_billed', false)->whereNull('invoice_id')->count();
        
        $actsTotal = PerformedMedicalAct::where(function($query) use ($patientId) {
            $query->whereHas('patientVisit', fn($subQ) => $subQ->where('patient_id', $patientId))
                  ->orWhereHas('admission', fn($subQ) => $subQ->where('patient_id', $patientId));
        })->where('is_billed', false)->whereNull('invoice_id')->sum('applied_price');

        $admissions = Admission::with('bed.facilityRoom.category')
            ->where('patient_id', $patientId)->where('is_billed', false)->whereNull('invoice_id')->get();
        
        $admissionsTotal = 0;
        foreach ($admissions as $admission) {
            $room = $admission->bed->facilityRoom ?? null;
            $nightPrice = $room && $room->category ? $room->category->price_per_night : 0;
            $startDate = \Carbon\Carbon::parse($admission->admission_date);
            $endDate = $admission->actual_discharge_date ? \Carbon\Carbon::parse($admission->actual_discharge_date) : now();
            $nights = max(1, $startDate->diffInDays($endDate));
            $admissionsTotal += ($nightPrice * $nights);
        }

        $activeCoverages = PatientCoverage::with('insuranceCompany')
            ->where('patient_id', $patientId)->where('is_active', true)
            ->whereDate('valid_until', '>=', now())->orderBy('priority_order', 'asc')->get();

        return response()->json([
            'unbilled_consultations_count' => $consultationsCount,
            'unbilled_acts_total'          => $actsTotal,
            'unbilled_admissions_total'    => $admissionsTotal,
            'unbilled_labs_total'          => 0, // Isolé
            'total_without_consultation'   => $actsTotal + $admissionsTotal,
            'active_coverages'             => $activeCoverages
        ]);
    }

    #[OA\Post(path: "/api/shared/invoices", summary: "Créer une facture manuellement", security: [["sanctum" => []]], tags: ["Facturation"])]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'total_amount' => 'nullable|numeric|min:0',
            'consultation_price' => 'nullable|numeric|min:0',
            'center_id'    => 'nullable|integer',
        ]);

        $user = auth()->user();
        $centerId = $validated['center_id'] ?? $this->getCenterId() ?? $user->profile_reception?->center_id;

        $invoice = Invoice::create([
            'patient_id'   => $validated['patient_id'],
            'center_id'    => $centerId,
            'total_amount' => $validated['total_amount'] ?? 0,
            'status'       => 'UNPAID'
        ]);

        $consultationPrice = $request->input('consultation_price', $request->input('price', 0));
        $this->invoiceService->linkUnbilledItemsToInvoice($invoice, (float)$consultationPrice);
        $this->invoiceService->recalculateSplits($invoice->id);

        $invoice->load(['splits', 'patient']);

        return response()->json(['message' => 'Facture créée avec succès.', 'data' => $invoice], 201);
    }

    #[OA\Post(path: "/api/shared/patients/{patientId}/generate-invoice", summary: "Générer une facture globale pour un patient", security: [["sanctum" => []]], tags: ["Facturation"])]
    public function generateForPatient(Request $request, $patientId)
    {
        // 👉 Sécurité : On accepte le champ 'consultation_price' ou 'price' selon ce que le frontend envoie
        $price = $request->input('consultation_price', $request->input('price', 0));
        $centerId = $this->getCenterId();

        try {
            $invoice = $this->invoiceService->generateInvoiceForPatient($patientId, (float)$price, $centerId);
            $invoice->load(['splits', 'patient']);

            return response()->json(['message' => 'Facture générée avec succès.', 'data' => $invoice], 201);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    #[OA\Post(path: "/api/shared/visits/{visitId}/generate-invoice", summary: "Générer une facture pour une visite", security: [["sanctum" => []]], tags: ["Facturation"])]
    public function generateForVisit(Request $request, $visitId)
    {
        $price = $request->input('consultation_price', $request->input('price', 0));

        try {
            $invoice = $this->invoiceService->generateInvoiceForVisit($visitId, (float)$price);
            $invoice->load(['splits', 'patient']);

            return response()->json(['message' => 'Facture générée avec succès.', 'data' => $invoice], 201);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    #[OA\Put(path: "/api/shared/invoices/{id}", summary: "Mettre à jour une facture", security: [["sanctum" => []]], tags: ["Facturation"])]
    public function update(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);
        
        $validated = $request->validate([
            'total_amount' => 'nullable|numeric|min:0',
            'center_id'    => 'nullable|integer',
        ]);

        $user = auth()->user();
        $centerId = $validated['center_id'] ?? $this->getCenterId() ?? $user->profile_reception?->center_id;

        if ($centerId) $invoice->center_id = $centerId;
        if (isset($validated['total_amount']) && $validated['total_amount'] > 0) {
            $invoice->total_amount = $validated['total_amount'];
        }

        $invoice->save();

        $this->invoiceService->recalculateSplits($invoice->id);

        $invoice->load(['splits', 'patient']);

        return response()->json(['message' => 'Facture mise à jour avec succès.', 'data' => $invoice], 200);
    }

    #[OA\Delete(path: "/api/shared/invoices/{id}", summary: "Annuler une facture", security: [["sanctum" => []]], tags: ["Facturation"])]
    public function destroy($id)
    {
        try {
            $this->invoiceService->cancelInvoice($id);
            return response()->json(['message' => 'La facture a été annulée. Les actes ont été libérés.'], 200);
        } catch (Exception $e) {
            return response()->json(['message' => 'L\'annulation a échoué.', 'error' => $e->getMessage()], 422);
        }
    }
}