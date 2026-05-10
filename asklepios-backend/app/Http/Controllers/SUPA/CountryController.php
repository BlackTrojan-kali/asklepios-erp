<?php

namespace App\Http\Controllers\SUPA;

use App\Http\Controllers\Controller;
use App\Models\Country;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Pays (Countries)", description: "Gestion des pays pris en charge par l'ERP")]
class CountryController extends Controller
{
    /**
     * Liste paginée et recherche de pays
     */
    #[OA\Get(
        path: "/api/countries",
        operationId: "getCountries",
        summary: "Lister et rechercher des pays",
        description: "Retourne une liste paginée de pays. Permet de filtrer par nom ou par code via le paramètre 'search'.",
        security: [["bearerAuth" => []]],
        tags: ["Pays (Countries)"]
    )]
    #[OA\Parameter(name: "search", description: "Terme de recherche (nom ou code)", in: "query", required: false, schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "per_page", description: "Nombre de résultats par page (défaut: 10)", in: "query", required: false, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste récupérée avec succès")]
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 10);
        $search = $request->query('search');

        // La requête de base
        $query = Country::query();

        // Si on a un terme de recherche, on filtre sur le nom ou le code
        if ($search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
        }

        // On retourne le résultat paginé (Laravel gère automatiquement le format JSON avec les liens de pagination)
        $countries = $query->paginate($perPage);

        return response()->json($countries, 200);
    }

    /**
     * Insérer un nouveau pays
     */
    #[OA\Post(
        path: "/api/countries",
        operationId: "storeCountry",
        summary: "Créer un nouveau pays",
        security: [["bearerAuth" => []]],
        tags: ["Pays (Countries)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["name", "code", "currency"],
            properties: [
                new OA\Property(property: "name", type: "string", example: "Cameroun"),
                new OA\Property(property: "code", type: "string", example: "CMR"),
                new OA\Property(property: "currency", type: "string", example: "XAF")
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Pays créé avec succès")]
    #[OA\Response(response: 422, description: "Erreur de validation")]
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255|unique:countries,name',
            'code' => 'required|string|max:10|unique:countries,code',
            'currency' => 'required|string|max:10',
        ]);

        $country = Country::create($validatedData);

        return response()->json([
            'message' => 'Pays inséré avec succès',
            'data' => $country
        ], 201);
    }

    /**
     * Rechercher un pays en particulier par son ID
     */
    #[OA\Get(
        path: "/api/countries/{id}",
        operationId: "showCountry",
        summary: "Afficher les détails d'un pays",
        security: [["bearerAuth" => []]],
        tags: ["Pays (Countries)"]
    )]
    #[OA\Parameter(name: "id", description: "ID du pays", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Pays trouvé")]
    #[OA\Response(response: 404, description: "Pays non trouvé")]
    public function show($id)
    {
        // findOrFail renverra automatiquement une erreur 404 si l'ID n'existe pas
        $country = Country::findOrFail($id);

        return response()->json($country, 200);
    }

    /**
     * Modifier un pays existant
     */
    #[OA\Put(
        path: "/api/countries/{id}",
        operationId: "updateCountry",
        summary: "Modifier un pays",
        security: [["bearerAuth" => []]],
        tags: ["Pays (Countries)"]
    )]
    #[OA\Parameter(name: "id", description: "ID du pays à modifier", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "name", type: "string", example: "République du Cameroun"),
                new OA\Property(property: "code", type: "string", example: "CMR"),
                new OA\Property(property: "currency", type: "string", example: "XAF")
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Pays modifié avec succès")]
    #[OA\Response(response: 404, description: "Pays non trouvé")]
    public function update(Request $request, $id)
    {
        $country = Country::findOrFail($id);

        // Validation (on ignore l'ID actuel pour les règles d'unicité)
        $validatedData = $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:countries,name,' . $country->id,
            'code' => 'sometimes|required|string|max:10|unique:countries,code,' . $country->id,
            'currency' => 'sometimes|required|string|max:10',
        ]);

        $country->update($validatedData);

        return response()->json([
            'message' => 'Pays mis à jour avec succès',
            'data' => $country
        ], 200);
    }
}