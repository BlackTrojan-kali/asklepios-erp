<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\Hospital\BloodDonor;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;
use App\Http\Exports\BloodDonorsExport;
use App\Http\Imports\BloodDonorsImport;

#[OA\Tag(name: "Blood Bank - Donors", description: "Gestion des donneurs de sang, incluant import/export Excel")]
class BloodDonorController extends Controller
{
    /**
     * Applique les filtres réutilisables pour l'index et l'export
     */
    private function applyFilters($query, Request $request)
    {
        $query->when($request->filled('search'), function ($q) use ($request) {
            $q->where(function ($sub) use ($request) {
                $sub->where('first_name', 'like', '%' . $request->search . '%')
                    ->orWhere('last_name', 'like', '%' . $request->search . '%')
                    ->orWhere('phone_contact', 'like', '%' . $request->search . '%');
            });
        });

        $query->when($request->filled('center_id'), function ($q) use ($request) {
            $q->where('center_id', $request->center_id);
        });

        $query->when($request->filled('blood_type'), function ($q) use ($request) {
            $q->where('blood_type', $request->blood_type);
        });

        $query->when($request->filled('serology_status'), function ($q) use ($request) {
            $q->where('serology_status', $request->serology_status);
        });

        // RESOLVER DE SCOPE ADMIN : Hôpital via Centre
        $query->when($request->filled('hospital_id'), function ($q) use ($request) {
            $q->whereHas('center', function ($subQuery) use ($request) {
                $subQuery->where('hospital_id', $request->hospital_id);
            });
        });

        return $query;
    }

    #[OA\Get(
        path: "/api/admin/blood-donors",
        summary: "Lister les donneurs de sang",
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "center_id", in: "query", schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "hospital_id", in: "query", schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "blood_type", in: "query", schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "serology_status", in: "query", schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "search", in: "query", schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "per_page", in: "query", schema: new OA\Schema(type: "integer"))
        ],
        responses: [new OA\Response(response: 200, description: "Liste paginée des donneurs")]
    )]
    public function index(Request $request)
    {
        $query = BloodDonor::with(['center',"bloodBags"])->orderBy('created_at', 'desc');
        $query = $this->applyFilters($query, $request);

        return response()->json($query->paginate($request->input('per_page', 15)));
    }

    #[OA\Get(
        path: "/api/admin/blood-donors/export",
        summary: "Exporter la liste des donneurs en Excel (applique les mêmes filtres que l'index)",
        security: [["sanctum" => []]],
        responses: [new OA\Response(response: 200, description: "Fichier Excel")]
    )]
    public function export(Request $request)
    {
        $query = BloodDonor::query();
        $query = $this->applyFilters($query, $request);

        return Excel::download(new BloodDonorsExport($query), 'donneurs_sang_' . date('Y_m_d') . '.xlsx');
    }

    #[OA\Post(
        path: "/api/admin/blood-donors/import",
        summary: "Importer des donneurs depuis un fichier Excel",
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    required: ["file", "center_id"],
                    properties: [
                        new OA\Property(property: "file", type: "string", format: "binary", description: "Fichier Excel/CSV"),
                        new OA\Property(property: "center_id", type: "integer", description: "Le centre d'attache pour ces donneurs")
                    ]
                )
            )
        ),
        responses: [new OA\Response(response: 200, description: "Import réussi")]
    )]
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240', // 10MB max
            'center_id' => 'required|exists:centers,id'
        ]);

        try {
            Excel::import(new BloodDonorsImport($request->center_id), $request->file('file'));
            return response()->json(['message' => 'Importation des donneurs réussie avec succès.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de l\'importation', 'error' => $e->getMessage()], 500);
        }
    }

    #[OA\Post(
        path: "/api/admin/blood-donors",
        summary: "Ajouter un nouveau donneur manuellement",
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["center_id", "first_name", "gender", "birth_date", "blood_type", "phone_contact"],
                properties: [
                    new OA\Property(property: "center_id", type: "integer"),
                    new OA\Property(property: "first_name", type: "string"),
                    new OA\Property(property: "last_name", type: "string", nullable: true),
                    new OA\Property(property: "gender", type: "string", enum: ["M", "F"]),
                    new OA\Property(property: "birth_date", type: "string", format: "date"),
                    new OA\Property(property: "blood_type", type: "string"),
                    new OA\Property(property: "phone_contact", type: "string"),
                    new OA\Property(property: "last_donation_date", type: "string", format: "date", nullable: true),
                    new OA\Property(property: "serology_status", type: "string", enum: ["PENDING", "CLEARED", "REJECTED"])
                ]
            )
        ),
        responses: [new OA\Response(response: 201, description: "Donneur ajouté")]
    )]
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'center_id' => 'required|exists:centers,id',
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'gender' => 'required|in:M,F',
            'birth_date' => 'required|date',
            'blood_type' => 'required|string|max:10',
            'phone_contact' => 'required|string|max:255',
            'last_donation_date' => 'nullable|date',
            'serology_status' => 'nullable|in:PENDING,CLEARED,REJECTED',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $donor = BloodDonor::create($validator->validated());
        return response()->json(['message' => 'Donneur ajouté avec succès', 'data' => $donor], 201);
    }

    #[OA\Get(
        path: "/api/admin/blood-donors/{id}",
        summary: "Détails d'un donneur",
        security: [["sanctum" => []]],
        parameters: [new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))],
        responses: [new OA\Response(response: 200, description: "Détails du donneur")]
    )]
    public function show($id)
    {
        // On charge le centre et l'historique des poches trié par date de prélèvement
        $donor = BloodDonor::with(['center', 'bloodBags' => function($query) {
            $query->orderBy('collection_date', 'desc');
        }])->findOrFail($id);

        return response()->json($donor);
    }

    #[OA\Put(
        path: "/api/admin/blood-donors/{id}",
        summary: "Mettre à jour un donneur",
        security: [["sanctum" => []]],
        parameters: [new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "first_name", type: "string"),
                    new OA\Property(property: "serology_status", type: "string", enum: ["PENDING", "CLEARED", "REJECTED"])
                ] // Simplifié pour la doc, mais accepte tous les champs
            )
        ),
        responses: [new OA\Response(response: 200, description: "Mis à jour")]
    )]
    public function update(Request $request, $id)
    {
        $donor = BloodDonor::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'center_id' => 'sometimes|required|exists:centers,id',
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'gender' => 'sometimes|required|in:M,F',
            'birth_date' => 'sometimes|required|date',
            'blood_type' => 'sometimes|required|string|max:10',
            'phone_contact' => 'sometimes|required|string|max:255',
            'last_donation_date' => 'nullable|date',
            'serology_status' => 'sometimes|required|in:PENDING,CLEARED,REJECTED',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $donor->update($validator->validated());
        return response()->json(['message' => 'Donneur mis à jour', 'data' => $donor]);
    }

    #[OA\Delete(
        path: "/api/admin/blood-donors/{id}",
        summary: "Supprimer un donneur",
        security: [["sanctum" => []]],
        parameters: [new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))],
        responses: [new OA\Response(response: 200, description: "Supprimé")]
    )]
    public function destroy($id)
    {
        BloodDonor::findOrFail($id)->delete();
        return response()->json(['message' => 'Donneur supprimé']);
    }
}