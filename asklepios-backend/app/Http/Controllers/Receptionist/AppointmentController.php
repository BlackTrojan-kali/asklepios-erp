<?php

namespace App\Http\Controllers\Receptionist;

use App\Http\Controllers\Controller;
use App\Http\Services\PatientAdmissionService;
use App\Models\Hospital\Appointment;
use App\Models\Hospital\PatientVisit;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Validation\Rule;

#[OA\Tag(name: "Gestion des Rendez-vous", description: "Planification, admission et suivi des rendez-vous des patients")]
class AppointmentController extends Controller
{
    protected PatientAdmissionService $admissionService;

    public function __construct(PatientAdmissionService $admissionService)
    {
        $this->admissionService = $admissionService;
    }

    /**
     * Détermine les centres autorisés selon le rôle
     */
    private function getAllowedCenterIds(Request $request)
    {
        $user = auth()->user();
        
        if ($user->profile_admin) {
            // L'admin peut filtrer par centre, sinon on retourne null pour cibler son hôpital
            return $request->filled('center_id') ? [$request->center_id] : null; 
        }

        if ($user->profile_reception) return [$user->profile_reception->center_id];
        if ($user->profile_doctor) return [$user->profile_doctor->center_id];

        abort(403, "Accès non autorisé.");
    }

