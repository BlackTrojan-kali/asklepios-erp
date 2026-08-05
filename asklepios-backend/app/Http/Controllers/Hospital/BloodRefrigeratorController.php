<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\Hospital\BloodRefrigerator;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Illuminate\Support\Facades\Validator;

#[OA\Tag(name: "Blood Bank - Refrigerators", description: "Gestion des réfrigérateurs de la banque de sang")]
class BloodRefrigeratorController extends Controller
{
    #[OA\Get(
        path: "/api/admin/blood-refrigerators",
        summary: "Lister les réfrigérateurs",
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "center_id", in: "query", required: false, schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "hospital_id", in: "query", required: false, schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "status", in: "query", required: false, schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "search", in: "query", required: false, schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "per_page", in: "query", required: false, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Liste paginée des réfrigérateurs")
        ]
    )]
    public function index(Request $request)
    {
        $query = BloodRefrigerator::with('center');

        // 1. Filtrage par recherche (Nom)
        $query->when($request->filled('search'), function ($q) use ($request) {
            $q->where('name', 'like', '%' . $request->search . '%');
        });

        // 2. Filtrage exact par Centre
        $query->when($request->filled('center_id'), function ($q) use ($request) {
            $q->where('center_id', $request->center_id);
        });

        // 3. Filtrage exact par Statut (ex: ACTIVE, MAINTENANCE)
        $query->when($request->filled('status'), function ($q) use ($request) {
            $q->where('status', $request->status);
        });

        // 4. RESOLVER DE SCOPE ADMIN : Filtrer par Hôpital
        // Garantit que l'admin ne voit que les frigos de son hôpital
        $query->when($request->filled('hospital_id'), function ($q) use ($request) {
            $q->whereHas('center', function ($subQuery) use ($request) {
                $subQuery->where('hospital_id', $request->hospital_id);
            });
        });

        $perPage = $request->input('per_page', 15);
        
        return response()->json($query->paginate($perPage));
    }

    #[OA\Post(
        path: "/api/admin/blood-refrigerators",
        summary: "Créer un nouveau réfrigérateur",
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["center_id", "name", "target_temperature", "status"],
                properties: [
                    new OA\Property(property: "center_id", type: "integer"),
                    new OA\Property(property: "name", type: "string"),
                    new OA\Property(property: "target_temperature", type: "number", format: "float"),
                    new OA\Property(property: "status", type: "string")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Réfrigérateur créé avec succès"),
            new OA\Response(response: 422, description: "Erreur de validation")
        ]
    )]
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'center_id' => 'required|exists:centers,id',
            'name' => 'required|string|max:255',
            'target_temperature' => 'required|numeric',
            'status' => 'required|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $refrigerator = BloodRefrigerator::create($validator->validated());

        return response()->json([
            'message' => 'Réfrigérateur créé avec succès',
            'data' => $refrigerator->load('center')
        ], 201);
    }

    #[OA\Get(
        path: "/api/admin/blood-refrigerators/{id}",
        summary: "Afficher les détails d'un réfrigérateur",
        security: [["sanctum" => []]],
        parameters: [new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))],
        responses: [
            new OA\Response(response: 200, description: "Détails du réfrigérateur"),
            new OA\Response(response: 404, description: "Non trouvé")
        ]
    )]
    public function show($id)
    {
        $refrigerator = BloodRefrigerator::with('center')->findOrFail($id);
        return response()->json($refrigerator);
    }

    #[OA\Put(
        path: "/api/admin/blood-refrigerators/{id}",
        summary: "Mettre à jour un réfrigérateur",
        security: [["sanctum" => []]],
        parameters: [new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "center_id", type: "integer"),
                    new OA\Property(property: "name", type: "string"),
                    new OA\Property(property: "target_temperature", type: "number", format: "float"),
                    new OA\Property(property: "status", type: "string")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Mis à jour avec succès"),
            new OA\Response(response: 422, description: "Erreur de validation")
        ]
    )]
    public function update(Request $request, $id)
    {
        $refrigerator = BloodRefrigerator::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'center_id' => 'sometimes|required|exists:centers,id',
            'name' => 'sometimes|required|string|max:255',
            'target_temperature' => 'sometimes|required|numeric',
            'status' => 'sometimes|required|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $refrigerator->update($validator->validated());

        return response()->json([
            'message' => 'Réfrigérateur mis à jour avec succès',
            'data' => $refrigerator->load('center')
        ]);
    }

    #[OA\Delete(
        path: "/api/admin/blood-refrigerators/{id}",
        summary: "Supprimer un réfrigérateur",
        security: [["sanctum" => []]],
        parameters: [new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))],
        responses: [
            new OA\Response(response: 200, description: "Supprimé avec succès")
        ]
    )]
    public function destroy($id)
    {
        $refrigerator = BloodRefrigerator::findOrFail($id);
        $refrigerator->delete();

        return response()->json([
            'message' => 'Réfrigérateur supprimé avec succès'
        ]);
    }
}