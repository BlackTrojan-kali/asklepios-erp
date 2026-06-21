<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Services\BatchService;
use App\Models\Pharmacy\Article;
use App\Models\Pharmacy\Stock;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Articles (Admin)", description: "Gestion du catalogue des articles, médicaments et consommables")]
class ArticleController extends Controller
{
    protected BatchService $batchService;

    // Injection du service dans le constructeur
    public function __construct(BatchService $batchService)
    {
        $this->batchService = $batchService;
    }

    private function getHospitalId()
    {
        if(auth()->user()->role->name == "admin"){
            return auth()->user()->profile_admin->hospital_id ;
        }
        else if(auth()->user()->role->name ==  "pharmacy"){
            return auth()->user()->profile_pharm->hospital_id;
        }
    }

    /**
     * Lister et rechercher des articles (Paginés)
     */
    #[OA\Get(
        path: "/api/admin/articles",
        operationId: "getAdminArticles",
        summary: "Lister les articles (Paginés)",
        security: [["bearerAuth" => []]],
        tags: ["Articles (Admin)"]
    )]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Nom ou Code-barres", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "category_id", in: "query", required: false, schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "per_page", description: "Nombre de résultats par page (défaut: 10)", in: "query", required: false, schema: new OA\Schema(type: "integer", default: 10))]
    #[OA\Parameter(name: "page", description: "Numéro de la page à récupérer (défaut: 1)", in: "query", required: false, schema: new OA\Schema(type: "integer", default: 1))]
    #[OA\Response(response: 200, description: "Liste paginée récupérée avec succès")]
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        $perPage = $request->query('per_page', 10);
        
        // 1. Déterminer si on filtre le stock pour une succursale précise 
        // (ex: Pharmacien connecté ou Admin qui filtre par succursale)
        $branchId = null;
        $user = auth()->user();
        if ($user && $user->profile_pharm) {
            $branchId = $user->profile_pharm->branch_id;
        } elseif ($request->filled('branch_id')) {
            $branchId = $request->query('branch_id');
        }

        $query = Article::with('category')->where('hospital_id', $hospitalId);

        // 2. SOUS-REQUÊTE : Calculer la quantité totale en stock (stock_qty)
        $query->addSelect([
            'stock_qty' => Stock::selectRaw('COALESCE(SUM(qty), 0)')
                ->join('batches', 'batches.id', '=', 'stocks.batch_id')
                ->whereColumn('batches.article_id', 'articles.id')
                ->when($branchId, function ($q) use ($branchId) {
                    $q->where('stocks.pharmacy_branch_id', $branchId);
                })
        ]);

        // 3. SOUS-REQUÊTE : Vérifier s'il y a des lots qui expirent bientôt (has_expiring_batches)
        $query->addSelect([
            'has_expiring_batches' => Stock::selectRaw('IF(COUNT(*) > 0, 1, 0)')
                ->join('batches', 'batches.id', '=', 'stocks.batch_id')
                ->whereColumn('batches.article_id', 'articles.id')
                ->where('stocks.qty', '>', 0) // On ne compte que s'il en reste en stock
                ->whereNotNull('batches.expire_date')
                ->where('batches.expire_date', '<=', now()->addMonths(3))
                ->when($branchId, function ($q) use ($branchId) {
                    $q->where('stocks.pharmacy_branch_id', $branchId);
                })
        ]);

        // --- FILTRES EXISTANTS ---
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->query('category_id'));
        }

        // 4. Exécuter la requête avec pagination
        $articles = $query->latest()->paginate($perPage);

        // 5. Typer correctement les attributs virtuels pour React/TypeScript
        // On utilise getCollection() pour modifier les items à l'intérieur du paginateur Laravel
        $articles->getCollection()->transform(function ($article) {
            $article->stock_qty = (float) $article->stock_qty;
            $article->has_expiring_batches = (bool) $article->has_expiring_batches;
            return $article;
        });

        return response()->json($articles, 200);
    }

    /**
     * Lister tous les articles (Sans pagination, pour les select)
     */
    #[OA\Get(
        path: "/api/admin/articles/all",
        operationId: "getAllAdminArticles",
        summary: "Lister tous les articles (Sans pagination)",
        security: [["bearerAuth" => []]],
        tags: ["Articles (Admin)"]
    )]
    #[OA\Response(response: 200, description: "Liste complète récupérée avec succès")]
    public function all(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        
        $branchId = null;
        $user = auth()->user();
        if ($user && $user->profile_pharm) {
            $branchId = $user->profile_pharm->branch_id;
        } elseif ($request->filled('branch_id')) {
            $branchId = $request->query('branch_id');
        }

        $query = Article::with('category')->where('hospital_id', $hospitalId);

        $query->addSelect([
            'stock_qty' => Stock::selectRaw('COALESCE(SUM(qty), 0)')
                ->join('batches', 'batches.id', '=', 'stocks.batch_id')
                ->whereColumn('batches.article_id', 'articles.id')
                ->when($branchId, function ($q) use ($branchId) {
                    $q->where('stocks.pharmacy_branch_id', $branchId);
                })
        ]);

        $query->addSelect([
            'has_expiring_batches' => Stock::selectRaw('IF(COUNT(*) > 0, 1, 0)')
                ->join('batches', 'batches.id', '=', 'stocks.batch_id')
                ->whereColumn('batches.article_id', 'articles.id')
                ->where('stocks.qty', '>', 0)
                ->whereNotNull('batches.expire_date')
                ->where('batches.expire_date', '<=', now()->addMonths(3))
                ->when($branchId, function ($q) use ($branchId) {
                    $q->where('stocks.pharmacy_branch_id', $branchId);
                })
        ]);

        $articles = $query->latest()->get();

        $articles->transform(function ($article) {
            $article->stock_qty = (float) $article->stock_qty;
            $article->has_expiring_batches = (bool) $article->has_expiring_batches;
            return $article;
        });

        return response()->json($articles, 200);
    }

    /**
     * Créer un nouvel article
     */
    #[OA\Post(
        path: "/api/admin/articles",
        operationId: "storeAdminArticle",
        summary: "Créer un article",
        security: [["bearerAuth" => []]],
        tags: ["Articles (Admin)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\MediaType(
            mediaType: "multipart/form-data",
            schema: new OA\Schema(
                required: ["category_id", "name", "track_batches"],
                properties: [
                    new OA\Property(property: "category_id", type: "integer"),
                    new OA\Property(property: "name", type: "string"),
                    new OA\Property(property: "barcode", type: "string", nullable: true),
                    new OA\Property(property: "global_min_qty", type: "number", format: "float"),
                    new OA\Property(property: "image", type: "string", format: "binary", nullable: true),
                    new OA\Property(property: "track_batches", type: "boolean", description: "Vrai si l'article gère des lots classiques")
                ]
            )
        )
    )]
    #[OA\Response(response: 201, description: "Article créé avec succès")]
    public function store(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $validatedData = $request->validate([
            'category_id' => [
                'required',
                Rule::exists('article_categories', 'id')->where(function ($query) use ($hospitalId) {
                    return $query->where('hospital_id', $hospitalId);
                }),
            ],
            'name' => 'required|string|max:255',
            'barcode' => 'nullable|string|max:100',
            'global_min_qty' => 'nullable|numeric|min:0',
            'track_batches' => 'required|string', 
            'image' => 'nullable|image|mimes:jpeg,png,jpg,svg|max:2048',
            'is_prescripted' => 'nullable|string', // <-- Changé ici (on s'attend à une string venant du FormData)
        ]);
        
        $validatedData['hospital_id'] = $hospitalId;
        
        // --- CORRECTION ICI : Cast des booléens ---
        $validatedData['track_batches'] = filter_var($validatedData['track_batches'], FILTER_VALIDATE_BOOLEAN);
        
        if (isset($validatedData['is_prescripted'])) {
            $validatedData['is_prescripted'] = filter_var($validatedData['is_prescripted'], FILTER_VALIDATE_BOOLEAN);
        } else {
            $validatedData['is_prescripted'] = false; // Valeur par défaut sécurisée
        }
        // ------------------------------------------

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('articles', 'public');
            $validatedData['image_url'] = '/storage/' . $path;
        }

        unset($validatedData['image']);

        $article = Article::create($validatedData);

        // Appel du service pour générer le lot STANDARD si nécessaire
        $this->batchService->handleStandardBatch($article);

        return response()->json([
            'message' => 'Article créé avec succès',
            'data' => $article->load('category')
        ], 201);
    }
    /**
     * Modifier un article
     */
   #[OA\Post( 
        path: "/api/admin/articles/{id}",
        operationId: "updateAdminArticle",
        summary: "Modifier un article",
        security: [["bearerAuth" => []]],
        tags: ["Articles (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Article modifié avec succès")]
    public function update(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();
        $article = Article::where('hospital_id', $hospitalId)->findOrFail($id);

        $validatedData = $request->validate([
            'category_id' => [
                'sometimes', 'required',
                Rule::exists('article_categories', 'id')->where(function ($query) use ($hospitalId) {
                    return $query->where('hospital_id', $hospitalId);
                }),
            ],
            'name' => 'sometimes|required|string|max:255',
            'barcode' => 'nullable|string|max:100',
            'global_min_qty' => 'nullable|numeric|min:0',
            'track_batches' => 'sometimes|required|string', 
            'image' => 'nullable|image|mimes:jpeg,png,jpg,svg|max:2048',
            'is_prescripted' => 'nullable|string', // <-- Changé ici
        ]);

        // --- CORRECTION ICI : Cast des booléens ---
        if (isset($validatedData['track_batches'])) {
            $validatedData['track_batches'] = filter_var($validatedData['track_batches'], FILTER_VALIDATE_BOOLEAN);
        }

        if (isset($validatedData['is_prescripted'])) {
            $validatedData['is_prescripted'] = filter_var($validatedData['is_prescripted'], FILTER_VALIDATE_BOOLEAN);
        }
        // ------------------------------------------

        if ($request->hasFile('image')) {
            if ($article->image_url) {
                $oldPath = str_replace('/storage/', '', $article->image_url);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('image')->store('articles', 'public');
            $validatedData['image_url'] = '/storage/' . $path;
        }

        unset($validatedData['image']);

        $article->update($validatedData);

        // Appel du service au cas où l'admin aurait décoché le suivi des lots
        $this->batchService->handleStandardBatch($article);

        return response()->json([
            'message' => 'Article mis à jour avec succès',
            'data' => $article->load('category')
        ], 200);
    }

    /**
     * Supprimer un article
     */
    #[OA\Delete(
        path: "/api/admin/articles/{id}",
        operationId: "deleteAdminArticle",
        summary: "Supprimer un article",
        security: [["bearerAuth" => []]],
        tags: ["Articles (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Article supprimé avec succès")]
    public function destroy($id)
    {
        $hospitalId = $this->getHospitalId();
        $article = Article::where('hospital_id', $hospitalId)->findOrFail($id);
        
        if ($article->image_url) {
            $oldPath = str_replace('/storage/', '', $article->image_url);
            Storage::disk('public')->delete($oldPath);
        }

        $article->delete();

        return response()->json([
            'message' => 'Article supprimé avec succès'
        ], 200);
    }
}