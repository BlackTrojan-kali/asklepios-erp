<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabCategory;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Catégories Laboratoire", description: "Gestion des catégories d'examens (Biochimie, Hématologie, etc.)")]
class LabCategoryController extends Controller
{
    #[OA\Get(path: "/api/lab/categories", summary: "Lister les catégories", security: [["bearerAuth" => []]], tags: ["Catégories Laboratoire"])]
    #[OA\Parameter(name: "hospital_id", in: "query", required: false, description: "Filtrer par hôpital", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste des catégories récupérée")]
    public function index(Request $request)
    {
        $query = LabCategory::query();
        if ($request->has('hospital_id')) {
            $query->where('hospital_id', $request->hospital_id);
        }
        
        $categories = $query->with('tests')->orderBy('name', 'asc')->get();
        return response()->json($categories, 200);
    }

    #[OA\Post(path: "/api/lab/categories", summary: "Créer une catégorie", security: [["bearerAuth" => []]], tags: ["Catégories Laboratoire"])]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["name"],
            properties: [
                new OA\Property(property: "hospital_id", type: "integer", nullable: true),
                new OA\Property(property: "name", type: "string")
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Catégorie créée avec succès")]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'hospital_id' => 'required|exists:hospitals,id',
            'name' => 'required|string|max:255',
        ]);

        $category = LabCategory::create($validated);

        return response()->json([
            'message' => 'Catégorie créée avec succès',
            'data' => $category
        ], 201);
    }

    #[OA\Get(path: "/api/lab/categories/{id}", summary: "Voir une catégorie", security: [["bearerAuth" => []]], tags: ["Catégories Laboratoire"])]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la catégorie", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Détails de la catégorie")]
    public function show($id)
    {
        $category = LabCategory::with('tests')->findOrFail($id);
        return response()->json($category, 200);
    }

    #[OA\Put(path: "/api/lab/categories/{id}", summary: "Modifier une catégorie", security: [["bearerAuth" => []]], tags: ["Catégories Laboratoire"])]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la catégorie", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "name", type: "string")
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Catégorie mise à jour")]
    public function update(Request $request, $id)
    {
        $category = LabCategory::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
        ]);

        $category->update($validated);

        return response()->json([
            'message' => 'Catégorie mise à jour',
            'data' => $category
        ], 200);
    }

    #[OA\Delete(path: "/api/lab/categories/{id}", summary: "Supprimer une catégorie", security: [["bearerAuth" => []]], tags: ["Catégories Laboratoire"])]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la catégorie", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Catégorie supprimée")]
    public function destroy($id)
    {
        $category = LabCategory::findOrFail($id);
        $category->delete();

        return response()->json(['message' => 'Catégorie supprimée'], 200);
    }
}
