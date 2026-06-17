<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Services\StockService;
use App\Models\Pharmacy\Batch;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Lots d'Articles (Admin)", description: "Gestion des lots (Batches) avec dates de péremption et prix d'achat")]
class BatchController extends Controller
{
    protected StockService $stockService;

    // Injection du service dans le constructeur
    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Obtenir l'ID de l'hôpital de l'administrateur connecté
     */
    private function getHospitalId()
    {
        return auth()->user()->profile_admin->hospital_id;
    }

    /**
     * Lister et filtrer les lots (Paginés)
     */
    #[OA\Get(
        path: "/api/admin/batches",
        operationId: "getAdminBatches",
        summary: "Lister les lots d'articles (Paginés)",
        security: [["bearerAuth" => []]],
        tags: ["Lots d'Articles (Admin)"]
    )]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Numéro de lot", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "article_id", in: "query", required: false, description: "Filtrer par article spécifique", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "per_page", description: "Nombre de résultats par page (défaut: 10)", in: "query", required: false, schema: new OA\Schema(type: "integer", default: 10))]
    #[OA\Parameter(name: "page", description: "Numéro de la page à récupérer (défaut: 1)", in: "query", required: false, schema: new OA\Schema(type: "integer", default: 1))]
    #[OA\Response(response: 200, description: "Liste paginée récupérée avec succès")]
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        $perPage = $request->query('per_page', 10);

        $query = Batch::with('article')->whereHas('article', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        });

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where('batch_number', 'like', "%{$search}%");
        }

        if ($request->filled('article_id')) {
            $query->where('article_id', $request->query('article_id'));
        }

        return response()->json($query->orderBy('expire_date', 'asc')->paginate($perPage), 200);
    }

    /**
     * Lister tous les lots (Sans pagination)
     */
    #[OA\Get(
        path: "/api/admin/batches/all",
        operationId: "getAllAdminBatches",
        summary: "Lister tous les lots d'articles (Sans pagination)",
        security: [["bearerAuth" => []]],
        tags: ["Lots d'Articles (Admin)"]
    )]
    #[OA\Parameter(name: "article_id", in: "query", required: false, description: "Filtrer par article spécifique", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste complète récupérée avec succès")]
    public function all(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $query = Batch::with('article')->whereHas('article', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        });

        if ($request->filled('article_id')) {
            $query->where('article_id', $request->query('article_id'));
        }

        return response()->json($query->orderBy('expire_date', 'asc')->get(), 200);
    }

    /**
     * Créer un nouveau lot
     */
    #[OA\Post(
        path: "/api/admin/batches",
        operationId: "storeAdminBatch",
        summary: "Créer un lot",
        security: [["bearerAuth" => []]],
        tags: ["Lots d'Articles (Admin)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["article_id", "batch_number", "purchase_price"],
            properties: [
                new OA\Property(property: "article_id", type: "integer", example: 1),
                new OA\Property(property: "batch_number", type: "string", example: "LOT-2026-X1"),
                new OA\Property(property: "expire_date", type: "string", format: "date", nullable: true, example: "2027-12-31"),
                new OA\Property(property: "purchase_price", type: "number", format: "float", example: 1500.50)
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Lot créé avec succès")]
    public function store(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $validatedData = $request->validate([
            'article_id' => [
                'required',
                Rule::exists('articles', 'id')->where(function ($query) use ($hospitalId) {
                    return $query->where('hospital_id', $hospitalId);
                }),
            ],
            'batch_number' => 'required|string|max:255',
            'expire_date' => 'nullable|date',
            'purchase_price' => 'required|numeric|min:0',
        ]);

        $batch = Batch::create($validatedData);

        // 💡 OPTIONNEL MAIS RECOMMANDÉ : On initialise automatiquement le stock à la création
        $this->stockService->initializeStockForBatch($batch, $hospitalId);

        return response()->json([
            'message' => 'Lot enregistré avec succès',
            'data' => $batch->load('article')
        ], 201);
    }

    /**
     * Modifier un lot
     */
    #[OA\Put(
        path: "/api/admin/batches/{id}",
        operationId: "updateAdminBatch",
        summary: "Modifier un lot",
        security: [["bearerAuth" => []]],
        tags: ["Lots d'Articles (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "article_id", type: "integer"),
                new OA\Property(property: "batch_number", type: "string"),
                new OA\Property(property: "expire_date", type: "string", format: "date", nullable: true),
                new OA\Property(property: "purchase_price", type: "number", format: "float")
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Lot modifié avec succès")]
    public function update(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();

        $batch = Batch::whereHas('article', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        $validatedData = $request->validate([
            'article_id' => [
                'sometimes', 'required',
                Rule::exists('articles', 'id')->where(function ($query) use ($hospitalId) {
                    return $query->where('hospital_id', $hospitalId);
                }),
            ],
            'batch_number' => 'sometimes|required|string|max:255',
            'expire_date' => 'nullable|date',
            'purchase_price' => 'sometimes|required|numeric|min:0',
        ]);

        $batch->update($validatedData);

        return response()->json([
            'message' => 'Lot mis à jour avec succès',
            'data' => $batch->load('article')
        ], 200);
    }

    /**
     * Supprimer un lot
     */
    #[OA\Delete(
        path: "/api/admin/batches/{id}",
        operationId: "deleteAdminBatch",
        summary: "Supprimer un lot",
        security: [["bearerAuth" => []]],
        tags: ["Lots d'Articles (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Lot supprimé avec succès")]
    public function destroy($id)
    {
        $hospitalId = $this->getHospitalId();

        $batch = Batch::whereHas('article', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        if ($batch->batch_number === 'STANDARD') {
            return response()->json([
                'message' => 'Impossible de supprimer un lot STANDARD. Supprimez l\'article pour effacer ce lot.'
            ], 403);
        }

        $batch->delete();

        return response()->json([
            'message' => 'Lot supprimé avec succès'
        ], 200);
    }

    // =========================================================================
    // NOUVEAUX ENDPOINTS POUR LA GESTION DES STOCKS
    // =========================================================================

    /**
     * Initialiser les stocks (à zéro) pour TOUS les lots dans TOUTES les succursales
     */
    #[OA\Post(
        path: "/api/admin/batches/initialize-all-stocks",
        operationId: "initializeAllStocks",
        summary: "Générer les lignes de stock manquantes (à 0) pour tous les lots",
        security: [["bearerAuth" => []]],
        tags: ["Lots d'Articles (Admin)"]
    )]
    #[OA\Response(response: 200, description: "Stocks globaux synchronisés avec succès")]
    public function initializeAllStocks(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        
        $this->stockService->initializeAllStocksForHospital($hospitalId);

        return response()->json([
            'message' => 'Les stocks ont été synchronisés avec succès pour tous les lots et toutes les succursales.'
        ], 200);
    }

    /**
     * Initialiser les stocks (à zéro) pour UN lot spécifique dans TOUTES les succursales
     */
    #[OA\Post(
        path: "/api/admin/batches/{id}/initialize-stock",
        operationId: "initializeBatchStock",
        summary: "Générer les lignes de stock manquantes (à 0) pour un lot spécifique",
        security: [["bearerAuth" => []]],
        tags: ["Lots d'Articles (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Stock du lot synchronisé avec succès")]
    public function initializeBatchStock(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();

        // On vérifie que le lot appartient bien à l'hôpital
        $batch = Batch::whereHas('article', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        $this->stockService->initializeStockForBatch($batch, $hospitalId);

        return response()->json([
            'message' => "Le stock pour le lot {$batch->batch_number} a été généré dans toutes les succursales."
        ], 200);
    }
}