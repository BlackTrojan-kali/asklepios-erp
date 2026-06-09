<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Services\ProviderService;
use App\Models\Pharmacy\Provider;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Fournisseurs (Admin)", description: "Gestion des fournisseurs de la pharmacie")]
class ProviderController extends Controller
{
    protected ProviderService $providerService;

    public function __construct(ProviderService $providerService)
    {
        $this->providerService = $providerService;
    }
/**
     * Exporter les fournisseurs en PDF
     */
    #[OA\Get(
        path: "/api/admin/providers/export/pdf",
        operationId: "exportProvidersPdf",
        summary: "Télécharger la liste en PDF",
        security: [["bearerAuth" => []]],
        tags: ["Fournisseurs (Admin)"]
    )]
    #[OA\Response(response: 200, description: "Fichier PDF généré et téléchargé")] // <-- LA LIGNE MANQUANTE
    public function exportPdf()
    {
        return $this->providerService->exportPdf($this->getHospitalId());
    }

    /**
     * Exporter les fournisseurs en Excel
     */
    #[OA\Get(
        path: "/api/admin/providers/export/excel",
        operationId: "exportProvidersExcel",
        summary: "Télécharger la liste en Excel",
        security: [["bearerAuth" => []]],
        tags: ["Fournisseurs (Admin)"]
    )]
    #[OA\Response(response: 200, description: "Fichier Excel généré et téléchargé")] // <-- LA LIGNE MANQUANTE
    public function exportExcel()
    {
        return $this->providerService->exportExcel($this->getHospitalId());
    }

    /**
     * Importer les fournisseurs depuis un fichier Excel
     */
    #[OA\Post(
        path: "/api/admin/providers/import",
        operationId: "importProvidersExcel",
        summary: "Importer une liste Excel",
        security: [["bearerAuth" => []]],
        tags: ["Fournisseurs (Admin)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\MediaType(
            mediaType: "multipart/form-data",
            schema: new OA\Schema(
                properties: [
                    new OA\Property(property: "file", type: "string", format: "binary", description: "Fichier Excel (.xlsx, .xls)")
                ]
            )
        )
    )]
    #[OA\Response(response: 200, description: "Importation terminée avec succès")] // <-- LA LIGNE MANQUANTE
    public function importExcel(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:2048' // Max 2MB
        ]);

        $this->providerService->importExcel($request->file('file'), $this->getHospitalId());

        return response()->json([
            'message' => 'Importation terminée avec succès'
        ], 200);
    }
    /**
     * Obtenir l'ID de l'hôpital de l'administrateur connecté
     */
    private function getHospitalId()
    {
        return auth()->user()->profile_admin->hospital_id;
    }

    /**
     * Lister et filtrer les fournisseurs
     */
    #[OA\Get(
        path: "/api/admin/providers",
        operationId: "getProviders",
        summary: "Lister les fournisseurs",
        security: [["bearerAuth" => []]],
        tags: ["Fournisseurs (Admin)"]
    )]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Recherche par nom, téléphone ou NIU", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Liste récupérée avec succès")]
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $query = Provider::where('hospital_id', $hospitalId);

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('niu', 'like', "%{$search}%");
            });
        }

        // Tri alphabétique par défaut
        return response()->json($query->orderBy('name', 'asc')->get(), 200);
    }

    /**
     * Créer un fournisseur
     */
    #[OA\Post(
        path: "/api/admin/providers",
        operationId: "storeProvider",
        summary: "Créer un fournisseur",
        security: [["bearerAuth" => []]],
        tags: ["Fournisseurs (Admin)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["name"],
            properties: [
                new OA\Property(property: "name", type: "string"),
                new OA\Property(property: "phone", type: "integer", nullable: true),
                new OA\Property(property: "address", type: "string", nullable: true),
                new OA\Property(property: "niu", type: "string", nullable: true)
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Fournisseur créé avec succès")]
    public function store(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $validatedData = $request->validate([
            'name'    => [
                'required', 'string', 'max:255',
                // Empêcher les doublons de noms pour le même hôpital
                Rule::unique('providers')->where(function ($query) use ($hospitalId) {
                    return $query->where('hospital_id', $hospitalId);
                }),
            ],
            'phone'   => 'nullable|numeric',
            'address' => 'nullable|string|max:255',
            'niu'     => 'nullable|string|max:255',
        ]);

        $validatedData['hospital_id'] = $hospitalId;

        $provider = Provider::create($validatedData);

        return response()->json([
            'message' => 'Fournisseur enregistré avec succès',
            'data'    => $provider
        ], 201);
    }

    /**
     * Modifier un fournisseur
     */
    #[OA\Put(
        path: "/api/admin/providers/{id}",
        operationId: "updateProvider",
        summary: "Modifier un fournisseur",
        security: [["bearerAuth" => []]],
        tags: ["Fournisseurs (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "name", type: "string"),
                new OA\Property(property: "phone", type: "integer", nullable: true),
                new OA\Property(property: "address", type: "string", nullable: true),
                new OA\Property(property: "niu", type: "string", nullable: true)
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Fournisseur mis à jour")]
    public function update(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();

        $provider = Provider::where('hospital_id', $hospitalId)->findOrFail($id);

        $validatedData = $request->validate([
            'name'    => [
                'sometimes', 'required', 'string', 'max:255',
                Rule::unique('providers')->where(function ($query) use ($hospitalId) {
                    return $query->where('hospital_id', $hospitalId);
                })->ignore($provider->id),
            ],
            'phone'   => 'nullable|numeric',
            'address' => 'nullable|string|max:255',
            'niu'     => 'nullable|string|max:255',
        ]);

        $provider->update($validatedData);

        return response()->json([
            'message' => 'Fournisseur mis à jour avec succès',
            'data'    => $provider
        ], 200);
    }

    /**
     * Supprimer un fournisseur
     */
    #[OA\Delete(
        path: "/api/admin/providers/{id}",
        operationId: "deleteProvider",
        summary: "Supprimer un fournisseur",
        security: [["bearerAuth" => []]],
        tags: ["Fournisseurs (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Fournisseur supprimé")]
    public function destroy($id)
    {
        $hospitalId = $this->getHospitalId();

        $provider = Provider::where('hospital_id', $hospitalId)->findOrFail($id);
        
        $provider->delete();

        return response()->json([
            'message' => 'Fournisseur supprimé avec succès'
        ], 200);
    }
}