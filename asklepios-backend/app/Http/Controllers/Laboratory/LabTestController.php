<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabTest;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Examens Laboratoire", description: "Gestion du catalogue des examens de laboratoire")]
class LabTestController extends Controller
{
    #[OA\Get(path: "/api/lab/tests", summary: "Lister les examens", security: [["bearerAuth" => []]], tags: ["Examens Laboratoire"])]
    #[OA\Parameter(name: "lab_category_id", in: "query", required: false, description: "Filtrer par catégorie", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste des examens récupérée")]
    public function index(Request $request)
    {
        $query = LabTest::with('category');
        if ($request->has('lab_category_id')) {
            $query->where('lab_category_id', $request->lab_category_id);
        }
        
        $tests = $query->latest()->get();
        return response()->json($tests, 200);
    }

    #[OA\Post(path: "/api/lab/tests", summary: "Créer un examen", security: [["bearerAuth" => []]], tags: ["Examens Laboratoire"])]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["lab_category_id", "code", "name", "sample_type_required", "price"],
            properties: [
                new OA\Property(property: "lab_category_id", type: "integer"),
                new OA\Property(property: "code", type: "string"),
                new OA\Property(property: "name", type: "string"),
                new OA\Property(property: "sample_type_required", type: "string"),
                new OA\Property(property: "price", type: "number"),
                new OA\Property(property: "is_active", type: "boolean", nullable: true)
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Examen créé avec succès")]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'lab_category_id' => 'required|exists:lab_categories,id',
            'code' => 'required|string|max:50',
            'name' => 'required|string|max:255',
            'sample_type_required' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $test = LabTest::create($validated);

        return response()->json([
            'message' => 'Examen créé avec succès',
            'data' => $test
        ], 201);
    }

    #[OA\Get(path: "/api/lab/tests/{id}", summary: "Voir un examen", security: [["bearerAuth" => []]], tags: ["Examens Laboratoire"])]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de l'examen", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Détails de l'examen")]
    public function show($id)
    {
        $test = LabTest::with(['category', 'parameters'])->findOrFail($id);
        return response()->json($test, 200);
    }

    #[OA\Put(path: "/api/lab/tests/{id}", summary: "Modifier un examen", security: [["bearerAuth" => []]], tags: ["Examens Laboratoire"])]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de l'examen", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "lab_category_id", type: "integer"),
                new OA\Property(property: "code", type: "string"),
                new OA\Property(property: "name", type: "string"),
                new OA\Property(property: "sample_type_required", type: "string"),
                new OA\Property(property: "price", type: "number"),
                new OA\Property(property: "is_active", type: "boolean", nullable: true)
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Examen mis à jour")]
    public function update(Request $request, $id)
    {
        $test = LabTest::findOrFail($id);

        $validated = $request->validate([
            'lab_category_id' => 'sometimes|required|exists:lab_categories,id',
            'code' => 'sometimes|required|string|max:50',
            'name' => 'sometimes|required|string|max:255',
            'sample_type_required' => 'sometimes|required|string|max:100',
            'price' => 'sometimes|required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $test->update($validated);

        return response()->json([
            'message' => 'Examen mis à jour',
            'data' => $test
        ], 200);
    }

    #[OA\Delete(path: "/api/lab/tests/{id}", summary: "Supprimer un examen", security: [["bearerAuth" => []]], tags: ["Examens Laboratoire"])]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de l'examen", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Examen supprimé")]
    public function destroy($id)
    {
        $test = LabTest::findOrFail($id);
        $test->delete();

        return response()->json(['message' => 'Examen supprimé'], 200);
    }
}