    /**
     * Liste filtrable des rendez-vous
     */
    #[OA\Get(
        path: "/api/appointments",
        operationId: "getAppointments",
        summary: "Lister les rendez-vous",
        description: "Récupère la liste paginée des rendez-vous. Filtrage automatique par centre selon le rôle de l'utilisateur connecté.",
        security: [["bearerAuth" => []]],
        tags: ["Gestion des Rendez-vous"]
    )]
    #[OA\Parameter(name: "date", in: "query", required: false, description: "Filtrer par date précise (ex: 2026-06-25)", schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Parameter(name: "status", in: "query", required: false, description: "Filtrer par statut", schema: new OA\Schema(type: "string", enum: ["SCHEDULED", "CANCELLED", "ARRIVED"]))]
    #[OA\Parameter(name: "profile_doctor_id", in: "query", required: false, description: "Filtrer par médecin spécifique", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "center_id", in: "query", required: false, description: "Filtrer par centre (Réservé aux Administrateurs)", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste des rendez-vous récupérée avec succès")]
    public function index(Request $request)
    {
        $allowedCenterIds = $this->getAllowedCenterIds($request);

        $query = Appointment::with(['patient.medicalBackground', 'doctor.user', 'center',"visit"]);

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        } else {
            // Logique Admin : On limite aux centres de son hôpital
            $hospitalId = auth()->user()->profile_admin->hospital_id;
            $query->whereHas('center', function($q) use ($hospitalId) {
                $q->where('hospital_id', $hospitalId);
            });
        }

        // Filtres optionnels
        if ($request->filled('date')) {
            $query->whereDate('scheduled_datetime', $request->query('date'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('profile_doctor_id')) {
            $query->where('profile_doctor_id', $request->query('profile_doctor_id'));
        }

        $query->orderBy('scheduled_datetime', 'asc');

        return response()->json($query->paginate($request->query('per_page', 15)), 200);
    }

    /**
     * Programmer un nouveau rendez-vous
     */
    #[OA\Post(
        path: "/api/appointments",
        operationId: "storeAppointment",
        summary: "Programmer un rendez-vous",
        description: "Crée un nouveau rendez-vous avec le statut 'SCHEDULED' par défaut.",
        security: [["bearerAuth" => []]],
        tags: ["Gestion des Rendez-vous"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["patient_id", "profile_doctor_id", "center_id", "scheduled_datetime"],
            properties: [
                new OA\Property(property: "patient_id", type: "integer", example: 1),
                new OA\Property(property: "profile_doctor_id", type: "integer", example: 3),
                new OA\Property(property: "center_id", type: "integer", example: 1),
                new OA\Property(property: "scheduled_datetime", type: "string", format: "date-time", example: "2026-06-25 14:30:00"),
                new OA\Property(property: "reason", type: "string", example: "Consultation de suivi cardiologique")
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Rendez-vous programmé avec succès")]
    #[OA\Response(response: 422, description: "Erreur de validation (ex: date dans le passé)")]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id'         => 'required|exists:patients,id',
            'profile_doctor_id'  => 'required|exists:profile_doctors,id',
            'center_id'          => 'required|exists:centers,id',
            'scheduled_datetime' => 'required|date|after:now',
            'reason'             => 'nullable|string|max:255',
        ]);

        $validated['status'] = 'SCHEDULED';
        $appointment = Appointment::create($validated);

        return response()->json(['message' => 'Rendez-vous programmé avec succès.', 'data' => $appointment], 201);
    }

    /**
     * Mettre à jour un rendez-vous (Motif, Docteur, Centre)
     */
    #[OA\Put(
        path: "/api/appointments/{id}",
        operationId: "updateAppointment",
        summary: "Modifier les détails d'un rendez-vous",
        description: "Permet de modifier le motif, le médecin ou le centre d'un rendez-vous existant. Ne modifie pas la date/heure.",
        security: [["bearerAuth" => []]],
        tags: ["Gestion des Rendez-vous"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID du rendez-vous", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "profile_doctor_id", type: "integer", example: 4),
                new OA\Property(property: "center_id", type: "integer", example: 2),
                new OA\Property(property: "reason", type: "string", example: "Nouveau motif de consultation")
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Rendez-vous mis à jour avec succès")]
    public function update(Request $request, $id)
    {
        $appointment = Appointment::findOrFail($id);

        $validated = $request->validate([
            'profile_doctor_id' => 'sometimes|required|exists:profile_doctors,id',
            'center_id'         => 'sometimes|required|exists:centers,id',
            'reason'            => 'nullable|string|max:255',
        ]);

        $appointment->update($validated);
        return response()->json(['message' => 'Rendez-vous mis à jour.', 'data' => $appointment], 200);
    }

    /**
     * Reprogrammer (Changer la date/heure)
     */
    #[OA\Put(
        path: "/api/appointments/{id}/reschedule",
        operationId: "rescheduleAppointment",
        summary: "Reprogrammer un rendez-vous",
        description: "Modifie la date et l'heure d'un rendez-vous. Si le rendez-vous était annulé, son statut repasse à 'SCHEDULED'.",
        security: [["bearerAuth" => []]],
        tags: ["Gestion des Rendez-vous"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID du rendez-vous", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["scheduled_datetime"],
            properties: [
                new OA\Property(property: "scheduled_datetime", type: "string", format: "date-time", example: "2026-06-30 09:00:00")
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Rendez-vous reprogrammé avec succès")]
    public function reschedule(Request $request, $id)
    {
        $appointment = Appointment::findOrFail($id);
        
        $validated = $request->validate([
            'scheduled_datetime' => 'required|date|after:now',
        ]);

        // Si le rendez-vous était annulé, on le repasse en planifié
        $validated['status'] = 'SCHEDULED'; 

        $appointment->update($validated);
        return response()->json(['message' => 'Rendez-vous reprogrammé.', 'data' => $appointment], 200);
    }

    /**
     * Annuler un rendez-vous
     */
    #[OA\Patch(
        path: "/api/appointments/{id}/cancel",
        operationId: "cancelAppointment",
        summary: "Annuler un rendez-vous",
        description: "Change le statut d'un rendez-vous en 'CANCELLED'. Impossible d'annuler si le patient est déjà 'ARRIVED'.",
        security: [["bearerAuth" => []]],
        tags: ["Gestion des Rendez-vous"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID du rendez-vous", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Rendez-vous annulé avec succès")]
    #[OA\Response(response: 422, description: "Impossible d'annuler un rendez-vous en cours")]
    public function cancel($id)
    {
        $appointment = Appointment::findOrFail($id);
        
        if ($appointment->status === 'ARRIVED') {
            return response()->json(['message' => 'Impossible d\'annuler un rendez-vous pour un patient déjà sur place.'], 422);
        }

        $appointment->update(['status' => 'CANCELLED']);
        return response()->json(['message' => 'Rendez-vous annulé.'], 200);
    }

    /**
     * Admettre le patient en salle d'attente
     */
    #[OA\Post(
        path: "/api/appointments/{appointmentId}/admit",
        operationId: "admitToWaitingRoom",
        summary: "Admettre un patient en salle d'attente",
        description: "Marque le rendez-vous comme 'ARRIVED', assigne le patient à une salle d'attente, calcule son numéro de file et notifie le médecin.",
        security: [["bearerAuth" => []]],
        tags: ["Gestion des Rendez-vous"]
    )]
    #[OA\Parameter(name: "appointmentId", in: "path", required: true, description: "ID du rendez-vous", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["waiting_room_id", "visit_type"],
            properties: [
                new OA\Property(property: "waiting_room_id", type: "integer", description: "ID de la salle d'attente (facility_room)", example: 1),
                new OA\Property(property: "visit_type", type: "string", enum: ["ROUTINE", "EMERGENCY", "FOLLOW_UP"], example: "ROUTINE")
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Patient admis avec succès")]
    public function admitToWaitingRoom(Request $request, $appointmentId)
    {
        $validated = $request->validate([
            'waiting_room_id' => 'required|exists:facility_rooms,id',
            'visit_type'      => ['required', Rule::in(['ROUTINE', 'EMERGENCY', 'FOLLOW_UP'])],
        ]);

        $appointment = Appointment::findOrFail($appointmentId);
        
        // On sécurise l'admission avec l'ID du réceptionniste actuel
        // Note: Assure-toi que la méthode getHospitalId ci-dessus ou un middleware empêche un docteur d'admettre
     $receptionistId = auth()->user()->profile_reception->id ?? 1; 

       // if (!$receptionistId) {
         //    return response()->json(['message' => 'Seul le personnel de la réception peut admettre un patient.'], 403);
        //}

        $visit = $this->admissionService->admitToWaitingRoom(
            $appointment->patient_id,
            $appointment->center_id,
            $receptionistId,
            $validated['waiting_room_id'],
            $validated['visit_type'],
            $appointment->id
        );

        return response()->json(['message' => 'Patient admis en salle d\'attente.', 'data' => $visit], 200);
    }

    /**
     * Admettre le patient en consultation
     */
    #[OA\Patch(
        path: "/api/visits/{visitId}/consultation",
        operationId: "admitToConsultation",
        summary: "Admettre un patient en consultation",
        description: "Passe le statut de la visite à 'IN_CONSULTATION' et assigne le bureau médical.",
        security: [["bearerAuth" => []]],
        tags: ["Gestion des Rendez-vous"]
    )]
    #[OA\Parameter(name: "visitId", in: "path", required: true, description: "ID de la visite (patient_visit)", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["consulting_room_id"],
            properties: [
                new OA\Property(property: "consulting_room_id", type: "integer", description: "ID du bureau de consultation (facility_room)", example: 2)
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Patient entré en consultation avec succès")]
    public function admitToConsultation(Request $request, $visitId)
    {
        $validated = $request->validate([
            'consulting_room_id' => 'required|exists:facility_rooms,id',
        ]);

        $visit = PatientVisit::findOrFail($visitId);
        
        $visit->update([
            'status'             => 'IN_CONSULTATION',
            'consulting_room_id' => $validated['consulting_room_id']
        ]);

        return response()->json(['message' => 'Patient entré en consultation.', 'data' => $visit], 200);
    }

    /**
     * Exporter le calendrier filtré en PDF
     */
    #[OA\Get(
        path: "/api/appointments/export-pdf",
        operationId: "exportAppointmentsPdf",
        summary: "Télécharger le calendrier des rendez-vous en PDF",
        description: "Génère un document PDF affichant les rendez-vous selon les filtres (date, centre).",
        security: [["bearerAuth" => []]],
        tags: ["Gestion des Rendez-vous"]
    )]
    #[OA\Parameter(name: "date", in: "query", required: false, description: "Date spécifique pour le PDF", schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Parameter(name: "center_id", in: "query", required: false, description: "Filtrer par centre (Admin)", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Fichier PDF généré pour le téléchargement")]
    public function exportPdf(Request $request)
    {
        $allowedCenterIds = $this->getAllowedCenterIds($request);
        $query = Appointment::with(['patient', 'doctor.user', 'center']);

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        if ($request->filled('date')) {
            $query->whereDate('scheduled_datetime', $request->query('date'));
        }

        // On trie par date puis par heure
        $appointments = $query->orderBy('scheduled_datetime', 'asc')->get();

        // On groupe par Date (ex: "2026-06-27") pour l'affichage visuel du calendrier
        $groupedAppointments = $appointments->groupBy(function($item) {
            return $item->scheduled_datetime->format('Y-m-d');
        });

        $pdf = Pdf::loadView('pdf.appointments-calendar', [
            'groupedAppointments' => $groupedAppointments,
            'date_filter'       => $request->query('date', 'Toutes les dates')
        ]);

        return $pdf->download('calendrier_rendez_vous.pdf');
    }
    /**
     * Récupérer les rendez-vous d'un patient spécifique
     */
    #[OA\Get(
        path: "/api/shared/patients/{patientId}/appointments",
        operationId: "getPatientAppointments",
        summary: "Lister les rendez-vous d'un patient",
        description: "Récupère l'historique paginé des rendez-vous d'un patient donné.",
        security: [["bearerAuth" => []]],
        tags: ["Gestion des Rendez-vous"]
    )]
    #[OA\Parameter(name: "patientId", in: "path", required: true, description: "ID du patient", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste des rendez-vous du patient récupérée avec succès")]
    public function patientAppointments(Request $request, $patientId)
    {
        $allowedCenterIds = $this->getAllowedCenterIds($request);

        // On filtre directement sur le patient_id
        $query = Appointment::with(['doctor.user', 'center', 'visit'])
                            ->where('patient_id', $patientId);

        // Application de la sécurité des centres (même logique que l'index)
        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        } else {
            $hospitalId = auth()->user()->profile_admin->hospital_id;
            $query->whereHas('center', function($q) use ($hospitalId) {
                $q->where('hospital_id', $hospitalId);
            });
        }

        // On trie du plus récent au plus ancien par défaut pour l'historique
        $query->orderBy('scheduled_datetime', 'desc');

        return response()->json($query->paginate($request->query('per_page', 15)), 200);
    }
}