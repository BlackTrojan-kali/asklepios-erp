<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Hospital\MedicalActCatalog;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Catalogue des Actes Médicaux", description: "API de gestion de la tarification et du catalogue des actes médicaux par département.")]
class MedicalActCatalogController extends Controller
{
    #[OA\Get(
        path: "/api/shared/departments/{departmentId}/medical-acts",
        summary: "Lister les actes médicaux d'un département",
        description: "Récupère le catalogue des actes. Supporte la recherche par nom et la pagination.",
        security: [["sanctum" => []]],
        tags: ["Catalogue des Actes Médicaux"]
    )]
    #[OA\Parameter(name: "departmentId", in: "path", required: true, description: "ID du département", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Recherche par nom de l'acte", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "paginated", in: "query", required: false, description: "Mettre à 'false' pour tout récupérer sans pagination", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Opération réussie")]
    #[OA\Response(response: 404, description: "Département introuvable")]
    public function index(Request $request, $departmentId)
    {
        $department = Department::findOrFail($departmentId);

        $query = MedicalActCatalog::where('department_id', $department->id);

        // Filtre de recherche par nom
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        // Renvoi sans pagination (utile pour les menus déroulants React-Select)
        if ($request->query('paginated') === 'false') {
            return response()->json($query->orderBy('name')->get());
        }

        $perPage = $request->query('per_page', 15);
        return response()->json($query->orderBy('name')->paginate($perPage));
    }

    #[OA\Post(
        path: "/api/shared/departments/{departmentId}/medical-acts",
        summary: "Ajouter un acte médical",
        description: "Crée un nouvel acte médical facturable pour ce département.",
        security: [["sanctum" => []]],
        tags: ["Catalogue des Actes Médicaux"]
    )]
    #[OA\Parameter(name: "departmentId", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["hospital_id", "name", "base_price"],
            properties: [
                new OA\Property(property: "hospital_id", type: "integer", example: 1, description: "ID de l'hôpital de rattachement"),
                new OA\Property(property: "name", type: "string", example: "Consultation Spécialisée Cardio"),
                new OA\Property(property: "base_price", type: "number", format: "float", example: 15000)
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Acte créé avec succès")]
    #[OA\Response(response: 422, description: "Erreur de validation")]
    public function store(Request $request, $departmentId)
    {
        $department = Department::findOrFail($departmentId);

        $validated = $request->validate([
            // Note: La table s'appelle "hospital" (sans s) d'après ta migration
            'hospital_id' => 'required|integer|exists:hospitals,id', 
            'name'        => 'required|string|max:255',
            'base_price'  => 'required|numeric|min:0',
        ]);

        $validated['department_id'] = $department->id;

        $act = MedicalActCatalog::create($validated);

        return response()->json([
            'message' => 'Acte médical ajouté au catalogue avec succès.',
            'data' => $act
        ], 201);
    }

    #[OA\Get(
        path: "/api/shared/departments/{departmentId}/medical-acts/{actId}",
        summary: "Détails d'un acte médical",
        description: "Affiche les détails d'un acte spécifique.",
        security: [["sanctum" => []]],
        tags: ["Catalogue des Actes Médicaux"]
    )]
    #[OA\Parameter(name: "departmentId", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "actId", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Détails récupérés")]
    public function show($departmentId, $actId)
    {
        $act = MedicalActCatalog::where('department_id', $departmentId)->findOrFail($actId);

        return response()->json($act);
    }

    #[OA\Put(
        path: "/api/shared/departments/{departmentId}/medical-acts/{actId}",
        summary: "Mettre à jour un acte",
        description: "Modifie le nom ou le prix de base d'un acte médical.",
        security: [["sanctum" => []]],
        tags: ["Catalogue des Actes Médicaux"]
    )]
    #[OA\Parameter(name: "departmentId", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "actId", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["name", "base_price"],
            properties: [
                new OA\Property(property: "name", type: "string", example: "Consultation Spécialisée Cardio (Tarif Révisé)"),
                new OA\Property(property: "base_price", type: "number", format: "float", example: 17500)
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Acte mis à jour")]
    public function update(Request $request, $departmentId, $actId)
    {
        $act = MedicalActCatalog::where('department_id', $departmentId)->findOrFail($actId);

        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'base_price' => 'required|numeric|min:0',
        ]);

        $act->update($validated);

        return response()->json([
            'message' => 'Acte médical mis à jour avec succès.',
            'data' => $act
        ]);
    }

    #[OA\Delete(
        path: "/api/shared/departments/{departmentId}/medical-acts/{actId}",
        summary: "Archiver un acte médical",
        description: "Désactive un acte (Soft Delete) pour qu'il ne soit plus facturable, tout en conservant l'historique des factures passées.",
        security: [["sanctum" => []]],
        tags: ["Catalogue des Actes Médicaux"]
    )]
    #[OA\Parameter(name: "departmentId", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "actId", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Acte archivé")]
    public function destroy($departmentId, $actId)
    {
        $act = MedicalActCatalog::where('department_id', $departmentId)->findOrFail($actId);
        $act->delete();

        return response()->json([
            'message' => 'Acte médical retiré du catalogue avec succès.'
        ]);
    }
}