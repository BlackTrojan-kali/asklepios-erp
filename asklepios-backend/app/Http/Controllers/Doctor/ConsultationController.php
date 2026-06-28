<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Hospital\Consultation;
use App\Models\Hospital\PatientVisit;
use App\Models\Hospital\PerformedMedicalAct;
use App\Http\Services\PrescriptionService;
use App\Http\Services\ExamRequestService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;
use Exception;

#[OA\Tag(name: "Consultations Médicales", description: "API de gestion des consultations, incluant la création simultanée d'ordonnances, d'examens et d'actes médicaux.")]
class ConsultationController extends Controller
{
    protected $prescriptionService;
    protected $examService;

    // Injection des services
    public function __construct(PrescriptionService $prescriptionService, ExamRequestService $examService)
    {
        $this->prescriptionService = $prescriptionService;
        $this->examService = $examService;
    }

    #[OA\Get(
        path: "/api/doctor/consultations",
        summary: "Lister les consultations du médecin",
        description: "Récupère l'historique des consultations effectuées par le médecin connecté.",
        security: [["sanctum" => []]],
        tags: ["Consultations Médicales"]
    )]
    #[OA\Response(response: 200, description: "Liste récupérée avec succès")]
   public function index(Request $request)
    {
        $user = auth()->user();
        if (!$user->profile_doctor) {
            return response()->json(['message' => 'Profil médecin introuvable.'], 403);
        }

        $query = Consultation::with(['patientVisit.patient'])
            ->where('profile_doctor_id', $user->profile_doctor->id);

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        // 👇 NOUVEAU : On filtre par patient si l'ID est fourni par le front-end
        if ($request->filled('patient_id')) {
            $query->whereHas('patientVisit', function($q) use ($request) {
                $q->where('patient_id', $request->patient_id);
            });
        }

        $perPage = $request->query('per_page', 15);
        return response()->json($query->orderBy('created_at', 'desc')->paginate($perPage));
    }

    #[OA\Post(
        path: "/api/doctor/consultations",
        summary: "Enregistrer une nouvelle consultation complète",
        description: "Crée la consultation, génère les ordonnances, les examens, enregistre les actes et clôture la visite.",
        security: [["sanctum" => []]],
        tags: ["Consultations Médicales"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "patient_visit_id", type: "integer", example: 1),
                new OA\Property(property: "chief_complaint", type: "string", example: "Maux de tête intenses"),
                new OA\Property(property: "clinical_data", type: "object"),
                new OA\Property(property: "medical_acts", type: "array", items: new OA\Items(
                    properties: [
                        new OA\Property(property: "medical_act_catalog_id", type: "integer"),
                        new OA\Property(property: "equipment_id", type: "integer", nullable: true),
                        new OA\Property(property: "applied_price", type: "number")
                    ]
                ))
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Consultation finalisée avec succès")]
    #[OA\Response(response: 422, description: "Erreur de validation ou visite déjà traitée")]
    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user->profile_doctor) {
            return response()->json(['message' => 'Accès refusé : Profil médecin introuvable.'], 403);
        }

        // 1. Validation stricte
        $validated = $request->validate([
            'patient_visit_id'   => 'required|integer|exists:patient_visits,id',
            'chief_complaint'    => 'required|string',
            'clinical_data'      => 'nullable|array',
            'consultation_price' => 'nullable|numeric|min:0',
            
            // Validation des prescriptions
            'prescriptions'                          => 'nullable|array',
            'prescriptions.*.article_id'             => 'nullable|integer|exists:articles,id',
            'prescriptions.*.custom_medication_name' => 'nullable|string|required_without:prescriptions.*.article_id',
            'prescriptions.*.dosage'                 => 'required_with:prescriptions|string',

            // Validation des examens
            'exams'               => 'nullable|array',
            'exams.*.exam_name'   => 'required_with:exams|string',

            // Validation des actes médicaux réalisés
            'medical_acts'                          => 'nullable|array',
            'medical_acts.*.medical_act_catalog_id' => 'required_with:medical_acts|integer|exists:medical_act_catalogs,id',
            'medical_acts.*.equipment_id'           => 'nullable|integer|exists:equipments,id', 
            'medical_acts.*.applied_price'          => 'required_with:medical_acts|numeric|min:0',
        ]);

        // Empêcher de faire 2 consultations sur la même visite
        if (Consultation::where('patient_visit_id', $validated['patient_visit_id'])->exists()) {
            return response()->json([
                'message' => 'Une consultation a déjà été enregistrée pour cette visite.'
            ], 422);
        }

        try {
            // 2. Transaction DB pour garantir l'intégrité
            $consultation = DB::transaction(function () use ($validated, $user) {
                
                // A. Création de la consultation
                $consult = Consultation::create([
                    'patient_visit_id'   => $validated['patient_visit_id'],
                    'profile_doctor_id'  => $user->profile_doctor->id,
                    'chief_complaint'    => $validated['chief_complaint'],
                    'clinical_data'      => $validated['clinical_data'] ?? [],
                    'consultation_price' => $validated['consultation_price'] ?? 0.0, // Par défaut 0 si non envoyé par le front
                ]);

                // B. Traitement des Ordonnances
                if (!empty($validated['prescriptions'])) {
                    $this->prescriptionService->createPrescription($consult->id, $validated['prescriptions']);
                }

                // C. Traitement des Examens
                if (!empty($validated['exams'])) {
                    $this->examService->createExamRequest($consult->id, $validated['exams']);
                }

                // D. Traitement des Actes Médicaux Réalisés
                if (!empty($validated['medical_acts'])) {
                    foreach ($validated['medical_acts'] as $act) {
                        PerformedMedicalAct::create([
                            'patient_visit_id'       => $validated['patient_visit_id'],
                            'medical_act_catalog_id' => $act['medical_act_catalog_id'],
                            'equipment_id'           => $act['equipment_id'] ?? null,
                            'applied_price'          => $act['applied_price'],
                        ]);
                    }
                }

                // =================================================================
                // E. CRITIQUE : Clôturer la visite du patient (Flux Front-End)
                // =================================================================
                PatientVisit::where('id', $validated['patient_visit_id'])
                            ->update(['status' => 'COMPLETE']);

                return $consult->load([
                    'prescriptions.prescriptionLines', 
                    'examRequests.examRequestLines',
                    'patientVisit.performedMedicalActs'
                ]);
            });

            // 3. Réponse
            return response()->json([
                'message' => 'La consultation a été finalisée et enregistrée avec succès.',
                'data' => $consultation
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Une erreur critique est survenue lors de l\'enregistrement.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    #[OA\Get(
        path: "/api/doctor/consultations/{id}",
        summary: "Voir les détails d'une consultation",
        security: [["sanctum" => []]],
        tags: ["Consultations Médicales"]
    )]
    #[OA\Response(response: 200, description: "Elements recupere avec success")]
    public function show($id)
    {
        $user = auth()->user();
        
        $consultation = Consultation::with([
            'patientVisit.patient',
            'patientVisit.performedMedicalActs.medicalActCatalog', 
            'prescriptions.prescriptionLines',
            'examRequests.examRequestLines'
        ])
        ->where('profile_doctor_id', $user->profile_doctor->id ?? 0)
        ->findOrFail($id);

        return response()->json($consultation);
    }

    #[OA\Put(
        path: "/api/doctor/consultations/{id}",
        summary: "Mettre à jour les notes cliniques",
        description: "Permet au médecin de corriger ses notes cliniques après coup.",
        security: [["sanctum" => []]],
        tags: ["Consultations Médicales"]
    )]
    #[OA\Response(response: 200, description: "OK")]
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
}