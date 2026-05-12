<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Center;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Centres (Admin)", description: "Gestion des centres médicaux de l'hôpital de l'administrateur")]
class CenterController extends Controller
{
    /**
     * Obtenir l'ID de l'hôpital de l'administrateur connecté
     */
    private function getHospitalId()
    {
        // On suppose que la relation dans ton modèle User s'appelle 'profile_admin' ou 'profileAdmin'
        // Ajuste le nom de la relation si nécessaire selon ton modèle User.
        return auth()->user()->profile_admin->hospital_id; 
    }

    /**
     * Liste paginée des centres de l'hôpital (avec recherche par adresse et pays)
     */
    #[OA\Get(
        path: "/api/admin/centers",
        operationId: "getAdminCenters",
        summary: "Lister les centres de l'hôpital",
        security: [["bearerAuth" => []]],
        tags: ["Centres (Admin)"]
    )]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Recherche par nom", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "address", in: "query", required: false, description: "Recherche par adresse", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "country_id", in: "query", required: false, description: "Filtrer par pays", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "per_page", in: "query", required: false, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste des centres récupérée avec succès")]
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        $perPage = $request->query('per_page', 10);

        // On restreint STRICTEMENT la requête à l'hôpital de l'admin
        // On charge aussi la relation country pour l'affichage frontend
        $query = Center::with('country')->where('hospital_id', $hospitalId);

        // Recherche générale (Nom)
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where('name', 'like', "%{$search}%");
        }

        // Filtre par Adresse
        if ($request->filled('address')) {
            $address = $request->query('address');
            $query->where('address', 'like', "%{$address}%");
        }

        // Filtre par Pays (ID du pays sélectionné dans le formulaire React)
        if ($request->filled('country_id')) {
            $query->where('country_id', $request->query('country_id'));
        }

        $centers = $query->latest()->paginate($perPage);

        return response()->json($centers, 200);
    }

    /**
     * Créer un nouveau centre pour cet hôpital
     */
    #[OA\Post(
        path: "/api/admin/centers",
        operationId: "storeAdminCenter",
        summary: "Créer un centre",
        security: [["bearerAuth" => []]],
        tags: ["Centres (Admin)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["name", "country_id"],
            properties: [
                new OA\Property(property: "name", type: "string", example: "Centre Principal"),
                new OA\Property(property: "phone_1", type: "string", example: "+237 600000000"),
                new OA\Property(property: "phone_2", type: "string", nullable: true),
                new OA\Property(property: "address", type: "string", example: "Quartier Mvan, Yaoundé"),
                new OA\Property(property: "country_id", type: "integer", example: 1)
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Centre créé avec succès")]
    #[OA\Response(response: 422, description: "Erreur de validation")]
    public function store(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'phone_1' => 'nullable|string|max:20',
            'phone_2' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'country_id' => 'required|exists:countries,id',
        ]);

        // On force le hospital_id avec celui de l'admin connecté (sécurité)
        $validatedData['hospital_id'] = $hospitalId;

        $center = Center::create($validatedData);

        return response()->json([
            'message' => 'Centre créé avec succès',
            'data' => $center->load('country')
        ], 201);
    }

    /**
     * Afficher un centre spécifique (si et seulement s'il appartient à l'hôpital)
     */
    #[OA\Get(
        path: "/api/admin/centers/{id}",
        operationId: "showAdminCenter",
        summary: "Détails d'un centre",
        security: [["bearerAuth" => []]],
        tags: ["Centres (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Détails récupérés")]
    #[OA\Response(response: 404, description: "Centre non trouvé ou accès refusé")]
    public function show($id)
    {
        $hospitalId = $this->getHospitalId();

        // Le where('hospital_id') empêche de voir un centre d'un autre hôpital
        $center = Center::with('country')
            ->where('hospital_id', $hospitalId)
            ->findOrFail($id);

        return response()->json($center, 200);
    }

    /**
     * Modifier un centre
     */
    #[OA\Put(
        path: "/api/admin/centers/{id}",
        operationId: "updateAdminCenter",
        summary: "Modifier un centre",
        security: [["bearerAuth" => []]],
        tags: ["Centres (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "name", type: "string"),
                new OA\Property(property: "phone_1", type: "string"),
                new OA\Property(property: "phone_2", type: "string"),
                new OA\Property(property: "address", type: "string"),
                new OA\Property(property: "country_id", type: "integer")
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Centre modifié avec succès")]
    #[OA\Response(response: 404, description: "Centre non trouvé ou accès refusé")]
    public function update(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();

        $center = Center::where('hospital_id', $hospitalId)->findOrFail($id);

        $validatedData = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone_1' => 'nullable|string|max:20',
            'phone_2' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'country_id' => 'sometimes|required|exists:countries,id',
        ]);

        $center->update($validatedData);

        return response()->json([
            'message' => 'Centre mis à jour avec succès',
            'data' => $center->load('country')
        ], 200);
    }

    /**
     * Supprimer un centre
     */
    #[OA\Delete(
        path: "/api/admin/centers/{id}",
        operationId: "deleteAdminCenter",
        summary: "Supprimer un centre",
        security: [["bearerAuth" => []]],
        tags: ["Centres (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Centre supprimé avec succès")]
    #[OA\Response(response: 404, description: "Centre non trouvé ou accès refusé")]
    public function destroy($id)
    {
        $hospitalId = $this->getHospitalId();

        // Sécurité : On s'assure que le centre appartient bien à cet hôpital avant suppression
        $center = Center::where('hospital_id', $hospitalId)->findOrFail($id);
        
        $center->delete();

        return response()->json([
            'message' => 'Centre supprimé avec succès'
        ], 200);
    }
}