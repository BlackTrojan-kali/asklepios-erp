<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Center;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Départements (Admin)", description: "Gestion des départements par centre médical")]
class DepartmentController extends Controller
{
    /**
     * Sécurité : Vérifier que le centre appartient bien à l'hôpital de l'admin
     */
    private function validateCenterAccess($centerId)
    {
        $hospitalId = auth()->user()->profile_admin->hospital_id;
        return Center::where('id', $centerId)
                     ->where('hospital_id', $hospitalId)
                     ->exists();
    }

    /**
     * Liste des départements d'un centre spécifique
     */
    #[OA\Get(
        path: "/api/admin/departments",
        operationId: "getAdminDepartments",
        summary: "Lister les départements d'un centre",
        security: [["bearerAuth" => []]],
        tags: ["Départements (Admin)"]
    )]
    #[OA\Parameter(name: "center_id", in: "query", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "search", in: "query", required: false, schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Liste des départements récupérée avec succès")]
    #[OA\Response(response: 403, description: "Accès refusé pour ce centre")]
    public function index(Request $request)
    {
        $request->validate(['center_id' => 'required|exists:centers,id']);
        
        if (!$this->validateCenterAccess($request->center_id)) {
            return response()->json(['message' => 'Accès refusé pour ce centre.'], 403);
        }

        $query = Department::where('center_id', $request->center_id);

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('alias', 'like', "%{$request->search}%");
            });
        }

        return response()->json($query->latest()->get(), 200);
    }

    /**
     * Créer un département dans un centre
     */
    #[OA\Post(
        path: "/api/admin/departments",
        operationId: "storeAdminDepartment",
        summary: "Créer un département",
        security: [["bearerAuth" => []]],
        tags: ["Départements (Admin)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["center_id", "name"],
            properties: [
                new OA\Property(property: "center_id", type: "integer", example: 1),
                new OA\Property(property: "name", type: "string", example: "Cardiologie"),
                new OA\Property(property: "alias", type: "string", example: "CARDIO")
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Département créé avec succès")]
    #[OA\Response(response: 403, description: "Accès refusé")]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'center_id' => 'required|exists:centers,id',
            'name' => 'required|string|max:255',
            'alias' => 'nullable|string|max:50',
        ]);

        if (!$this->validateCenterAccess($request->center_id)) {
            return response()->json(['message' => 'Action non autorisée.'], 403);
        }

        $department = Department::create($validated);

        return response()->json([
            'message' => 'Département créé avec succès',
            'data' => $department
        ], 201);
    }

    /**
     * Modifier un département
     */
    #[OA\Put(
        path: "/api/admin/departments/{id}",
        operationId: "updateAdminDepartment",
        summary: "Modifier un département",
        security: [["bearerAuth" => []]],
        tags: ["Départements (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "name", type: "string"),
                new OA\Property(property: "alias", type: "string")
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Département mis à jour")]
    #[OA\Response(response: 403, description: "Accès refusé")]
    public function update(Request $request, $id)
    {
        $department = Department::findOrFail($id);

        if (!$this->validateCenterAccess($department->center_id)) {
            return response()->json(['message' => 'Action non autorisée.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'alias' => 'nullable|string|max:50',
        ]);

        $department->update($validated);

        return response()->json([
            'message' => 'Département mis à jour',
            'data' => $department
        ], 200);
    }

    /**
     * Supprimer un département
     */
    #[OA\Delete(
        path: "/api/admin/departments/{id}",
        operationId: "deleteAdminDepartment",
        summary: "Supprimer un département",
        security: [["bearerAuth" => []]],
        tags: ["Départements (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Département supprimé")]
    #[OA\Response(response: 403, description: "Accès refusé")]
    public function destroy($id)
    {
        $department = Department::findOrFail($id);

        if (!$this->validateCenterAccess($department->center_id)) {
            return response()->json(['message' => 'Action non autorisée.'], 403);
        }

        $department->delete();

        return response()->json(['message' => 'Département supprimé'], 200);
    }
}