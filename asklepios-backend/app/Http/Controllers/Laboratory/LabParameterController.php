<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabParameter;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Paramètres Laboratoire", description: "Gestion des paramètres d'analyse")]
class LabParameterController extends Controller
{
    #[OA\Get(path: "/api/lab/parameters", summary: "Lister les paramètres", security: [["bearerAuth" => []]], tags: ["Paramètres Laboratoire"])]
    #[OA\Parameter(name: "lab_test_id", in: "query", required: false, description: "Filtrer par examen", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste des paramètres récupérée")]
    public function index(Request $request)
    {
        $query = LabParameter::with('test');
        if ($request->has('lab_test_id')) {
            $query->where('lab_test_id', $request->lab_test_id);
        }
        
        $parameters = $query->latest()->get();
        return response()->json($parameters, 200);
    }

    #[OA\Post(path: "/api/lab/parameters", summary: "Créer un paramètre", security: [["bearerAuth" => []]], tags: ["Paramètres Laboratoire"])]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["lab_test_id", "name", "unit"],
            properties: [
                new OA\Property(property: "lab_test_id", type: "integer"),
                new OA\Property(property: "name", type: "string"),
                new OA\Property(property: "unit", type: "string"),
                new OA\Property(property: "reference_min_male", type: "number", nullable: true),
                new OA\Property(property: "reference_max_male", type: "number", nullable: true),
                new OA\Property(property: "reference_min_female", type: "number", nullable: true),
                new OA\Property(property: "reference_max_female", type: "number", nullable: true),
                new OA\Property(property: "reference_text", type: "string", nullable: true)
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Paramètre créé avec succès")]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'lab_test_id' => 'required|exists:lab_tests,id',
            'name' => 'required|string|max:255',
            'unit' => 'nullable|string|max:50',
            'value_type' => 'nullable|string|in:numeric,string,text,options,file',
            'options' => 'nullable|array',
            'reference_min_male' => 'nullable|numeric',
            'reference_max_male' => 'nullable|numeric',
            'reference_min_female' => 'nullable|numeric',
            'reference_max_female' => 'nullable|numeric',
            'reference_text' => 'nullable|string',
        ]);

        $parameter = LabParameter::create($validated);

        return response()->json([
            'message' => 'Paramètre créé avec succès',
            'data' => $parameter
        ], 201);
    }

    #[OA\Get(path: "/api/lab/parameters/{id}", summary: "Voir un paramètre", security: [["bearerAuth" => []]], tags: ["Paramètres Laboratoire"])]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID du paramètre", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Détails du paramètre")]
    public function show($id)
    {
        $parameter = LabParameter::with('test')->findOrFail($id);
        return response()->json($parameter, 200);
    }

    #[OA\Put(path: "/api/lab/parameters/{id}", summary: "Modifier un paramètre", security: [["bearerAuth" => []]], tags: ["Paramètres Laboratoire"])]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID du paramètre", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "lab_test_id", type: "integer"),
                new OA\Property(property: "name", type: "string"),
                new OA\Property(property: "unit", type: "string"),
                new OA\Property(property: "reference_min_male", type: "number", nullable: true),
                new OA\Property(property: "reference_max_male", type: "number", nullable: true),
                new OA\Property(property: "reference_min_female", type: "number", nullable: true),
                new OA\Property(property: "reference_max_female", type: "number", nullable: true),
                new OA\Property(property: "reference_text", type: "string", nullable: true)
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Paramètre mis à jour")]
    public function update(Request $request, $id)
    {
        $parameter = LabParameter::findOrFail($id);

        $validated = $request->validate([
            'lab_test_id' => 'sometimes|required|exists:lab_tests,id',
            'name' => 'sometimes|required|string|max:255',
            'unit' => 'sometimes|nullable|string|max:50',
            'value_type' => 'nullable|string|in:numeric,string,text,options,file',
            'options' => 'nullable|array',
            'reference_min_male' => 'nullable|numeric',
            'reference_max_male' => 'nullable|numeric',
            'reference_min_female' => 'nullable|numeric',
            'reference_max_female' => 'nullable|numeric',
            'reference_text' => 'nullable|string|max:255',
        ]);

        $parameter->update($validated);

        return response()->json([
            'message' => 'Paramètre mis à jour',
            'data' => $parameter
        ], 200);
    }

    #[OA\Delete(path: "/api/lab/parameters/{id}", summary: "Supprimer un paramètre", security: [["bearerAuth" => []]], tags: ["Paramètres Laboratoire"])]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID du paramètre", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Paramètre supprimé")]
    public function destroy($id)
    {
        $parameter = LabParameter::findOrFail($id);
        $parameter->delete();

        return response()->json(['message' => 'Paramètre supprimé'], 200);
    }
}
