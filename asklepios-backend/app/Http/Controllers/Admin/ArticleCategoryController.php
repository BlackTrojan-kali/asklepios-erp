<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy\ArticleCategory;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Catégories d'Articles (Admin)", description: "Gestion des catégories et sous-catégories de la pharmacie/stock")]
class ArticleCategoryController extends Controller
{
    /**
     * Obtenir l'ID de l'hôpital de l'administrateur connecté
     */
    
    private function getHospitalId()
    {
        return auth()->user()->profile_admin->hospital_id;
    }

    /**
     * Lister les catégories (Paginées, pour le tableau d'affichage)
     */
    #[OA\Get(
        path: "/api/admin/article-categories",
        operationId: "getAdminArticleCategories",
        summary: "Lister les catégories d'articles (Paginées)",
        security: [["bearerAuth" => []]],
        tags: ["Catégories d'Articles (Admin)"]
    )]
    #[OA\Parameter(name: "search", in: "query", required: false, schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "per_page", description: "Nombre de résultats par page (défaut: 10)", in: "query", required: false, schema: new OA\Schema(type: "integer", default: 10))]
    #[OA\Parameter(name: "page", description: "Numéro de la page à récupérer (défaut: 1)", in: "query", required: false, schema: new OA\Schema(type: "integer", default: 1))]
    #[OA\Response(response: 200, description: "Liste paginée récupérée avec succès")]
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        $perPage = $request->query('per_page', 10);

        // On charge la relation parentCategory pour l'affichage frontend
        $query = ArticleCategory::with('parentCategory')->where('hospital_id', $hospitalId);

        // Recherche par nom ou description
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Retourne le résultat paginé
        return response()->json($query->latest()->paginate($perPage), 200);
    }

    /**
     * Lister TOUTES les catégories (Sans pagination, pour les select du frontend)
     */
    #[OA\Get(
        path: "/api/admin/article-categories/all",
        operationId: "getAllAdminArticleCategories",
        summary: "Lister toutes les catégories (Sans pagination)",
        security: [["bearerAuth" => []]],
        tags: ["Catégories d'Articles (Admin)"]
    )]
    #[OA\Response(response: 200, description: "Liste complète récupérée avec succès")]
    public function all(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $categories = ArticleCategory::where('hospital_id', $hospitalId)
            ->latest()
            ->get();

        return response()->json($categories, 200);
    }

    /**
     * Créer une nouvelle catégorie
     */
    #[OA\Post(
        path: "/api/admin/article-categories",
        operationId: "storeAdminArticleCategory",
        summary: "Créer une catégorie",
        security: [["bearerAuth" => []]],
        tags: ["Catégories d'Articles (Admin)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["name"],
            properties: [
                new OA\Property(property: "name", type: "string", example: "Antibiotiques"),
                new OA\Property(property: "description", type: "string", example: "Médicaments antibactériens"),
                new OA\Property(property: "article_category_id", type: "integer", nullable: true, description: "ID de la catégorie parente")
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Catégorie créée avec succès")]
    public function store(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'article_category_id' => [
                'nullable',
                // Sécurité : Vérifie que la catégorie parente existe ET appartient au même hôpital
                Rule::exists('article_categories', 'id')->where(function ($query) use ($hospitalId) {
                    return $query->where('hospital_id', $hospitalId);
                }),
            ],
        ]);

        $validatedData['hospital_id'] = $hospitalId;

        $category = ArticleCategory::create($validatedData);

        return response()->json([
            'message' => 'Catégorie créée avec succès',
            'data' => $category->load('parentCategory')
        ], 201);
    }

    /**
     * Modifier une catégorie
     */
    #[OA\Put(
        path: "/api/admin/article-categories/{id}",
        operationId: "updateAdminArticleCategory",
        summary: "Modifier une catégorie",
        security: [["bearerAuth" => []]],
        tags: ["Catégories d'Articles (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "name", type: "string"),
                new OA\Property(property: "description", type: "string"),
                new OA\Property(property: "article_category_id", type: "integer", nullable: true)
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Catégorie modifiée avec succès")]
    public function update(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();
        $category = ArticleCategory::where('hospital_id', $hospitalId)->findOrFail($id);

        $validatedData = $request->validate([
            // On ignore l'ID actuel pour la règle unique du nom
            'name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('article_categories', 'name')->ignore($category->id)],
            'description' => 'nullable|string|max:1000',
            'article_category_id' => [
                'nullable',
                // Sécurité : Empêcher une catégorie d'être son propre parent
                Rule::notIn([$category->id]),
                Rule::exists('article_categories', 'id')->where(function ($query) use ($hospitalId) {
                    return $query->where('hospital_id', $hospitalId);
                }),
            ],
        ]);

        $category->update($validatedData);

        return response()->json([
            'message' => 'Catégorie mise à jour',
            'data' => $category->load('parentCategory')
        ], 200);
    }

    /**
     * Supprimer une catégorie
     */
    #[OA\Delete(
        path: "/api/admin/article-categories/{id}",
        operationId: "deleteAdminArticleCategory",
        summary: "Supprimer une catégorie",
        security: [["bearerAuth" => []]],
        tags: ["Catégories d'Articles (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Catégorie supprimée avec succès")]
    public function destroy($id)
    {
        $hospitalId = $this->getHospitalId();
        $category = ArticleCategory::where('hospital_id', $hospitalId)->findOrFail($id);
        
        $category->delete();

        return response()->json([
            'message' => 'Catégorie supprimée avec succès'
        ], 200);
    }
}