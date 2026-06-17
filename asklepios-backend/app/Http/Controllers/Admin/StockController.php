<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy\Stock;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Stocks", description: "Consultation des niveaux de stocks par succursale et par lot")]
class StockController extends Controller
{
    /**
     * Récupère l'ID de l'hôpital de l'utilisateur connecté
     * Gère à la fois le cas d'un Admin et d'un Pharmacien
     */
    private function getHospitalId()
    {
        if (auth()->user()->profile_admin) {
            return auth()->user()->profile_admin->hospital_id;
        }
        if (auth()->user()->profile_pharm) {
            return auth()->user()->profile_pharm->hospital_id;
        }
        return null;
    }

    /**
     * 1. VUE GLOBALE PAGINÉE (Pour les Administrateurs ou Superviseurs)
     * Liste tous les stocks de l'hôpital, avec possibilité de filtrer par succursale.
     */
    #[OA\Get(
        path: "/api/admin/stocks/global",
        operationId: "getGlobalStocks",
        summary: "Voir les stocks globaux paginés (Toutes succursales)",
        security: [["bearerAuth" => []]],
        tags: ["Stocks"]
    )]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Nom de l'article, code-barres ou N° de lot", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "branch_id", in: "query", required: false, description: "Filtrer par succursale", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "article_id", in: "query", required: false, description: "Filtrer par article", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "page", in: "query", required: false, description: "Numéro de la page", schema: new OA\Schema(type: "integer", default: 1))]
    #[OA\Parameter(name: "per_page", in: "query", required: false, description: "Nombre d'éléments par page", schema: new OA\Schema(type: "integer", default: 15))]
    #[OA\Response(response: 200, description: "Liste paginée des stocks récupérée avec succès")]
    public function getGlobalStocks(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        $perPage = $request->query('per_page', 15); // 15 éléments par défaut

        // On charge les relations nécessaires pour l'affichage (Succursale, Lot, Article, Catégorie)
        $query = Stock::with(['branch', 'batch.article.category'])
            // On s'assure de ne prendre que les stocks des succursales de CET hôpital
            ->whereHas('branch', function ($q) use ($hospitalId) {
                $q->where('hospital_id', $hospitalId);
            });

        // FILTRES
        if ($request->filled('branch_id')) {
            $query->where('pharmacy_branch_id', $request->query('branch_id'));
        }

        if ($request->filled('article_id')) {
            $query->whereHas('batch', function ($q) use ($request) {
                $q->where('article_id', $request->query('article_id'));
            });
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->whereHas('batch', function ($q) use ($search) {
                // Recherche par numéro de lot
                $q->where('batch_number', 'like', "%{$search}%")
                  // OU recherche par nom/code-barres de l'article
                  ->orWhereHas('article', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%")
                         ->orWhere('barcode', 'like', "%{$search}%");
                  });
            });
        }

        // On retourne les résultats paginés
        return response()->json($query->paginate($perPage), 200);
    }

    /**
     * 2. VUE LOCALE PAGINÉE (Pour les Pharmaciens / Vendeurs)
     * Liste uniquement les stocks de la succursale du pharmacien connecté.
     */
    #[OA\Get(
        path: "/api/pharmacien/stocks/my-branch",
        operationId: "getMyBranchStocks",
        summary: "Voir les stocks paginés de ma succursale",
        security: [["bearerAuth" => []]],
        tags: ["Stocks"]
    )]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Nom, code-barres ou N° de lot", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "article_id", in: "query", required: false, description: "Filtrer par article", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "page", in: "query", required: false, description: "Numéro de la page", schema: new OA\Schema(type: "integer", default: 1))]
    #[OA\Parameter(name: "per_page", in: "query", required: false, description: "Nombre d'éléments par page", schema: new OA\Schema(type: "integer", default: 15))]
    #[OA\Response(response: 200, description: "Liste paginée des stocks récupérée avec succès")]
    public function getMyBranchStocks(Request $request)
    {
        // On s'assure que l'utilisateur est bien un pharmacien rattaché à une succursale
        $profile = auth()->user()->profile_pharm;
        
        if (!$profile || !$profile->branch_id) {
            return response()->json(['message' => 'Accès refusé. Vous n\'êtes affecté à aucune succursale.'], 403);
        }

        $branchId = $profile->branch_id;
        $perPage = $request->query('per_page', 15); // 15 éléments par défaut

        // On charge le Lot, l'Article et la Catégorie
        $query = Stock::with(['batch.article.category'])
            ->where('pharmacy_branch_id', $branchId);

        // FILTRES
        if ($request->filled('article_id')) {
            $query->whereHas('batch', function ($q) use ($request) {
                $q->where('article_id', $request->query('article_id'));
            });
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->whereHas('batch', function ($q) use ($search) {
                $q->where('batch_number', 'like', "%{$search}%")
                  ->orWhereHas('article', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%")
                         ->orWhere('barcode', 'like', "%{$search}%");
                  });
            });
        }

        // On retourne les résultats paginés
        return response()->json($query->paginate($perPage), 200);
    }
}