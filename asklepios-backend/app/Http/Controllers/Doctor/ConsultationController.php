<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Hospital\Consultation;
use App\Models\Hospital\PatientVisit;
use App\Models\Hospital\Admission;
use App\Models\Hospital\PerformedMedicalAct;
use App\Models\Hospital\BloodTransfusion;
use App\Models\Hospital\BloodBag;
use App\Models\Hospital\MedicalBackground;
use App\Http\Services\PrescriptionService;
use App\Http\Services\ExamRequestService;
use App\Http\Services\BloodTransfusionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;
use Exception;

#[OA\Tag(name: "Consultations Médicales", description: "API de gestion des consultations, incluant la création simultanée d'ordonnances, d'examens, d'actes médicaux et de transfusions.")]
class ConsultationController extends Controller
{
    protected $prescriptionService;
    protected $examService;
    protected $transfusionService;

    // Injection des services
    public function __construct(
        PrescriptionService $prescriptionService, 
        ExamRequestService $examService,
        BloodTransfusionService $transfusionService 
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
    #[OA\Response(response: 200, description: "Liste des consultations récupérée avec succès")]
    #[OA\Response(response: 403, description: "Accès refusé : Profil médecin introuvable")]
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
    #[OA\Response(response: 201, description: "Consultation finalisée et enregistrée avec succès")]
    #[OA\Response(response: 403, description: "Accès refusé : Profil médecin introuvable")]
    #[OA\Response(response: 422, description: "Erreur de validation (ex: Groupe sanguin inconnu ou poche de sang incompatible)")]
    #[OA\Response(response: 500, description: "Erreur serveur lors de l'enregistrement")]
    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user->profile_doctor) {
            return response()->json(['message' => 'Accès refusé : Profil médecin introuvable.'], 403);
        }

        // 1. Validation stricte
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

