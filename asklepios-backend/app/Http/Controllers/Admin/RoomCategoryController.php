<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hospital\RoomCategory;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Catégories de Chambres", description: "Gestion des types de chambres et tarifications")]
class RoomCategoryController extends Controller
{
    /**
     * Récupère l'ID de l'hôpital selon le profil de l'utilisateur connecté
     * (Gère les admins, réceptionnistes et docteurs)
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
     * Lister et filtrer les catégories de chambres
     */
    #[OA\Get(
        path: "/api/shared/room-categories",
        operationId: "getRoomCategories",
        summary: "Lister les catégories de chambres (Paginé ou non)",
        security: [["bearerAuth" => []]],
        tags: ["Catégories de Chambres"]
    )]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Recherche par nom", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "center_id", in: "query", required: false, description: "Filtrer par centre", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "paginated", in: "query", required: false, description: "true/false pour react-select", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Liste récupérée avec succès")]
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        
        // On s'assure de ne récupérer que les catégories appartenant aux centres de l'hôpital actuel
        $query = RoomCategory::whereHas('center', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->with('center');

        // Filtre par Centre
        if ($request->filled('center_id')) {
            $query->where('center_id', $request->query('center_id'));
        }

        // Filtre de recherche par nom
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where('name', 'like', "%{$search}%");
        }

        $query->latest();

        // Mode liste plate pour les listes déroulantes (React-Select)
        if ($request->query('paginated') === 'false') {
            return response()->json($query->get(), 200);
        }

        // Mode paginé par défaut
        $perPage = $request->query('per_page', 15);
        return response()->json($query->paginate($perPage), 200);
    }

    /**
     * Créer une catégorie de chambre (Admin uniquement)
     */
    #[OA\Post(
        path: "/api/admin/room-categories",
        operationId: "storeRoomCategory",
        summary: "Créer une catégorie",
        security: [["bearerAuth" => []]],
        tags: ["Catégories de Chambres"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["center_id", "name", "price_per_night"],
            properties: [
                new OA\Property(property: "center_id", type: "integer", example: 1),
                new OA\Property(property: "name", type: "string", example: "Chambre VIP"),
                new OA\Property(property: "price_per_night", type: "number", format: "float", example: 25000)
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Catégorie créée avec succès")]
    #[OA\Response(response: 422, description: "Erreur de validation des données")]
    public function store(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $validated = $request->validate([
            'center_id' => [
                'required',
                Rule::exists('centers', 'id')->where('hospital_id', $hospitalId),
            ],
            'name' => 'required|string|max:255',
            'price_per_night' => 'required|numeric|min:0',
        ]);

        $category = RoomCategory::create($validated);

        return response()->json([
            'message' => 'Catégorie de chambre créée avec succès.',
            'data'    => $category->load('center')
        ], 201);
    }

    /**
     * Obtenir les détails d'une catégorie
     */
    #[OA\Get(
        path: "/api/admin/room-categories/{id}",
        operationId: "showRoomCategory",
        summary: "Détails d'une catégorie",
        security: [["bearerAuth" => []]],
        tags: ["Catégories de Chambres"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la catégorie", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Détails récupérés avec succès")]
    #[OA\Response(response: 404, description: "Catégorie non trouvée")]
    public function show($id)
    {
        $hospitalId = $this->getHospitalId();
        
        $category = RoomCategory::whereHas('center', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->with('center')->findOrFail($id);

        return response()->json($category, 200);
    }

    /**
     * Modifier une catégorie de chambre
     */
    #[OA\Put(
        path: "/api/admin/room-categories/{id}",
        operationId: "updateRoomCategory",
        summary: "Modifier une catégorie",
        security: [["bearerAuth" => []]],
        tags: ["Catégories de Chambres"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la catégorie", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "center_id", type: "integer", example: 1),
                new OA\Property(property: "name", type: "string", example: "Chambre Standard"),
                new OA\Property(property: "price_per_night", type: "number", format: "float", example: 15000)
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Catégorie mise à jour avec succès")]
    #[OA\Response(response: 404, description: "Catégorie non trouvée")]
    public function update(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();

        $category = RoomCategory::whereHas('center', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        $validated = $request->validate([
            'center_id' => [
                'sometimes', 'required',
                Rule::exists('centers', 'id')->where('hospital_id', $hospitalId),
            ],
            'name' => 'sometimes|required|string|max:255',
            'price_per_night' => 'sometimes|required|numeric|min:0',
        ]);

        $category->update($validated);

        return response()->json([
            'message' => 'Catégorie de chambre mise à jour avec succès.',
            'data'    => $category->load('center')
        ], 200);
    }

    /**
     * Supprimer une catégorie de chambre
     */
    #[OA\Delete(
        path: "/api/admin/room-categories/{id}",
        operationId: "deleteRoomCategory",
        summary: "Supprimer une catégorie",
        security: [["bearerAuth" => []]],
        tags: ["Catégories de Chambres"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la catégorie", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Catégorie supprimée avec succès")]
    #[OA\Response(response: 404, description: "Catégorie non trouvée")]
    public function destroy($id)
    {
        $hospitalId = $this->getHospitalId();

        $category = RoomCategory::whereHas('center', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        $category->delete();

        return response()->json([
            'message' => 'Catégorie de chambre supprimée avec succès.'
        ], 200);
    }
}