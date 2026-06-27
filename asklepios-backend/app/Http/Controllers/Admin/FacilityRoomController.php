<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Hospital\FacilityRoom;
use App\Models\Hospital\RoomCategory;
use App\Http\Services\WaitingRoomService; // Ajout du service
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Salles et Installations", description: "Gestion des salles, bureaux et chambres d'hospitalisation")]
class FacilityRoomController extends Controller
{
    protected $waitingRoomService;

    public function __construct(WaitingRoomService $waitingRoomService)
    {
        $this->waitingRoomService = $waitingRoomService;
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
        
        abort(403, "Profil non autorisé à accéder aux ressources de l'hôpital.");
    }

    /**
     * Initialiser les salles d'attente manquantes pour tout l'hôpital
     */
    #[OA\Post(
        path: "/api/admin/facility-rooms/sync-waiting-rooms",
        operationId: "syncWaitingRooms",
        summary: "Créer les salles d'attente manquantes",
        description: "Parcourt tous les départements de l'hôpital et crée une salle de type WAITING_ROOM pour ceux qui n'en ont pas.",
        security: [["bearerAuth" => []]],
        tags: ["Salles et Installations"]
    )]
    #[OA\Response(response: 200, description: "Synchronisation terminée avec succès")]
    public function syncWaitingRooms()
    {
        // Seul l'admin devrait pouvoir faire ça, on sécurise via getHospitalId qui le permet,
        // mais le middleware de la route bloquera les autres profils.
        $hospitalId = $this->getHospitalId();

        $createdCount = $this->waitingRoomService->createMissingForHospital($hospitalId);

        return response()->json([
            'message' => "Synchronisation terminée.",
            'rooms_created' => $createdCount
        ], 200);
    }

    /**
     * Lister les salles d'un département spécifique (Paginé et filtrable)
     */
    #[OA\Get(
        path: "/api/shared/departments/{departmentId}/facility-rooms",
        operationId: "getFacilityRooms",
        summary: "Lister les salles d'un département",
        security: [["bearerAuth" => []]],
        tags: ["Salles et Installations"]
    )]
    #[OA\Parameter(name: "departmentId", in: "path", required: true, description: "ID du département", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Recherche par nom", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "type", in: "query", required: false, description: "Filtrer par type (WAITING_ROOM, CONSULTATION, WARD)", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "paginated", in: "query", required: false, description: "true/false pour react-select", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Liste récupérée avec succès")]
    public function index(Request $request, $departmentId)
    {
        $hospitalId = $this->getHospitalId();

        // 1. Vérification de sécurité : Le département appartient-il bien à cet hôpital ?
        $department = Department::whereHas('center', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($departmentId);

        // 2. Construction de la requête
        $query = FacilityRoom::where('department_id', $department->id)->with('category');

        // Filtre de recherche par nom
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where('name', 'like', "%{$search}%");
        }

        // Filtre exact par type
        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        $query->latest();

        // Mode liste plate (pour React-Select ou affichage dossier/fichier frontend)
        if ($request->query('paginated') === 'false') {
            return response()->json($query->get(), 200);
        }

        // Mode paginé par défaut
        $perPage = $request->query('per_page', 15);
        return response()->json($query->paginate($perPage), 200);
    }

    /**
     * Créer une nouvelle salle (Admin uniquement)
     */
    #[OA\Post(
        path: "/api/admin/facility-rooms",
        operationId: "storeFacilityRoom",
        summary: "Créer une salle",
        security: [["bearerAuth" => []]],
        tags: ["Salles et Installations"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["department_id", "name", "type"],
            properties: [
                new OA\Property(property: "department_id", type: "integer", example: 1),
                new OA\Property(property: "room_category_id", type: "integer", nullable: true, example: 2),
                new OA\Property(property: "name", type: "string", example: "Salle de consultation A"),
                new OA\Property(property: "type", type: "string", enum: ["WAITING_ROOM", "CONSULTATION", "WARD"], example: "CONSULTATION")
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Salle créée avec succès")]
    public function store(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $validated = $request->validate([
            'department_id'    => 'required|exists:departments,id',
            'room_category_id' => 'nullable|exists:room_categories,id',
            'name'             => 'required|string|max:255',
            'type'             => 'required|in:WAITING_ROOM,CONSULTATION,WARD',
        ]);

        // Vérification de sécurité : Le département appartient-il à cet hôpital ?
        Department::whereHas('center', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($validated['department_id']);

        // Vérification de sécurité : La catégorie appartient-elle à cet hôpital ?
        if (!empty($validated['room_category_id'])) {
            RoomCategory::whereHas('center', function($q) use ($hospitalId) {
                $q->where('hospital_id', $hospitalId);
            })->findOrFail($validated['room_category_id']);
        }

        $room = FacilityRoom::create($validated);

        return response()->json([
            'message' => 'Salle créée avec succès.',
            'data'    => $room->load('category')
        ], 201);
    }

    /**
     * Modifier une salle existante
     */
    #[OA\Put(
        path: "/api/admin/facility-rooms/{id}",
        operationId: "updateFacilityRoom",
        summary: "Modifier une salle",
        security: [["bearerAuth" => []]],
        tags: ["Salles et Installations"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la salle", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "room_category_id", type: "integer", nullable: true, example: 3),
                new OA\Property(property: "name", type: "string", example: "Chambre 101"),
                new OA\Property(property: "type", type: "string", enum: ["WAITING_ROOM", "CONSULTATION", "WARD"])
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Salle mise à jour avec succès")]
    public function update(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();

        // On vérifie que la salle appartient bien à un département de l'hôpital actuel
        $room = FacilityRoom::whereHas('department.center', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        $validated = $request->validate([
            'room_category_id' => 'nullable|exists:room_categories,id',
            'name'             => 'sometimes|required|string|max:255',
            'type'             => 'sometimes|required|in:WAITING_ROOM,CONSULTATION,WARD',
        ]);

        if (array_key_exists('room_category_id', $validated) && !empty($validated['room_category_id'])) {
            RoomCategory::whereHas('center', function($q) use ($hospitalId) {
                $q->where('hospital_id', $hospitalId);
            })->findOrFail($validated['room_category_id']);
        }

        $room->update($validated);

        return response()->json([
            'message' => 'Salle mise à jour avec succès.',
            'data'    => $room->load('category')
        ], 200);
    }

    /**
     * Supprimer une salle
     */
    #[OA\Delete(
        path: "/api/admin/facility-rooms/{id}",
        operationId: "deleteFacilityRoom",
        summary: "Supprimer une salle",
        security: [["bearerAuth" => []]],
        tags: ["Salles et Installations"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la salle", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Salle supprimée avec succès")]
    public function destroy($id)
    {
        $hospitalId = $this->getHospitalId();

        $room = FacilityRoom::whereHas('department.center', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        $room->delete();

        return response()->json([
            'message' => 'Salle supprimée avec succès.'
        ], 200);
    }
}