            'blood_transfusions'                       => 'nullable|array',
            'blood_transfusions.*.blood_bag_id'        => 'required_with:blood_transfusions|integer|exists:blood_bags,id',
            'blood_transfusions.*.start_time'          => 'nullable|date',
        ]);

        // 2. Identification anticipée du patient pour validation médicale
        $patientId = null;
        if (!empty($validated["patient_visit_id"])) {
            $patientId = PatientVisit::where('id', $validated['patient_visit_id'])->value('patient_id');
        } else {
            $patientId = Admission::where('id', $validated["admission_id"])->value('patient_id');
        }

        // 3. Validation de Compatibilité Sanguine (Bloquant)
        if (!empty($validated['blood_transfusions'])) {
            $medicalBg = MedicalBackground::where('patient_id', $patientId)->first();

            if (!$medicalBg || empty($medicalBg->blood_type) || $medicalBg->blood_type === 'UNKNOWN') {
                return response()->json([
                    'message' => "Transfusion impossible : Le groupe sanguin du patient n'est pas défini dans ses antécédents médicaux."
                ], 422);
            }

            $patientBloodType = $medicalBg->blood_type;

            foreach ($validated['blood_transfusions'] as $transfusion) {
                $bag = BloodBag::find($transfusion['blood_bag_id']);
                
                if (!$this->isBloodCompatible($patientBloodType, $bag->blood_type)) {
                    return response()->json([
                        'message' => "Incompatibilité majeure : Le patient (Groupe {$patientBloodType}) ne peut pas recevoir la poche sélectionnée (Groupe {$bag->blood_type})."
                    ], 422);
                }
            }
        }

        try {
            // 4. Transaction DB
            $consultation = DB::transaction(function () use ($validated, $user, $patientId) {
                
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
                    
                    $this->examService->createExamRequest(
                        $consult->id, 
                        $validated['exams'],
                        $user->profile_doctor->id,
                        $validated['patient_visit_id'] ?? null,
                        $patientId,
                        $laboratoryId,
                        $validated['admission_id'] ?? null // 👉 Transmet l'ID d'hospitalisation au service
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

                // E. Traitement des Transfusions Sanguines
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

                // F. Clôturer la visite du patient si c'est une visite externe
                if (!empty($validated['patient_visit_id'])) {
                    PatientVisit::where('id', $validated['patient_visit_id'])
                        ->update(['status' => 'COMPLETE']);
                }

                return $consult->load([
                    'prescriptions.prescriptionLines', 
                    'examRequests.examRequestLines',
                    'bloodTransfusions'
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
        summary: "Voir les détails d'une consultation, incluant l'historique de transfusion du patient",
        security: [["sanctum" => []]],
        tags: ["Consultations Médicales"]
    )]
    #[OA\Response(response: 200, description: "Détails de la consultation récupérés avec succès")]
    #[OA\Response(response: 404, description: "Consultation introuvable")]
    public function show($id)
    {
        $user = auth()->user();
        
        $consultation = Consultation::with([
            'patientVisit.patient.medicalBackground', 
            'patientVisit.performedMedicalActs.medicalActCatalog', 
            'admission.patient.medicalBackground',
            'admission.performedMedicalActs.medicalActCatalog', 
            'prescriptions.prescriptionLines.article', 
            'examRequests.examRequestLines',
            'bloodTransfusions.bloodBag' 
        ])
        ->where('profile_doctor_id', $user->profile_doctor->id ?? 0)
        ->findOrFail($id);

        $patientId = $consultation->patientVisit->patient_id ?? $consultation->admission->patient_id ?? null;
        $transfusionHistory = [];

        if ($patientId) {
            $transfusionHistory = BloodTransfusion::with(['bloodBag', 'consultation.profileDoctor.user'])
                ->whereHas('consultation', function ($query) use ($patientId) {
                    $query->whereHas('patientVisit', function ($subQ) use ($patientId) {
                        $subQ->where('patient_id', $patientId);
                    })->orWhereHas('admission', function ($subQ) use ($patientId) {
                        $subQ->where('patient_id', $patientId);
                    });
                })
                ->orderBy('created_at', 'desc')
                ->get();
        }

        $responseData = $consultation->toArray();
        $responseData['patient_transfusion_history'] = $transfusionHistory;

        return response()->json($responseData);
    }

    #[OA\Put(
        path: "/api/doctor/consultations/{id}",
        summary: "Mettre à jour les notes cliniques",
        security: [["sanctum" => []]],
        tags: ["Consultations Médicales"]
    )]
    #[OA\Response(response: 200, description: "Dossier clinique mis à jour avec succès")]
    #[OA\Response(response: 404, description: "Consultation introuvable")]
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
        summary: "Supprimer une consultation",
        security: [["sanctum" => []]],
        tags: ["Consultations Médicales"]
    )]
    #[OA\Response(response: 200, description: "Consultation annulée avec succès")]
    #[OA\Response(response: 422, description: "Impossible de supprimer (Consultation déjà facturée)")]
    #[OA\Response(response: 404, description: "Consultation introuvable")]
    #[OA\Response(response: 500, description: "Erreur serveur lors de la suppression")]
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
                
                // Remettre les poches de sang associées au statut AVAILABLE
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
    
    /**
     * Vérifie la compatibilité ABO/Rhésus entre le receveur et le donneur.
     * 
     * @param string $recipientType (Le groupe sanguin du patient)
     * @param string $donorType (Le groupe sanguin de la poche)
     * @return bool
     */
    private function isBloodCompatible(string $recipientType, string $donorType): bool
    {
        // Matrice universelle de compatibilité des globules rouges (ABO / Rh)
        $compatibilityMatrix = [
            'AB+' => ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Receveur universel
            'AB-' => ['O-', 'A-', 'B-', 'AB-'],
            'A+'  => ['O-', 'O+', 'A-', 'A+'],
            'A-'  => ['O-', 'A-'],
            'B+'  => ['O-', 'O+', 'B-', 'B+'],
            'B-'  => ['O-', 'B-'],
            'O+'  => ['O-', 'O+'],
            'O-'  => ['O-'] // Donneur universel (ne reçoit que O-)
        ];

        return in_array($donorType, $compatibilityMatrix[$recipientType] ?? []);
    }
}