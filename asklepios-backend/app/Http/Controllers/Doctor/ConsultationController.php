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
        description: "Récupère l'historique des consultations effectuées par le médecin connecté (inclut les visites classiques et les hospitalisations).",
        security: [["sanctum" => []]],
        tags: ["Consultations Médicales"]
    )]
    #[OA\Parameter(name: "date", in: "query", required: false, description: "Filtrer par date (ex: 2026-07-17)", schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Parameter(name: "patient_id", in: "query", required: false, description: "Filtrer par patient", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste récupérée avec succès")]
    public function index(Request $request)
    {
        $user = auth()->user();
        if (!$user->profile_doctor) {
            return response()->json(['message' => 'Profil médecin introuvable.'], 403);
        }

        // 👉 MISE À JOUR : On "Eager Load" le patient depuis les deux flux possibles
        $query = Consultation::with([
                'patientVisit.patient', 
                'admission.patient'
            ])
            ->where('profile_doctor_id', $user->profile_doctor->id);

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        // 👉 MISE À JOUR : On filtre par patient si l'ID est fourni par le front-end
        if ($request->filled('patient_id')) {
            $patientId = $request->patient_id;
            
            // On utilise un groupe logique (where) pour faire un "OU" entre les deux relations
            // afin de ne pas casser les autres filtres de la requête principale.
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

        // 1. Validation stricte et flexible (Visite OU Admission)
        $validated = $request->validate([
            // L'un des deux est obligatoire
            'patient_visit_id'   => 'required_without:admission_id|nullable|integer|exists:patient_visits,id',
            'admission_id'       => 'required_without:patient_visit_id|nullable|integer|exists:admissions,id',
            
            'chief_complaint'    => 'required|string',
            'clinical_data'      => 'nullable|array',
            'consultation_price' => 'nullable|numeric|min:0',
            
            // Validation des prescriptions
            'prescriptions'                          => 'nullable|array',
            'prescriptions.*.article_id'             => 'nullable|integer|exists:articles,id',
            'prescriptions.*.custom_medication_name' => 'nullable|string|required_without:prescriptions.*.article_id',
            'prescriptions.*.dosage'                 => 'required_with:prescriptions|string',

            // Validation des examens
            'exams'                          => 'nullable|array',
            'exams.*.exam_name'              => 'required_with:exams|string',
            'exams.*.send_to_internal_lab'   => 'nullable|boolean',
            'exams.*.lab_test_id'            => 'nullable|integer|exists:lab_tests,id',

            // Validation des actes médicaux réalisés
            'medical_acts'                            => 'nullable|array',
            'medical_acts.*.medical_act_catalog_id'   => 'required_with:medical_acts|integer|exists:medical_act_catalogs,id',
            'medical_acts.*.equipment_id'             => 'nullable|integer|exists:equipments,id', 
            'medical_acts.*.applied_price'            => 'required_with:medical_acts|numeric|min:0',
        ]);

        try {
            // 2. Transaction DB pour garantir l'intégrité
            $consultation = DB::transaction(function () use ($validated, $user) {
                
                // A. Création de la consultation (liée à la visite OU à l'admission)
                $consult = Consultation::create([
                    'patient_visit_id'   => $validated['patient_visit_id'] ?? null,
                    'admission_id'       => $validated['admission_id'] ?? null, // 👉 AJOUT
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
                    
                    $patientVisit = \App\Models\Hospital\PatientVisit::find($validated['patient_visit_id']);

                    $this->examService->createExamRequest(
                        $consult->id, 
                        $validated['exams'],
                        $user->profile_doctor->id,
                        $validated['patient_visit_id'],
                        $patientVisit->patient_id ?? null,
                        $laboratoryId
                    );
                }

                // D. Traitement des Actes Médicaux Réalisés
                if (!empty($validated['medical_acts'])) {
                    foreach ($validated['medical_acts'] as $act) {
                        PerformedMedicalAct::create([
                            'patient_visit_id'       => $validated['patient_visit_id'] ?? null,
                            'admission_id'           => $validated['admission_id'] ?? null, // 👉 AJOUT
                            'medical_act_catalog_id' => $act['medical_act_catalog_id'],
                            'equipment_id'           => $act['equipment_id'] ?? null,
                            'applied_price'          => $act['applied_price'],
                        ]);
                    }
                }

                // =================================================================
                // E. Clôturer la visite du patient UNIQUEMENT si c'est une visite classique
                // =================================================================
                if (!empty($validated['patient_visit_id'])) {
                    \App\Models\Hospital\PatientVisit::where('id', $validated['patient_visit_id'])
                                ->update(['status' => 'COMPLETE']);
                }

                return $consult->load([
                    'prescriptions.prescriptionLines', 
                    'examRequests.examRequestLines'
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
        
        // 👉 MISE À JOUR : Eager loading des deux flux (Visite OU Admission)
        $consultation = Consultation::with([
            'patientVisit.patient',
            'patientVisit.performedMedicalActs.medicalActCatalog', 
            'admission.patient',
            'admission.performedMedicalActs.medicalActCatalog', 
            'prescriptions.prescriptionLines.article', // Bonus : Chargement de l'article pour le nom du médicament
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

    #[OA\Delete(
        path: "/api/doctor/consultations/{id}",
        summary: "Supprimer une consultation",
        description: "Annule et supprime une consultation si elle n'est pas encore facturée.",
        security: [["sanctum" => []]],
        tags: ["Consultations Médicales"]
    )]
    #[OA\Response(response: 200, description: "Consultation supprimée avec succès")]
    #[OA\Response(response: 422, description: "Impossible de supprimer une consultation déjà facturée")]
    public function destroy($id)
    {
        $user = auth()->user();

        // Récupérer la consultation en s'assurant qu'elle appartient bien à ce docteur
        $consultation = Consultation::where('profile_doctor_id', $user->profile_doctor->id ?? 0)
            ->findOrFail($id);

        // 1. Vérification stricte : est-elle associée à une facture ?
        if ($consultation->is_billed || $consultation->invoice_id !== null) {
            return response()->json([
                'message' => 'Impossible de supprimer cette consultation car elle a déjà été facturée ou est en cours de paiement.'
            ], 422);
        }

        try {
            DB::transaction(function () use ($consultation) {
                
                // 👉 MISE À JOUR : Logique conditionnelle selon le contexte (Visite ou Admission)
                if ($consultation->patient_visit_id) {
                    
                    $visitId = $consultation->patient_visit_id;

                    // Supprimer les actes médicaux liés à cette visite spécifique qui ne sont pas facturés
                    \App\Models\Hospital\PerformedMedicalAct::where('patient_visit_id', $visitId)
                        ->where('is_billed', false)
                        ->delete();

                    // Restaurer le statut de la visite pour permettre au médecin de recommencer
                    \App\Models\Hospital\PatientVisit::where('id', $visitId)
                        ->update(['status' => 'IN_CONSULTATION']);
                        
                } elseif ($consultation->admission_id) {
                    // ⚠️ ATTENTION : Dans le cadre d'une hospitalisation, on ne supprime PAS tous les actes
                    // non facturés de l'admission. En effet, le patient peut être là depuis 3 jours,
                    // et des actes infirmiers légitimes pourraient être en attente de facturation.
                    // On se contente donc de supprimer uniquement la consultation (Ordonnances et Examens 
                    // seront supprimés en cascade grâce au onDelete('cascade') de la DB).
                }

                // Supprimer la consultation elle-même
                $consultation->delete();
            });

            return response()->json([
                'message' => 'Consultation annulée avec succès.'
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression de la consultation.',
                'error' => $e->getMessage()
            ], 500);
        }
    }                                         
}