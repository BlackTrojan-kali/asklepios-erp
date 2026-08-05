<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\Hospital\BloodBag;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Illuminate\Support\Facades\Validator;
use Barryvdh\DomPDF\Facade\Pdf;

#[OA\Tag(name: "Blood Bank - Blood Bags", description: "Gestion des poches de sang (Stock, Traçabilité, Export PDF)")]
class BloodBagController extends Controller
{
    /**
     * Applique les filtres réutilisables (Index & PDF)
     */
    private function applyFilters($query, Request $request)
    {
        // Recherche par code-barre ou fournisseur externe
        $query->when($request->filled('search'), function ($q) use ($request) {
            $q->where(function ($sub) use ($request) {
                $sub->where('barcode', 'like', '%' . $request->search . '%')
                    ->orWhere('external_supplier', 'like', '%' . $request->search . '%');
            });
        });

        $query->when($request->filled('center_id'), function ($q) use ($request) {
            $q->where('center_id', $request->center_id);
        });

        $query->when($request->filled('blood_refrigerator_id'), function ($q) use ($request) {
            $q->where('blood_refrigerator_id', $request->blood_refrigerator_id);
        });

        $query->when($request->filled('blood_type'), function ($q) use ($request) {
            $q->where('blood_type', $request->blood_type);
        });

        $query->when($request->filled('type'), function ($q) use ($request) {
            $q->where('type', $request->type);
        });

        $query->when($request->filled('status'), function ($q) use ($request) {
            $q->where('status', $request->status);
        });

        // RESOLVER DE SCOPE ADMIN : Restreindre par Hôpital via le Centre
        $query->when($request->filled('hospital_id'), function ($q) use ($request) {
            $q->whereHas('center', function ($subQuery) use ($request) {
                $subQuery->where('hospital_id', $request->hospital_id);
            });
        });

        return $query;
    }

