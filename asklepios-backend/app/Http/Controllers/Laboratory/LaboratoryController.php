<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\Laboratory;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Laboratoires", description: "Gestion des laboratoires (Entité)")]
class LaboratoryController extends Controller
{
    #[OA\Get(path: "/api/laboratories", summary: "Lister les laboratoires", security: [["bearerAuth" => []]], tags: ["Laboratoires"])]
    #[OA\Parameter(name: "hospital_id", in: "query", required: false, description: "Filtrer par hôpital (Tenant)", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste des laboratoires")]
    public function index(Request $request)
    {
        $query = Laboratory::query();
        if ($request->has('hospital_id')) {
            $query->where('hospital_id', $request->hospital_id);
        }
        
        $laboratories = $query->with(['hospital', 'center', 'country'])->get();
        return response()->json($laboratories, 200);
    }

    #[OA\Post(path: "/api/laboratories", summary: "Créer un laboratoire", security: [["bearerAuth" => []]], tags: ["Laboratoires"])]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["name", "hospital_id"],
            properties: [
                new OA\Property(property: "hospital_id", type: "integer"),
                new OA\Property(property: "center_id", type: "integer", nullable: true),
                new OA\Property(property: "country_id", type: "integer", nullable: true),
                new OA\Property(property: "name", type: "string"),
                new OA\Property(property: "address", type: "string", nullable: true)
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Laboratoire créé")]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'hospital_id' => 'required|exists:hospitals,id',
            'center_id' => 'nullable|exists:centers,id',
            'country_id' => 'nullable|exists:countries,id',
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
        ]);

        $laboratory = Laboratory::create($validated);

        return response()->json([
            'message' => 'Laboratoire créé avec succès',
            'data' => $laboratory
        ], 201);
    }

    #[OA\Get(path: "/api/laboratories/{id}", summary: "Voir un laboratoire", security: [["bearerAuth" => []]], tags: ["Laboratoires"])]
    #[OA\Response(response: 200, description: "Détails du laboratoire")]
    public function show($id)
    {
        $laboratory = Laboratory::with(['hospital', 'center', 'country'])->findOrFail($id);
        return response()->json($laboratory, 200);
    }

    #[OA\Put(path: "/api/laboratories/{id}", summary: "Modifier un laboratoire", security: [["bearerAuth" => []]], tags: ["Laboratoires"])]
    #[OA\Response(response: 200, description: "Laboratoire mis à jour")]
    public function update(Request $request, $id)
    {
        $laboratory = Laboratory::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'hospital_id' => 'sometimes|required|exists:hospitals,id',
            'center_id' => 'nullable|exists:centers,id',
            'country_id' => 'nullable|exists:countries,id',
            'address' => 'nullable|string|max:255',
        ]);

        $laboratory->update($validated);

        return response()->json([
            'message' => 'Laboratoire mis à jour',
            'data' => $laboratory
        ], 200);
    }

    #[OA\Delete(path: "/api/laboratories/{id}", summary: "Supprimer un laboratoire", security: [["bearerAuth" => []]], tags: ["Laboratoires"])]
    #[OA\Response(response: 200, description: "Laboratoire supprimé")]
    public function destroy($id)
    {
        $laboratory = Laboratory::findOrFail($id);
        $laboratory->delete();

        return response()->json(['message' => 'Laboratoire supprimé'], 200);
    }
}
