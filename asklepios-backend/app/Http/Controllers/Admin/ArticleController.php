<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Services\BatchService;
use App\Models\Pharmacy\Article;
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
        return auth()->user()->profile_admin->hospital_id ;}
        else if(auth()->user()->role->name ==  "pharmacy"){
            return auth()->user()->profile_pharm->hospital_id;
            
        }
    }

    /**
     * Lister et rechercher des articles
     */
    #[OA\Get(
        path: "/api/admin/articles",
        operationId: "getAdminArticles",
        summary: "Lister les articles",
        security: [["bearerAuth" => []]],
        tags: ["Articles (Admin)"]
    )]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Nom ou Code-barres", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "category_id", in: "query", required: false, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste récupérée avec succès")]
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        

        $query = Article::with('category')->where('hospital_id', $hospitalId);

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

        return response()->json($query->latest()->get(), 200);
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
            'track_batches' => 'required | string', // Validation du nouveau champ
            'image' => 'nullable|image|mimes:jpeg,png,jpg,svg|max:2048',
        ]);
        $validatedData['hospital_id'] = $hospitalId;
        // On s'assure que ce soit bien casté en booléen
        $validatedData['track_batches'] = filter_var($validatedData['track_batches'], FILTER_VALIDATE_BOOLEAN);

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
            'track_batches' => 'sometimes|required|string', // Validation du nouveau champ
            'image' => 'nullable|image|mimes:jpeg,png,jpg,svg|max:2048',
        ]);

        if (isset($validatedData['track_batches'])) {
            $validatedData['track_batches'] = filter_var($validatedData['track_batches'], FILTER_VALIDATE_BOOLEAN);
        }

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

        // Appel du service au cas où l'admin aurait décoché le suivi des lots (track_batches passé à false)
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