    #[OA\Get(
        path: "/api/admin/blood-bags",
        summary: "Lister le stock de poches de sang",
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "center_id", in: "query", schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "hospital_id", in: "query", schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "blood_refrigerator_id", in: "query", schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "blood_type", in: "query", schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "type", in: "query", schema: new OA\Schema(type: "string", enum: ["WHOLE_BLOOD", "RED_CELLS", "PLASMA"])),
            new OA\Parameter(name: "status", in: "query", schema: new OA\Schema(type: "string", enum: ["QUARANTINE", "AVAILABLE", "USED", "EXPIRED"])),
            new OA\Parameter(name: "search", in: "query", schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "per_page", in: "query", schema: new OA\Schema(type: "integer"))
        ],
        responses: [new OA\Response(response: 200, description: "Liste paginée")]
    )]
    public function index(Request $request)
    {
        $query = BloodBag::with(['center', 'bloodRefrigerator', 'bloodDonor'])->orderBy('expiry_date', 'asc');
        $query = $this->applyFilters($query, $request);

        return response()->json($query->paginate($request->input('per_page', 15)));
    }

    #[OA\Get(
        path: "/api/admin/blood-bags/export-pdf",
        summary: "Générer un rapport PDF du stock de sang (Filtres appliqués)",
        security: [["sanctum" => []]],
        responses: [new OA\Response(response: 200, description: "Fichier PDF binaire")]
    )]
    public function exportPdf(Request $request)
    {
        $query = BloodBag::with(['center', 'bloodRefrigerator', 'bloodDonor'])->orderBy('expiry_date', 'asc');
        $query = $this->applyFilters($query, $request);
        
        $bloodBags = $query->get();

        $pdf = Pdf::loadView('pdf.blood_bags_report', compact('bloodBags'))
                  ->setPaper('a4', 'landscape');

        return $pdf->download('rapport_stock_sang_' . date('Y_m_d') . '.pdf');
    }

    #[OA\Post(
        path: "/api/admin/blood-bags",
        summary: "Ajouter une nouvelle poche de sang",
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["center_id", "blood_refrigerator_id", "blood_type", "volume_ml", "collection_date", "expiry_date", "type", "status"],
                properties: [
                    new OA\Property(property: "center_id", type: "integer"),
                    new OA\Property(property: "blood_refrigerator_id", type: "integer"),
                    new OA\Property(property: "blood_donor_id", type: "integer", nullable: true),
                    new OA\Property(property: "blood_type", type: "string"),
                    new OA\Property(property: "volume_ml", type: "integer"),
                    new OA\Property(property: "collection_date", type: "string", format: "date"),
                    new OA\Property(property: "expiry_date", type: "string", format: "date"),
                    new OA\Property(property: "external_supplier", type: "string", nullable: true),
                    new OA\Property(property: "type", type: "string", enum: ["WHOLE_BLOOD", "RED_CELLS", "PLASMA"]),
                    new OA\Property(property: "barcode", type: "string", nullable: true),
                    new OA\Property(property: "status", type: "string", enum: ["QUARANTINE", "AVAILABLE", "USED", "EXPIRED"])
                ]
            )
        ),
        responses: [new OA\Response(response: 201, description: "Poche ajoutée")]
    )]
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'center_id' => 'required|exists:centers,id',
            'blood_refrigerator_id' => 'required|exists:blood_refrigerators,id',
            'blood_donor_id' => 'nullable|exists:blood_donors,id',
            'blood_type' => 'required|string|max:10',
            'volume_ml' => 'required|integer|min:1',
            'collection_date' => 'required|date',
            'expiry_date' => 'required|date|after:collection_date',
            'external_supplier' => 'nullable|string|max:255',
            'type' => 'required|in:WHOLE_BLOOD,RED_CELLS,PLASMA',
            'barcode' => 'nullable|string|max:255|unique:blood_bags,barcode',
            'status' => 'required|in:QUARANTINE,AVAILABLE,USED,EXPIRED',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $bloodBag = BloodBag::create($validator->validated());
        return response()->json(['message' => 'Poche de sang ajoutée avec succès', 'data' => $bloodBag->load(['bloodRefrigerator', 'bloodDonor'])], 201);
    }

    #[OA\Get(
        path: "/api/admin/blood-bags/{id}",
        summary: "Détails d'une poche de sang",
        security: [["sanctum" => []]],
        parameters: [new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))],
        responses: [new OA\Response(response: 200, description: "Détails de la poche")]
    )]
    public function show($id)
    {
        return response()->json(BloodBag::with(['center', 'bloodRefrigerator', 'bloodDonor'])->findOrFail($id));
    }

    #[OA\Put(
        path: "/api/admin/blood-bags/{id}",
        summary: "Mettre à jour une poche de sang (ex: Changer son statut)",
        security: [["sanctum" => []]],
        parameters: [new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "status", type: "string", enum: ["QUARANTINE", "AVAILABLE", "USED", "EXPIRED"]),
                    new OA\Property(property: "blood_refrigerator_id", type: "integer")
                ]
            )
        ),
        responses: [new OA\Response(response: 200, description: "Mis à jour")]
    )]
    public function update(Request $request, $id)
    {
        $bloodBag = BloodBag::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'center_id' => 'sometimes|required|exists:centers,id',
            'blood_refrigerator_id' => 'sometimes|required|exists:blood_refrigerators,id',
            'blood_donor_id' => 'nullable|exists:blood_donors,id',
            'blood_type' => 'sometimes|required|string|max:10',
            'volume_ml' => 'sometimes|required|integer|min:1',
            'collection_date' => 'sometimes|required|date',
            'expiry_date' => 'sometimes|required|date',
            'external_supplier' => 'nullable|string|max:255',
            'type' => 'sometimes|required|in:WHOLE_BLOOD,RED_CELLS,PLASMA',
            'barcode' => 'nullable|string|max:255|unique:blood_bags,barcode,' . $id,
            'status' => 'sometimes|required|in:QUARANTINE,AVAILABLE,USED,EXPIRED',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $bloodBag->update($validator->validated());
        return response()->json(['message' => 'Poche de sang mise à jour', 'data' => $bloodBag->load(['bloodRefrigerator', 'bloodDonor'])]);
    }

    #[OA\Delete(
        path: "/api/admin/blood-bags/{id}",
        summary: "Supprimer une poche de sang",
        security: [["sanctum" => []]],
        parameters: [new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))],
        responses: [new OA\Response(response: 200, description: "Supprimé")]
    )]
    public function destroy($id)
    {
        BloodBag::findOrFail($id)->delete();
        return response()->json(['message' => 'Poche de sang supprimée']);
    }
}