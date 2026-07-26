<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\InsuranceCompany;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Admin - Assurances",
    description: "Gestion des compagnies d'assurance par l'administrateur de l'hôpital"
)]
class InsuranceCompanyController extends Controller
{
    #[OA\Get(
        path: "/api/admin/insurance-companies",
        operationId: "getInsuranceCompanies",
        summary: "Lister et filtrer les assurances",
        description: "Récupère la liste des compagnies d'assurance. Permet de filtrer par hôpital ou d'effectuer une recherche par nom/email.",
        tags: ["Admin - Assurances"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(
        name: "hospital_id",
        in: "query",
        required: false,
        description: "Filtrer par ID de l'hôpital",
        schema: new OA\Schema(type: "integer")
    )]
    #[OA\Parameter(
        name: "search",
        in: "query",
        required: false,
        description: "Recherche par nom ou email",
        schema: new OA\Schema(type: "string")
    )]
    #[OA\Response(
        response: 200,
        description: "Liste récupérée avec succès",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "status", type: "string", example: "success"),
                new OA\Property(property: "data", type: "array", items: new OA\Items(
                    properties: [
                        new OA\Property(property: "id", type: "integer", example: 1),
                        new OA\Property(property: "hospital_id", type: "integer", example: 1),
                        new OA\Property(property: "name", type: "string", example: "AXA Assurance"),
                        new OA\Property(property: "email", type: "string", example: "contact@axa.cm"),
                        new OA\Property(property: "contact", type: "string", example: "+237 600000000")
                    ]
                ))
            ]
        )
    )]
    public function index(Request $request)
    {
        $query = InsuranceCompany::query();

        if ($request->has('hospital_id')) {
            $query->where('hospital_id', $request->hospital_id);
        }

        if ($request->has('search') && !empty($request->search)) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('name', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('email', 'LIKE', "%{$searchTerm}%");
            });
        }

        $insurances = $query->latest()->get();

        return response()->json([
            'status' => 'success',
            'data' => $insurances
        ]);
    }

    #[OA\Post(
        path: "/api/admin/insurance-companies",
        operationId: "storeInsuranceCompany",
        summary: "Ajouter une compagnie d'assurance",
        description: "Crée une nouvelle assurance rattachée à un hôpital.",
        tags: ["Admin - Assurances"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["hospital_id", "name"],
            properties: [
                new OA\Property(property: "hospital_id", type: "integer", description: "ID de l'hôpital", example: 1),
                new OA\Property(property: "name", type: "string", description: "Nom de l'assurance", example: "Sanlam"),
                new OA\Property(property: "email", type: "string", format: "email", description: "Email de contact", example: "contact@sanlam.com"),
                new OA\Property(property: "contact", type: "string", description: "Numéro de téléphone", example: "+237 699999999")
            ]
        )
    )]
    #[OA\Response(
        response: 201,
        description: "Assurance créée avec succès",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "status", type: "string", example: "success"),
                new OA\Property(property: "message", type: "string", example: "Compagnie d'assurance ajoutée avec succès."),
                new OA\Property(property: "data", type: "object")
            ]
        )
    )]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'hospital_id' => 'required|exists:hospitals,id',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'contact' => 'nullable|string|max:255',
        ]);

        $insurance = InsuranceCompany::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Compagnie d\'assurance ajoutée avec succès.',
            'data' => $insurance
        ], 201);
    }

    #[OA\Put(
        path: "/api/admin/insurance-companies/{id}",
        operationId: "updateInsuranceCompany",
        summary: "Modifier une assurance",
        description: "Met à jour les informations d'une compagnie d'assurance existante.",
        tags: ["Admin - Assurances"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(
        name: "id",
        in: "path",
        required: true,
        description: "ID de l'assurance",
        schema: new OA\Schema(type: "integer", example: 1)
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "name", type: "string", example: "Sanlam Cameroun"),
                new OA\Property(property: "email", type: "string", format: "email", example: "nouveau@sanlam.cm"),
                new OA\Property(property: "contact", type: "string", example: "600000000")
            ]
        )
    )]
    #[OA\Response(
        response: 200,
        description: "Assurance mise à jour",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "status", type: "string", example: "success"),
                new OA\Property(property: "message", type: "string", example: "Informations mises à jour avec succès."),
                new OA\Property(property: "data", type: "object")
            ]
        )
    )]
    public function update(Request $request, $id)
    {
        $insurance = InsuranceCompany::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|max:255',
            'contact' => 'nullable|string|max:255',
        ]);

        $insurance->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Informations mises à jour avec succès.',
            'data' => $insurance
        ]);
    }

    #[OA\Delete(
        path: "/api/admin/insurance-companies/{id}",
        operationId: "destroyInsuranceCompany",
        summary: "Supprimer une assurance",
        description: "Supprime définitivement une compagnie d'assurance de la base de données.",
        tags: ["Admin - Assurances"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(
        name: "id",
        in: "path",
        required: true,
        description: "ID de l'assurance à supprimer",
        schema: new OA\Schema(type: "integer", example: 1)
    )]
    #[OA\Response(
        response: 200,
        description: "Suppression réussie",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "status", type: "string", example: "success"),
                new OA\Property(property: "message", type: "string", example: "Compagnie d'assurance supprimée avec succès.")
            ]
        )
    )]
    public function destroy($id)
    {
        $insurance = InsuranceCompany::findOrFail($id);
        $insurance->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Compagnie d\'assurance supprimée avec succès.'
        ]);
    }
}