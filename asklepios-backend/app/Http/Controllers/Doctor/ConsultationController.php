<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Hospital\Consultation;
use App\Models\Hospital\PatientVisit;
use App\Models\Hospital\Admission;
use App\Models\Hospital\PerformedMedicalAct;
use App\Models\Hospital\BloodTransfusion;
use App\Models\Hospital\BloodBag;
use App\Http\Services\PrescriptionService;
use App\Http\Services\ExamRequestService;
use App\Http\Services\BloodTransfusionService; // 👉 Ajout du service
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;
use Exception;

#[OA\Tag(name: "Consultations Médicales", description: "API de gestion des consultations, incluant la création simultanée d'ordonnances, d'examens, d'actes médicaux et de transfusions.")]
class ConsultationController extends Controller
{
    protected $prescriptionService;
    protected $examService;
    protected $transfusionService; // 👉 Ajout de la propriété

    // Injection des services
    public function __construct(
        PrescriptionService $prescriptionService, 
        ExamRequestService $examService,
        BloodTransfusionService $transfusionService // 👉 Injection
    ) {
        $this->prescriptionService = $prescriptionService;
        $this->examService = $examService;
        $this->transfusionService = $transfusionService;
    }

    #[OA\Get(
        path: "/api/doctor/consultations",
        summary: "Lister les consultations du médecin",
        security: [["sanctum" => []]],
        tags: ["Consultations Médicales"]
    )]
    public function index(Request $request)
    {
        $user = auth()->user();
        if (!$user->profile_doctor) {
            return response()->json(['message' => 'Profil médecin introuvable.'], 403);
        }

        $query = Consultation::with([
                'patientVisit.patient', 
                'admission.patient'
            ])
            ->where('profile_doctor_id', $user->profile_doctor->id);

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        if ($request->filled('patient_id')) {
            $patientId = $request->patient_id;
            
            $query->where(function($q) use ($patientId) {
                $q->whereHas('patientVisit', function($subQ) use ($patientId) {
                    $subQ->where('patient_id', $patientId);
                })
                ->orWhereHas('admission', function($subQ) use ($patientId) {
                    $subQ->where('patient_id', $patientId);
                });
            });
        }

        $perPage = $request->query('per_page', 15);
        return response()->json($query->orderBy('created_at', 'desc')->paginate($perPage));
    }

    #[OA\Post(
        path: "/api/doctor/consultations",
        summary: "Enregistrer une nouvelle consultation complète",
        security: [["sanctum" => []]],
        tags: ["Consultations Médicales"]
    )]
    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user->profile_doctor) {
            return response()->json(['message' => 'Accès refusé : Profil médecin introuvable.'], 403);
        }

        // 1. Validation stricte (Visite OU Admission)
        $validated = $request->validate([
            'patient_visit_id'   => 'required_without:admission_id|nullable|integer|exists:patient_visits,id',
            'admission_id'       => 'required_without:patient_visit_id|nullable|integer|exists:admissions,id',
            
            'chief_complaint'    => 'required|string',
            'clinical_data'      => 'nullable|array',
            'consultation_price' => 'nullable|numeric|min:0',
            
            'prescriptions'                            => 'nullable|array',
            'prescriptions.*.article_id'               => 'nullable|integer|exists:articles,id',
            'prescriptions.*.custom_medication_name'   => 'nullable|string|required_without:prescriptions.*.article_id',
            'prescriptions.*.dosage'                   => 'required_with:prescriptions|string',

            'exams'                                    => 'nullable|array',
            'exams.*.exam_name'                        => 'required_with:exams|string',
            'exams.*.send_to_internal_lab'             => 'nullable|boolean',
            'exams.*.lab_test_id'                      => 'nullable|integer|exists:lab_tests,id',

            'medical_acts'                             => 'nullable|array',
            'medical_acts.*.medical_act_catalog_id'    => 'required_with:medical_acts|integer|exists:medical_act_catalogs,id',
            'medical_acts.*.equipment_id'              => 'nullable|integer|exists:equipments,id', 
            'medical_acts.*.applied_price'             => 'required_with:medical_acts|numeric|min:0',

            // 👉 NOUVEAU : Validation des transfusions
            'blood_transfusions'                       => 'nullable|array',
            'blood_transfusions.*.blood_bag_id'        => 'required_with:blood_transfusions|integer|exists:blood_bags,id',
            'blood_transfusions.*.start_time'          => 'nullable|date',
        ]);

        try {
            // 2. Transaction DB pour garantir l'intégrité
            $consultation = DB::transaction(function () use ($validated, $user) {
                
                // A. Création de la consultation
                $consult = Consultation::create([
                    'patient_visit_id'   => $validated['patient_visit_id'] ?? null,
                    'admission_id'       => $validated['admission_id'] ?? null,
                    'profile_doctor_id'  => $user->profile_doctor->id,
                    'chief_complaint'    => $validated['chief_complaint'],
                    'clinical_data'      => $validated['clinical_data'] ?? [],
                    'consultation_price' => $validated['consultation_price'] ?? 0.0,
                ]);

                // B. Traitement des Ordonnances
                if (!empty($validated['prescriptions'])) {
                    $this->prescriptionService->createPrescription($consult->id, $validated['prescriptions']);
                }

                // C. Traitement des Examens
                if (!empty($validated['exams'])) {
                    $laboratoryId = null;
                    if ($user->profile_doctor->center_id) {
                        $lab = \App\Models\Laboratory\Laboratory::where('center_id', $user->profile_doctor->center_id)->first();
                        $laboratoryId = $lab ? $lab->id : null;
                    }
                    
                    $patientId = 0;
                    if (!empty($validated["patient_visit_id"])) {
                        $patientVisit = PatientVisit::find($validated['patient_visit_id']);
                        $patientId = $patientVisit->patient_id; // 👉 CORRECTION: Récupération de patient_id
                    } else {
                        $admission = Admission::find($validated["admission_id"]);
                        $patientId = $admission->patient_id;
                    }

                    $this->examService->createExamRequest(
                        $consult->id, 
                        $validated['exams'],
                        $user->profile_doctor->id,
                        $validated['patient_visit_id'] ?? null,
                        $patientId,
                        $laboratoryId
                    );
                }

                // D. Traitement des Actes Médicaux Réalisés
                if (!empty($validated['medical_acts'])) {
                    foreach ($validated['medical_acts'] as $act) {
                        PerformedMedicalAct::create([
                            'patient_visit_id'       => $validated['patient_visit_id'] ?? null,
                            'admission_id'           => $validated['admission_id'] ?? null,
                            'medical_act_catalog_id' => $act['medical_act_catalog_id'],
                            'equipment_id'           => $act['equipment_id'] ?? null,
                            'applied_price'          => $act['applied_price'],
                        ]);
                    }
                }

                // 👉 NOUVEAU : E. Traitement des Transfusions Sanguines
                if (!empty($validated['blood_transfusions'])) {
                    $centerId = $user->profile_doctor->center_id;
                    
                    foreach ($validated['blood_transfusions'] as $transfusion) {
                        $this->transfusionService->initiateTransfusion([
                            'consultation_id' => $consult->id,
                            'center_id'       => $centerId,
                            'blood_bag_id'    => $transfusion['blood_bag_id'],
                            'start_time'      => $transfusion['start_time'] ?? now(),
                        ]);
                    }
                }

                // F. Clôturer la visite du patient UNIQUEMENT si c'est une visite classique
                if (!empty($validated['patient_visit_id'])) {
                    PatientVisit::where('id', $validated['patient_visit_id'])
                        ->update(['status' => 'COMPLETE']);
                }

                return $consult->load([
                    'prescriptions.prescriptionLines', 
                    'examRequests.examRequestLines',
                    'bloodTransfusions' // 👉 Ajout de la relation pour la réponse JSON
                ]);
            });

            return response()->json([
                'message' => 'La consultation a été finalisée et enregistrée avec succès.',
                'data' => $consultation
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Une erreur est survenue lors de l\'enregistrement.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    #[OA\Get(
        path: "/api/doctor/consultations/{id}",
        summary: "Voir les détails d'une consultation"
    )]
    public function show($id)
    {
        $user = auth()->user();
        
        $consultation = Consultation::with([
            'patientVisit.patient',
            'patientVisit.performedMedicalActs.medicalActCatalog', 
            'admission.patient',
            'admission.performedMedicalActs.medicalActCatalog', 
            'prescriptions.prescriptionLines.article', 
            'examRequests.examRequestLines',
            'bloodTransfusions.bloodBag' // 👉 Ajout du chargement des transfusions
        ])
        ->where('profile_doctor_id', $user->profile_doctor->id ?? 0)
        ->findOrFail($id);

        return response()->json($consultation);
    }

    #[OA\Put(
        path: "/api/doctor/consultations/{id}",
        summary: "Mettre à jour les notes cliniques"
    )]
    public function update(Request $request, $id)
    {
        $user = auth()->user();

        $consultation = Consultation::where('profile_doctor_id', $user->profile_doctor->id ?? 0)
            ->findOrFail($id);

        $validated = $request->validate([
            'chief_complaint' => 'sometimes|required|string',
            'clinical_data'   => 'sometimes|nullable|array',
        ]);

        $consultation->update($validated);

        return response()->json([
            'message' => 'Dossier clinique mis à jour avec succès.',
            'data' => $consultation
        ]);
    }

    #[OA\Delete(
        path: "/api/doctor/consultations/{id}",
        summary: "Supprimer une consultation"
    )]
    public function destroy($id)
    {
        $user = auth()->user();

        $consultation = Consultation::where('profile_doctor_id', $user->profile_doctor->id ?? 0)
            ->findOrFail($id);

        if ($consultation->is_billed || $consultation->invoice_id !== null) {
            return response()->json([
                'message' => 'Impossible de supprimer cette consultation car elle a déjà été facturée ou est en cours de paiement.'
            ], 422);
        }

        try {
            DB::transaction(function () use ($consultation) {
                
                // 👉 NOUVEAU : Remettre les poches de sang associées au statut AVAILABLE
                $transfusions = BloodTransfusion::where('consultation_id', $consultation->id)->get();
                foreach($transfusions as $transfusion) {
                    BloodBag::where('id', $transfusion->blood_bag_id)->update(['status' => 'AVAILABLE']);
                }

                if ($consultation->patient_visit_id) {
                    $visitId = $consultation->patient_visit_id;

                    PerformedMedicalAct::where('patient_visit_id', $visitId)
                        ->where('is_billed', false)
                        ->delete();

                    PatientVisit::where('id', $visitId)
                        ->update(['status' => 'IN_CONSULTATION']);
                        
                } elseif ($consultation->admission_id) {
                    // Les actes restent attachés à l'admission.
                    // Les ordonnances, examens et transfusions sont supprimés via la contrainte onDelete('cascade') de la DB.
                }

                $consultation->delete();
            });

            return response()->json([
                'message' => 'Consultation annulée avec succès. Les poches de sang ont été remises en stock.'
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression de la consultation.',
                'error' => $e->getMessage()
            ], 500);
        }
    }                                        
}