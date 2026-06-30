<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hospital\Bed;
use App\Models\Hospital\FacilityRoom;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Illuminate\Validation\Rule;

#[OA\Tag(name: "Lits d'Hospitalisation", description: "Gestion des lits dans les salles d'hospitalisation")]
class BedController extends Controller
{
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
     * Lister les lits d'une salle spécifique (Paginé et filtrable)
     */
    #[OA\Get(
        path: "/api/shared/rooms/{roomId}/beds",
        operationId: "getBeds",
        summary: "Lister les lits d'une salle",
        security: [["bearerAuth" => []]],
        tags: ["Lits d'Hospitalisation"]
    )]
    #[OA\Parameter(name: "roomId", in: "path", required: true, description: "ID de la salle", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Recherche par numéro de lit", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "state", in: "query", required: false, description: "Filtrer par état (AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE)", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "paginated", in: "query", required: false, description: "true/false pour react-select", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Liste récupérée avec succès")]
    public function index(Request $request, $roomId)
    {
        $hospitalId = $this->getHospitalId();

        // 1. On vérifie juste que la chambre appartient bien à l'hôpital (SANS le ->with)
        $room = FacilityRoom::whereHas('department.center', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($roomId);

        // 2. C'EST ICI qu'on charge les admissions et le patient pour chaque LIT
        // Assure-toi d'avoir bien créé la méthode currentAdmission() dans le modèle Bed.php comme vu précédemment
        $query = Bed::with(['currentAdmission.patient.medicalBackground'])
                    ->where('facility_room_id', $room->id);

        // Filtre de recherche par numéro de lit
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where('bed_number', 'like', "%{$search}%");
        }

        // Filtre par statut d'occupation
        if ($request->filled('state')) {
            $query->where('state', $request->query('state'));
        }

        // Tri naturel
        $query->orderBy('bed_number', 'asc');

        // Mode liste plate
        if ($request->query('paginated') === 'false') {
            return response()->json($query->get(), 200);
        }

        // Mode paginé par défaut
        $perPage = $request->query('per_page', 15);
        return response()->json($query->paginate($perPage), 200);
    }

    /**
     * Créer un nouveau lit (Admin uniquement)
     */
    #[OA\Post(
        path: "/api/admin/beds",
        operationId: "storeBed",
        summary: "Créer un lit",
        security: [["bearerAuth" => []]],
        tags: ["Lits d'Hospitalisation"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["facility_room_id", "bed_number", "state"],
            properties: [
                new OA\Property(property: "facility_room_id", type: "integer", example: 1),
                new OA\Property(property: "bed_number", type: "string", example: "LIT-01"),
                new OA\Property(property: "state", type: "string", enum: ["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE"], example: "AVAILABLE")
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Lit créé avec succès")]
    public function store(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $validated = $request->validate([
            'facility_room_id' => 'required|exists:facility_rooms,id',
            'bed_number'       => 'required|string|max:255',
            'state'            => ['required', Rule::in(['AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'])],
        ]);

        // Vérification de sécurité : La salle appartient-elle à cet hôpital et est-ce une salle d'hospitalisation ?
        $room = FacilityRoom::whereHas('department.center', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($validated['facility_room_id']);

        if ($room->type !== 'WARD') {
            return response()->json(['message' => 'Impossible d\'ajouter un lit dans une salle qui n\'est pas destinée à l\'hospitalisation (WARD).'], 422);
        }

        // Vérifier l'unicité du numéro de lit au sein de cette salle
        $exists = Bed::where('facility_room_id', $room->id)
                     ->where('bed_number', $validated['bed_number'])
                     ->exists();

        if ($exists) {
            return response()->json(['message' => 'Ce numéro de lit existe déjà dans cette salle.'], 422);
        }

        $bed = Bed::create($validated);

        return response()->json([
            'message' => 'Lit créé avec succès.',
            'data'    => $bed
        ], 201);
    }

    /**
     * Modifier un lit
     */
    #[OA\Put(
        path: "/api/admin/beds/{id}",
        operationId: "updateBed",
        summary: "Modifier un lit",
        security: [["bearerAuth" => []]],
        tags: ["Lits d'Hospitalisation"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID du lit", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "bed_number", type: "string", example: "LIT-02"),
                new OA\Property(property: "state", type: "string", enum: ["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE"])
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Lit mis à jour avec succès")]
    public function update(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();

        // Vérification d'appartenance à l'hôpital
        $bed = Bed::whereHas('room.department.center', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        $validated = $request->validate([
            'bed_number' => 'sometimes|required|string|max:255',
            'state'      => ['sometimes', 'required', Rule::in(['AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'])],
        ]);

        // Vérifier l'unicité si on change le nom du lit
        if (isset($validated['bed_number']) && $validated['bed_number'] !== $bed->bed_number) {
            $exists = Bed::with(['currentAdmission.patient'])
            ->where('facility_room_id', $bed->facility_room_id)
                         ->where('bed_number', $validated['bed_number'])
                         ->exists();

            if ($exists) {
                return response()->json(['message' => 'Ce numéro de lit existe déjà dans cette salle.'], 422);
            }
        }

        $bed->update($validated);

        return response()->json([
            'message' => 'Lit mis à jour avec succès.',
            'data'    => $bed
        ], 200);
    }

    /**
     * Supprimer un lit
     */
    #[OA\Delete(
        path: "/api/admin/beds/{id}",
        operationId: "deleteBed",
        summary: "Supprimer un lit",
        security: [["bearerAuth" => []]],
        tags: ["Lits d'Hospitalisation"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID du lit", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Lit supprimé avec succès")]
    public function destroy($id)
    {
        $hospitalId = $this->getHospitalId();

        $bed = Bed::whereHas('room.department.center', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        $bed->delete();

        return response()->json([
            'message' => 'Lit supprimé avec succès.'
        ], 200);
    }
}