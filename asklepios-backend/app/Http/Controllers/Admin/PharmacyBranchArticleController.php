<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy\Article;
use App\Models\Pharmacy\PharmacyBranchArticle;
use App\Http\Exports\ArticlePricingExport;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Tarification Branches (Admin)", description: "Gestion des prix et configurations des articles par succursale")]
class PharmacyBranchArticleController extends Controller
{
    private function getHospitalId()
    {
        if (auth()->user()->role->name == "admin") {
            return auth()->user()->profile_admin->hospital_id;
        } else if (auth()->user()->role->name == "pharmacy") {
            return auth()->user()->profile_pharm->hospital_id;
        }
        abort(403, "Profil non autorisé.");
    }

    /* 
    Récupérer les articles de toutes les branches de pharmacy
    */
    #[OA\Get(
        path: "/api/admin/branch/articles",
        operationId: "getBranchArticles",
        summary: "Lister les configurations d'articles de toutes les succursales",
        security: [["bearerAuth" => []]],
        tags: ["Tarification Branches (Admin)"]
    )]
    #[OA\Response(response: 200, description: "Liste récupérée avec succès")]
    public function index()
    {
  
        $hospitalId = $this->getHospitalId();
        $articles = PharmacyBranchArticle::whereHas('branch', function ($query) use ($hospitalId) {
            $query->where('hospital_id', $hospitalId);
        })->with([
            'article.category',
            'branch.country',
            'branch.center',
            'defaultStorageLocation'
        ])->get();
        return response()->json($articles, 200);
    }

    /* 
    Récupérer les articles d'une branche de pharmacie spécifique, avec calcul du prix final (spécifique ou par défaut)
    */  
    #[OA\Get(
        path: "/api/admin/branch/{id}/articles",
        operationId: "getBranchArticlesById",
        summary: "Récupérer tous les articles avec les prix et configurations spécifiques d'une succursale (Paginé)",
        security: [["bearerAuth" => []]],
        tags: ["Tarification Branches (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la succursale de pharmacie", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Recherche par nom ou code-barres de l'article", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "page", in: "query", required: false, description: "Numéro de la page", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "per_page", in: "query", required: false, description: "Nombre d'éléments par page", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste des articles de la succursale récupérée avec succès")]
    public function show(Request $request, int $branch_id)
    {
        $hospitalId = $this->getHospitalId();
       
        $query = Article::where('hospital_id', $hospitalId);

        // Recherche par nom ou code-barres de l'article
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // Chargement des relations
        $query->with([
            'category',
            'branchArticles' => function ($q) use ($branch_id) {
                $q->where('pharmacy_branch_id', $branch_id)
                  ->with('defaultStorageLocation');
            },
            'batches.stocks' => function ($q) use ($branch_id) {
                $q->where('pharmacy_branch_id', $branch_id);
            }
        ]);

        // Pagination
        $perPage = $request->query('per_page', 15);
        $paginatedArticles = $query->paginate($perPage);

        // Formater chaque article pour y inclure le prix final appliqué, l'emplacement, les stocks et son statut d'activité
        $formattedArticles = collect($paginatedArticles->items())->map(function ($article) use ($branch_id) {
            // Configuration spécifique de la succursale (si existante)
            $branchConfig = $article->branchArticles->first();
            
            // Détermination du prix final :
            // Si une configuration de succursale existe ET que le prix spécial n'est pas nul, on l'utilise.
            // Sinon, on prend le prix global par défaut de l'article.
            $sellingPrice = ($branchConfig && $branchConfig->special_selling_price !== null)
                ? $branchConfig->special_selling_price
                : $article->default_selling_price;
                
            // Statut de disponibilité : Actif par défaut si aucune configuration locale n'existe
            $isActive = $branchConfig ? (bool) $branchConfig->is_active : true;
            
            // Emplacement par défaut : Null par défaut si aucune configuration locale n'existe
            $defaultStorageLocation = $branchConfig ? $branchConfig->defaultStorageLocation : null;

            // Calcul de la quantité physique cumulée en stock pour cette succursale
            $stockQty = $article->batches->flatMap(function ($batch) {
                return $batch->stocks;
            })->sum('qty');

            return [
                'id' => $article->id,
                'name' => $article->name,               
                'image_url' => $article->image_url,
                'track_batches' => $article->track_batches,
                'is_prescripted' => $article->is_prescripted,
                'category' => $article->category,                
                // Prix global d'origine
                'default_selling_price' => $article->default_selling_price,
                // Détail de la configuration locale brute (pour information)
                'branch_config' => $branchConfig ? [
                    'id' => $branchConfig->id,
                    'special_selling_price' => $branchConfig->special_selling_price,
                    'is_active' => $branchConfig->is_active,
                    'default_storage_location_id' => $branchConfig->default_storage_location_id,
                ] : null,
                // Valeurs finales consolidées pour la vente / l'affichage
                'selling_price' => $sellingPrice,
                'is_active' => $isActive,
                'default_storage_location' => $defaultStorageLocation,
                'stock_qty' => $stockQty, // Quantité physique totale en stock
            ];
        });

        return response()->json([
            'data' => $formattedArticles,
            'current_page' => $paginatedArticles->currentPage(),
            'last_page' => $paginatedArticles->lastPage(),
            'per_page' => $paginatedArticles->perPage(),
        ], 200);
    }

    /* 
    Mettre à jour ou créer un prix spécifique pour un article dans une succursale
    */
    #[OA\Post(
        path: "/api/admin/branch/articles/update-price",
        operationId: "updateBranchArticlePrice",
        summary: "Mettre à jour ou créer un prix de vente spécifique pour un article dans une succursale",
        security: [["bearerAuth" => []]],
        tags: ["Tarification Branches (Admin)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["pharmacy_branch_id", "article_id"],
            properties: [
                new OA\Property(property: "pharmacy_branch_id", type: "integer", example: 1),
                new OA\Property(property: "article_id", type: "integer", example: 1),
                new OA\Property(property: "special_selling_price", type: "number", format: "float", nullable: true, example: 1700.0)
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Prix mis à jour avec succès")]
    public function updatePrice(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $validated = $request->validate([
            'pharmacy_branch_id' => 'required|exists:pharmacy_branches,id',
            'article_id' => 'required|exists:articles,id',
            'special_selling_price' => 'nullable|numeric|min:0'
        ]);

        // Vérifier que la succursale appartient bien à l'hôpital de l'admin
        $branch = \App\Models\Pharmacy\PharmacyBranch::where('hospital_id', $hospitalId)
            ->findOrFail($validated['pharmacy_branch_id']);

        // Vérifier que l'article appartient bien à l'hôpital de l'admin
        $article = \App\Models\Pharmacy\Article::where('hospital_id', $hospitalId)
            ->findOrFail($validated['article_id']);

        // Rechercher ou créer la configuration pour ce couple succursale/article
        $branchArticle = PharmacyBranchArticle::updateOrCreate(
            [
                'pharmacy_branch_id' => $validated['pharmacy_branch_id'],
                'article_id' => $validated['article_id']
            ],
            [
                'special_selling_price' => $validated['special_selling_price']
            ]
        );

        // Nettoyage : si la ligne n'apporte plus aucune surcharge (prix, emplacement ou inactivité), on la supprime
        if ($branchArticle->special_selling_price === null && 
            $branchArticle->default_storage_location_id === null && 
            $branchArticle->is_active) {
            
            $branchArticle->delete();
            
            return response()->json([
                'message' => 'Configuration réinitialisée (prix par défaut appliqué)',
                'data' => null
            ], 200);
        }

        return response()->json([
            'message' => 'Prix spécifique mis à jour avec succès',
            'data' => $branchArticle
        ], 200);
    }

    #[OA\Get(
        path: "/api/admin/branch/articles/export/excel",
        operationId: "exportBranchArticlesExcel",
        summary: "Exporter la tarification des articles en Excel",
        security: [["bearerAuth" => []]],
        tags: ["Tarification Branches (Admin)"]
    )]
    #[OA\Parameter(name: "branch_id", in: "query", required: false, description: "ID de la succursale (optionnel, si non fourni exporte toutes les succursales)", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Fichier Excel généré et téléchargé")]
    public function exportExcel(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        $branchId = $request->query('branch_id');

        $exportData = collect();
        $hasMultipleBranches = true;

        if ($branchId) {
            $hasMultipleBranches = false;
            $branch = \App\Models\Pharmacy\PharmacyBranch::where('hospital_id', $hospitalId)
                ->with('country')
                ->findOrFail($branchId);

            $currency = $branch->country->currency ?? 'FCFA';

            $articles = Article::where('hospital_id', $hospitalId)
                ->with([
                    'branchArticles' => function ($q) use ($branchId) {
                        $q->where('pharmacy_branch_id', $branchId);
                    }
                ])
                ->get();

            foreach ($articles as $article) {
                $branchConfig = $article->branchArticles->first();
                $isActive = $branchConfig ? (bool) $branchConfig->is_active : true;

                if (!$isActive) {
                    continue;
                }

                $sellingPrice = ($branchConfig && $branchConfig->special_selling_price !== null)
                    ? $branchConfig->special_selling_price
                    : $article->default_selling_price;

                $exportData->push([
                    'Article' => $article->name,
                    'Prix de Vente' => number_format($sellingPrice, 0, ',', ' ') . ' ' . $currency
                ]);
            }

            $filename = "tarifs_" . \Illuminate\Support\Str::slug($branch->name, '_') . "_" . date('Ymd_His') . ".xlsx";
        } else {
            // Export all branches
            $branches = \App\Models\Pharmacy\PharmacyBranch::where('hospital_id', $hospitalId)
                ->with('country')
                ->get();

            foreach ($branches as $branch) {
                $currency = $branch->country->currency ?? 'FCFA';
                $branchIdVal = $branch->id;

                $articles = Article::where('hospital_id', $hospitalId)
                    ->with([
                        'branchArticles' => function ($q) use ($branchIdVal) {
                            $q->where('pharmacy_branch_id', $branchIdVal);
                        }
                    ])
                    ->get();

                foreach ($articles as $article) {
                    $branchConfig = $article->branchArticles->first();
                    $isActive = $branchConfig ? (bool) $branchConfig->is_active : true;

                    if (!$isActive) {
                        continue;
                    }

                    $sellingPrice = ($branchConfig && $branchConfig->special_selling_price !== null)
                        ? $branchConfig->special_selling_price
                        : $article->default_selling_price;

                    $exportData->push([
                        'Pharmacie' => $branch->name,
                        'Article' => $article->name,
                        'Prix de Vente' => number_format($sellingPrice, 0, ',', ' ') . ' ' . $currency
                    ]);
                }
            }

            $filename = "tarifs_toutes_succursales_" . date('Ymd_His') . ".xlsx";
        }

        return Excel::download(
            new ArticlePricingExport($exportData, $hasMultipleBranches),
            $filename
        );
    }
}
