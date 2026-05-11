<?php

namespace App\Http\Controllers\SUPA;

use App\Http\Controllers\Controller;
use App\Models\Licence;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Licences (SUPA)", description: "Gestion des licences du système par le Super Admin")]
class LicenceController extends Controller
{
    /**
     * Liste paginée et recherche des licences
     */
    #[OA\Get(
        path: "/api/supa/licences",
        operationId: "getLicences",
        summary: "Lister les licences",
        security: [["bearerAuth" => []]],
        tags: ["Licences (SUPA)"]
    )]
    #[OA\Parameter(name: "search", in: "query", required: false, schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "per_page", in: "query", required: false, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste des licences récupérée avec succès")]
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 10);
        $search = $request->query('search');

        $query = Licence::query();

        if ($search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
        }

        $licences = $query->latest()->paginate($perPage);

        return response()->json($licences, 200);
    }

    /**
     * Créer une nouvelle licence
     */
    #[OA\Post(
        path: "/api/supa/licences",
        operationId: "storeLicence",
        summary: "Créer une licence",
        security: [["bearerAuth" => []]],
        tags: ["Licences (SUPA)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["name"],
            properties: [
                new OA\Property(property: "name", type: "string", example: "laboratory"),
                new OA\Property(property: "description", type: "string", example: "Licence pour le module laboratoire")
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Licence créée avec succès")]
    #[OA\Response(response: 422, description: "Erreur de validation")]
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255|unique:licences,name',
            'description' => 'nullable|string'
        ]);

        $licence = Licence::create($validatedData);

        return response()->json([
            'message' => 'Licence créée avec succès',
            'data' => $licence
        ], 201);
    }

    /**
     * Afficher les détails d'une licence spécifique
     */
    #[OA\Get(
        path: "/api/supa/licences/{id}",
        operationId: "showLicence",
        summary: "Détails d'une licence",
        security: [["bearerAuth" => []]],
        tags: ["Licences (SUPA)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Détails récupérés avec succès")]
    #[OA\Response(response: 404, description: "Licence non trouvée")]
    public function show($id)
    {
        $licence = Licence::findOrFail($id);
        return response()->json($licence, 200);
    }

    /**
     * Modifier une licence
     */
    #[OA\Put(
        path: "/api/supa/licences/{id}",
        operationId: "updateLicence",
        summary: "Modifier une licence",
        security: [["bearerAuth" => []]],
        tags: ["Licences (SUPA)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "name", type: "string"),
                new OA\Property(property: "description", type: "string")
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Licence modifiée avec succès")]
    #[OA\Response(response: 404, description: "Licence non trouvée")]
    public function update(Request $request, $id)
    {
        $licence = Licence::findOrFail($id);

        $validatedData = $request->validate([
            // On ignore l'ID actuel pour la règle unique
            'name' => 'sometimes|required|string|max:255|unique:licences,name,' . $licence->id,
            'description' => 'nullable|string'
        ]);

        $licence->update($validatedData);

        return response()->json([
            'message' => 'Licence mise à jour avec succès',
            'data' => $licence
        ], 200);
    }

    /**
     * Supprimer une licence
     */
    #[OA\Delete(
        path: "/api/supa/licences/{id}",
        operationId: "deleteLicence",
        summary: "Supprimer une licence",
        security: [["bearerAuth" => []]],
        tags: ["Licences (SUPA)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Licence supprimée avec succès")]
    public function destroy($id)
    {
        $licence = Licence::findOrFail($id);
        
        $licence->delete();

        return response()->json([
            'message' => 'Licence supprimée avec succès'
        ], 200);
    }
}