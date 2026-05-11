<?php

namespace App\Http\Controllers\SUPA;

use App\Http\Controllers\Controller;
use App\Models\Hospital;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Hôpitaux (SUPA)", description: "Gestion des hôpitaux par le Super Admin")]
class HospitalController extends Controller
{
    /**
     * Liste paginée et recherche d'hôpitaux
     */
    #[OA\Get(
        path: "/api/supa/hospitals",
        operationId: "getHospitals",
        summary: "Lister et rechercher des hôpitaux",
        security: [["bearerAuth" => []]],
        tags: ["Hôpitaux (SUPA)"]
    )]
    #[OA\Parameter(name: "search", description: "Recherche par nom ou NIU", in: "query", required: false, schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "per_page", description: "Résultats par page", in: "query", required: false, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Succès")]
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 10);
        $search = $request->query('search');

        $query = Hospital::query();

        if ($search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('niu', 'like', "%{$search}%");
        }

        $hospitals = $query->latest()->paginate($perPage);

        return response()->json($hospitals, 200);
    }

    /**
     * Créer un nouvel hôpital avec son logo
     */
    #[OA\Post(
        path: "/api/supa/hospitals",
        operationId: "storeHospital",
        summary: "Créer un hôpital",
        security: [["bearerAuth" => []]],
        tags: ["Hôpitaux (SUPA)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\MediaType(
            mediaType: "multipart/form-data",
            schema: new OA\Schema(
                required: ["name"],
                properties: [
                    new OA\Property(property: "name", type: "string", example: "Hôpital Général de Yaoundé"),
                    new OA\Property(property: "niu", type: "string", example: "M1234567890"),
                    new OA\Property(property: "logo", type: "string", format: "binary", description: "Fichier image (JPG, PNG)")
                ]
            )
        )
    )]
    #[OA\Response(response: 201, description: "Hôpital créé")]
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'niu' => 'nullable|string|max:255|unique:hospitals,niu',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,svg|max:2048', // Max 2MB
        ]);

        $hospital = new Hospital();
        $hospital->name = $validatedData['name'];
        $hospital->niu = $validatedData['niu'] ?? null;

        // Gestion de l'upload de l'image
        if ($request->hasFile('logo')) {
            // Sauvegarde dans storage/app/public/hospitals/logos
            $path = $request->file('logo')->store('hospitals/logos', 'public');
            $hospital->logo_url = $path;
        }

        $hospital->save();

        return response()->json([
            'message' => 'Hôpital créé avec succès',
            'data' => $hospital
        ], 201);
    }

    /**
     * Afficher un hôpital
     */
    #[OA\Get(
        path: "/api/supa/hospitals/{id}",
        operationId: "showHospital",
        summary: "Détails d'un hôpital",
        security: [["bearerAuth" => []]],
        tags: ["Hôpitaux (SUPA)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Succès")]
    public function show($id)
    {
        $hospital = Hospital::findOrFail($id);
        return response()->json($hospital, 200);
    }

    /**
     * Modifier un hôpital (Utiliser POST avec _method=PUT depuis React)
     */
    #[OA\Post(
        path: "/api/supa/hospitals/{id}",
        operationId: "updateHospital",
        summary: "Modifier un hôpital (Envoyer en POST avec _method=PUT)",
        security: [["bearerAuth" => []]],
        tags: ["Hôpitaux (SUPA)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\MediaType(
            mediaType: "multipart/form-data",
            schema: new OA\Schema(
                properties: [
                    new OA\Property(property: "_method", type: "string", example: "PUT"),
                    new OA\Property(property: "name", type: "string"),
                    new OA\Property(property: "niu", type: "string"),
                    new OA\Property(property: "logo", type: "string", format: "binary")
                ]
            )
        )
    )]
    #[OA\Response(response: 200, description: "Modifié avec succès")]
    public function update(Request $request, $id)
    {
        $hospital = Hospital::findOrFail($id);

        $validatedData = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'niu' => 'nullable|string|max:255|unique:hospitals,niu,' . $hospital->id,
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,svg|max:2048',
        ]);

        if (isset($validatedData['name'])) $hospital->name = $validatedData['name'];
        if (array_key_exists('niu', $validatedData)) $hospital->niu = $validatedData['niu'];

        // Si une nouvelle image est uploadée
        if ($request->hasFile('logo')) {
            // 1. Supprimer l'ancienne image si elle existe
            if ($hospital->logo_url && Storage::disk('public')->exists($hospital->logo_url)) {
                Storage::disk('public')->delete($hospital->logo_url);
            }
            
            // 2. Sauvegarder la nouvelle image
            $path = $request->file('logo')->store('hospitals/logos', 'public');
            $hospital->logo_url = $path;
        }

        $hospital->save();

        return response()->json([
            'message' => 'Hôpital mis à jour avec succès',
            'data' => $hospital
        ], 200);
    }

    /**
     * Supprimer un hôpital et son logo
     */
    #[OA\Delete(
        path: "/api/supa/hospitals/{id}",
        operationId: "deleteHospital",
        summary: "Supprimer un hôpital",
        security: [["bearerAuth" => []]],
        tags: ["Hôpitaux (SUPA)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Supprimé avec succès")]
    public function destroy($id)
    {
        $hospital = Hospital::findOrFail($id);

        // Supprimer l'image associée du serveur
        if ($hospital->logo_url && Storage::disk('public')->exists($hospital->logo_url)) {
            Storage::disk('public')->delete($hospital->logo_url);
        }

        $hospital->delete();

        return response()->json([
            'message' => 'Hôpital supprimé avec succès'
        ], 200);
    }
}