<?php

namespace App\Http\Controllers\Pharmacien;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy\Stock;
use App\Models\Pharmacy\StorageLocation;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Gestion Espace & Aménagement", description: "Outils de rangement et d'organisation physique des stocks pour les pharmaciens")]
class StorageLocationController extends Controller
{
    /**
     * Récupère l'ID de la succursale du pharmacien connecté
     */
    private function getBranchId()
    {
        $profile = auth()->user()->profile_pharm;
        
        if (!$profile || !$profile->branch_id) {
            abort(response()->json(['message' => 'Accès refusé. Vous n\'êtes affecté à aucune succursale.'], 403));
        }
        
        return $profile->branch_id;
    }

    /**
     * 1. LISTER LES EMPLACEMENTS DE LA SUCCURSALE
     */
    #[OA\Get(
        path: "/api/pharmacien/storage-locations",
        operationId: "getBranchStorageLocations",
        summary: "Lister les emplacements physiques de ma succursale",
        security: [["bearerAuth" => []]],
        tags: ["Gestion Espace & Aménagement"]
    )]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Recherche par code, allée ou étagère", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Liste des emplacements récupérée")]
    public function index(Request $request)
    {
        $branchId = $this->getBranchId();

        // On ne prend que les emplacements de SA succursale, avec le compte des stocks associés si besoin
        $query = StorageLocation::where('pharmacy_branch_id', $branchId);

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('aisle', 'like', "%{$search}%")
                  ->orWhere('shelf', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('aisle')->orderBy('shelf')->get(), 200);
    }

    /**
     * 2. CRÉER UN NOUVEL EMPLACEMENT
     */
    #[OA\Post(
        path: "/api/pharmacien/storage-locations",
        operationId: "storeStorageLocation",
        summary: "Créer une zone de rangement (Allée, Étagère, Code)",
        security: [["bearerAuth" => []]],
        tags: ["Gestion Espace & Aménagement"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "aisle", type: "string", description: "Ex: Allée A", nullable: true),
                new OA\Property(property: "shelf", type: "string", description: "Ex: Étagère 3", nullable: true),
                new OA\Property(property: "code", type: "string", description: "Ex: A-3 (Code unique ou code-barres de zone)", nullable: true)
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Emplacement créé avec succès")]
    public function store(Request $request)
    {
        $branchId = $this->getBranchId();

        $validatedData = $request->validate([
            'aisle' => 'nullable|string|max:255',
            'shelf' => 'nullable|string|max:255',
            'code'  => 'nullable|string|max:255',
        ]);

        // On injecte automatiquement la succursale du pharmacien connecté
        $validatedData['pharmacy_branch_id'] = $branchId;

        $location = StorageLocation::create($validatedData);

        return response()->json([
            'message' => 'Zone de rangement créée avec succès',
            'data'    => $location
        ], 201);
    }

    /**
     * 3. MODIFIER UN EMPLACEMENT
     */
    #[OA\Put(
        path: "/api/pharmacien/storage-locations/{id}",
        operationId: "updateStorageLocation",
        summary: "Modifier une zone de rangement",
        security: [["bearerAuth" => []]],
        tags: ["Gestion Espace & Aménagement"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Emplacement mis à jour")]
    public function update(Request $request, $id)
    {
        $branchId = $this->getBranchId();

        // Sécurité : Impossible de modifier un emplacement d'une autre pharmacie
        $location = StorageLocation::where('pharmacy_branch_id', $branchId)->findOrFail($id);

        $validatedData = $request->validate([
            'aisle' => 'nullable|string|max:255',
            'shelf' => 'nullable|string|max:255',
            'code'  => 'nullable|string|max:255',
        ]);

        $location->update($validatedData);

        return response()->json([
            'message' => 'Zone de rangement mise à jour',
            'data'    => $location
        ], 200);
    }

    /**
     * 4. SUPPRIMER UN EMPLACEMENT
     */
    #[OA\Delete(
        path: "/api/pharmacien/storage-locations/{id}",
        operationId: "deleteStorageLocation",
        summary: "Supprimer une zone de rangement",
        security: [["bearerAuth" => []]],
        tags: ["Gestion Espace & Aménagement"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Emplacement supprimé")]
    public function destroy($id)
    {
        $branchId = $this->getBranchId();

        $location = StorageLocation::where('pharmacy_branch_id', $branchId)->findOrFail($id);
        
        // Optionnel : On remet à null l'emplacement des stocks associés avant de supprimer
        Stock::where('storage_location_id', $location->id)->update(['storage_location_id' => null]);

        $location->delete();

        return response()->json([
            'message' => 'Zone de rangement supprimée avec succès'
        ], 200);
    }

    /**
     * 5. AMÉNAGEMENT : ASSOCIER UN STOCK À UN EMPLACEMENT PHYSIQUE
     * Lie (ou délie) un article en stock à un rayon/étagère spécifique
     */
    #[OA\Post(
        path: "/api/pharmacien/storage-locations/assign-stock",
        operationId: "assignStockToLocation",
        summary: "Assigner un article en stock à un emplacement de rangement",
        security: [["bearerAuth" => []]],
        tags: ["Gestion Espace & Aménagement"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["stock_id"],
            properties: [
                new OA\Property(property: "stock_id", type: "integer", description: "ID de la ligne de stock concernée"),
                new OA\Property(property: "storage_location_id", type: "integer", description: "ID de l'emplacement (Mettre null pour désassigner)", nullable: true)
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Rangement mis à jour avec succès")]
    public function assignToStock(Request $request)
    {
        $branchId = $this->getBranchId();

        $request->validate([
            // Le stock doit exister ET appartenir à la succursale du pharmacien
            'stock_id' => [
                'required', 'integer',
                Rule::exists('stocks', 'id')->where('pharmacy_branch_id', $branchId)
            ],
            // L'emplacement doit appartenir à la succursale (ou être null si on vide le rangement)
            'storage_location_id' => [
                'nullable', 'integer',
                Rule::exists('storage_locations', 'id')->where('pharmacy_branch_id', $branchId)
            ]
        ]);

        $stock = Stock::where('pharmacy_branch_id', $branchId)->findOrFail($request->stock_id);
        
        $stock->update([
            'storage_location_id' => $request->storage_location_id
        ]);

        return response()->json([
            'message' => $request->storage_location_id ? 'Article rangé avec succès' : 'Article retiré de son emplacement',
            'data'    => $stock->load(['batch.article', 'storageLocation'])
        ], 200);
    }
}