<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy\PharmacyBranch;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Pharmacies (Admin)", description: "Gestion des succursales et magasins de la pharmacie de l'hôpital")]
class PharmacyBranchController extends Controller
{
    /**
     * Récupère le contexte (accessible aux admins et pharmaciens pour la lecture)
     */
    private function getContext()
    {
        $user = auth()->user();
        
        if ($user->profile_admin) {
            return ['role' => 'admin', 'hospital_id' => $user->profile_admin->hospital_id];
        }
        
        if ($user->profile_pharm) {
            $hospitalId = $user->profile_pharm->hospital_id ?? $user->profile_pharm->branch->hospital_id ?? null;
            return ['role' => 'pharmacy', 'hospital_id' => $hospitalId];
        }
        
        abort(403, "Profil non autorisé.");
    }

    /**
     * Bloque l'exécution si l'utilisateur n'est pas un admin
     */
    private function enforceAdmin($context)
    {
        if ($context['role'] !== 'admin') {
            abort(403, "Action refusée. Seul un administrateur peut modifier les succursales de pharmacie.");
        }
    }

  /**
     * Lister les succursales de la pharmacie (Accessible Admin + Pharmacien)
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
    #[OA\Parameter(name: "paginated", in: "query", required: false, description: "true pour paginer, false pour tout récupérer", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Liste récupérée avec succès")]
    public function index(Request $request)
    {
        $context = $this->getContext();
        $hospitalId = $context['hospital_id'];

        $query = PharmacyBranch::with('center')->where('hospital_id', $hospitalId);

        // Recherche par nom ou adresse
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('adress', 'like', "%{$search}%");
            });
        }

        // Filtre par type
        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        $query->latest();

        // GESTION CONDITIONNELLE DE LA PAGINATION
        if ($request->query('paginated') === 'true') {
            $perPage = $request->query('per_page', 15);
            return response()->json($query->paginate($perPage), 200);
        }

        // Si pas de pagination demandée, on renvoie un tableau plat (pour les listes déroulantes)
        return response()->json($query->get(), 200);
    }
    /**
     * Détails d'une succursale (Accessible Admin + Pharmacien)
     */
    #[OA\Get(
        path: "/api/admin/pharmacy-branches/{id}",
        operationId: "showAdminPharmacyBranch",
        summary: "Détails d'une succursale",
        security: [["bearerAuth" => []]],
        tags: ["Pharmacies (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Détails récupérés avec succès")]
    public function show($id)
    {
        $context = $this->getContext();
        $branch = PharmacyBranch::with('center')->where('hospital_id', $context['hospital_id'])->findOrFail($id);

        return response()->json($branch, 200);
    }

    /**
     * Créer une succursale (Réservé Admin)
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
                new OA\Property(property: "type", type: "string", enum: ["central_warehouse", "retail_pos"]),
                new OA\Property(property: "center_id", type: "integer", nullable: true, example: 1)
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Succursale créée avec succès")]
    public function store(Request $request)
    {
        $context = $this->getContext();
        $this->enforceAdmin($context); // Sécurité Admin
        $hospitalId = $context['hospital_id'];

        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'adress' => 'required|string|max:255',
            'type' => 'required|in:central_warehouse,retail_pos',
            'center_id' => [
                'nullable',
                Rule::exists('centers', 'id')->where(function ($query) use ($hospitalId) {
                    return $query->where('hospital_id', $hospitalId);
                }),
            ],
        ]);

        $validatedData['hospital_id'] = $hospitalId;

        $branch = PharmacyBranch::create($validatedData);

        return response()->json([
            'message' => 'Succursale de pharmacie créée avec succès',
            'data' => $branch->load('center')
        ], 201);
    }

    /**
     * Modifier une succursale (Réservé Admin)
     */
    #[OA\Put(
        path: "/api/admin/pharmacy-branches/{id}",
        operationId: "updateAdminPharmacyBranch",
        summary: "Modifier une succursale",
        security: [["bearerAuth" => []]],
        tags: ["Pharmacies (Admin)"]
    )]
    #[OA\Response(response: 200, description: "Succursale modifiée avec succès")]
    public function update(Request $request, $id)
    {
        $context = $this->getContext();
        $this->enforceAdmin($context); // Sécurité Admin
        $hospitalId = $context['hospital_id'];

        $branch = PharmacyBranch::where('hospital_id', $hospitalId)->findOrFail($id);

        $validatedData = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'adress' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|in:central_warehouse,retail_pos',
            'center_id' => [
                'nullable',
                Rule::exists('centers', 'id')->where(function ($query) use ($hospitalId) {
                    return $query->where('hospital_id', $hospitalId);
                }),
            ],
        ]);

        $branch->update($validatedData);

        return response()->json([
            'message' => 'Succursale de pharmacie mise à jour',
            'data' => $branch->load('center')
        ], 200);
    }

    /**
     * Supprimer une succursale (Réservé Admin)
     */
    #[OA\Delete(
        path: "/api/admin/pharmacy-branches/{id}",
        operationId: "deleteAdminPharmacyBranch",
        summary: "Supprimer une succursale",
        security: [["bearerAuth" => []]],
        tags: ["Pharmacies (Admin)"]
    )]
    #[OA\Response(response: 200, description: "Succursale supprimée avec succès")]
    public function destroy($id)
    {
        $context = $this->getContext();
        $this->enforceAdmin($context); // Sécurité Admin
        
        $branch = PharmacyBranch::where('hospital_id', $context['hospital_id'])->findOrFail($id);
        $branch->delete();

        return response()->json([
            'message' => 'Succursale de pharmacie supprimée avec succès'
        ], 200);
    }
}