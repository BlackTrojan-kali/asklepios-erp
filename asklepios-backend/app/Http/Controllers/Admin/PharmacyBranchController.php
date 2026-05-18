<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy\PharmacyBranch;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Pharmacies (Admin)", description: "Gestion des succursales et magasins de la pharmacie de l'hôpital")]
class PharmacyBranchController extends Controller
{
    /**
     * Obtenir l'ID de l'hôpital de l'administrateur connecté
     */
    private function getHospitalId()
    {
        return auth()->user()->profile_admin->hospital_id;
    }

    /**
     * Lister les succursales de la pharmacie
     */
    #[OA\Get(
        path: "/api/admin/pharmacy-branches",
        operationId: "getAdminPharmacyBranches",
        summary: "Lister les succursales de la pharmacie",
        security: [["bearerAuth" => []]],
        tags: ["Pharmacies (Admin)"]
    )]
    #[OA\Parameter(name: "search", in: "query", required: false, schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "type", in: "query", required: false, description: "central_warehouse ou retail_pos", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Liste récupérée avec succès")]
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        // On restreint à l'hôpital de l'administrateur
        $query = PharmacyBranch::where('hospital_id', $hospitalId);

        // Recherche par nom ou adresse
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('adress', 'like', "%{$search}%"); // Note: "adress" selon ta migration
            });
        }

        // Filtre par type
        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        return response()->json($query->latest()->get(), 200);
    }

    /**
     * Créer une succursale de pharmacie
     */
    #[OA\Post(
        path: "/api/admin/pharmacy-branches",
        operationId: "storeAdminPharmacyBranch",
        summary: "Créer une succursale de pharmacie",
        security: [["bearerAuth" => []]],
        tags: ["Pharmacies (Admin)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["name", "adress", "type"],
            properties: [
                new OA\Property(property: "name", type: "string", example: "Pharmacie Principale"),
                new OA\Property(property: "adress", type: "string", example: "Bâtiment A, RDC"),
                new OA\Property(property: "type", type: "string", enum: ["central_warehouse", "retail_pos"])
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Succursale créée avec succès")]
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'adress' => 'required|string|max:255',
            'type' => 'required|in:central_warehouse,retail_pos',
        ]);

        // Ajout sécurisé du hospital_id
        $validatedData['hospital_id'] = $this->getHospitalId();

        $branch = PharmacyBranch::create($validatedData);

        return response()->json([
            'message' => 'Succursale de pharmacie créée avec succès',
            'data' => $branch
        ], 201);
    }

    /**
     * Modifier une succursale
     */
    #[OA\Put(
        path: "/api/admin/pharmacy-branches/{id}",
        operationId: "updateAdminPharmacyBranch",
        summary: "Modifier une succursale",
        security: [["bearerAuth" => []]],
        tags: ["Pharmacies (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "name", type: "string"),
                new OA\Property(property: "adress", type: "string"),
                new OA\Property(property: "type", type: "string", enum: ["central_warehouse", "retail_pos"])
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Succursale modifiée avec succès")]
    #[OA\Response(response: 404, description: "Non trouvé")]
    public function update(Request $request, $id)
    {
        // On s'assure que la succursale appartient bien à cet hôpital
        $branch = PharmacyBranch::where('hospital_id', $this->getHospitalId())->findOrFail($id);

        $validatedData = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'adress' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|in:central_warehouse,retail_pos',
        ]);

        $branch->update($validatedData);

        return response()->json([
            'message' => 'Succursale de pharmacie mise à jour',
            'data' => $branch
        ], 200);
    }

    /**
     * Supprimer une succursale
     */
    #[OA\Delete(
        path: "/api/admin/pharmacy-branches/{id}",
        operationId: "deleteAdminPharmacyBranch",
        summary: "Supprimer une succursale",
        security: [["bearerAuth" => []]],
        tags: ["Pharmacies (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Succursale supprimée avec succès")]
    public function destroy($id)
    {
        $branch = PharmacyBranch::where('hospital_id', $this->getHospitalId())->findOrFail($id);
        
        $branch->delete();

        return response()->json([
            'message' => 'Succursale de pharmacie supprimée avec succès'
        ], 200);
    }
}