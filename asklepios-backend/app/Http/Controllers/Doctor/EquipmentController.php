<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Hospital\Equipment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA; // Import de l'alias des attributs Swagger

#[OA\Tag(name: "Équipements", description: "API de gestion du matériel médical et des alertes de maintenance pour les départements.")]
class EquipmentController extends Controller
{
    #[OA\Get(
        path: "/api/departments/{departmentId}/equipment",
        summary: "Lister les équipements d'un département",
        description: "Récupère la liste des équipements. Supporte la pagination, la recherche et le filtrage par statut.",
        security: [["sanctum" => []]],
        tags: ["Équipements"]
    )]
    #[OA\Parameter(name: "departmentId", in: "path", required: true, description: "ID du département", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Recherche par nom, modèle ou numéro de série", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "status", in: "query", required: false, description: "Filtrer par statut exact (ACTIVE, IN_MAINTENANCE...)", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "paginated", in: "query", required: false, description: "Mettre à 'false' pour tout récupérer sans pagination", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "page", in: "query", required: false, description: "Numéro de la page", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "per_page", in: "query", required: false, description: "Nombre d'éléments par page", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Opération réussie")]
    #[OA\Response(response: 404, description: "Département introuvable")]
    public function index(Request $request, $departmentId)
    {
        if (!$departmentId) return response()->json(['message' => 'Département requis'], 400);
        
        $query = Equipment::where('department_id', $departmentId)->with('facilityRoom');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('serial_number', 'like', "%{$search}%")
                  ->orWhere('model_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->query('paginated') === 'false') {
            return response()->json($query->orderBy('name')->get());
        }

        $perPage = $request->query('per_page', 15);
        return response()->json($query->latest()->paginate($perPage));
    }

    #[OA\Post(
        path: "/api/departments/{departmentId}/equipment",
        summary: "Ajouter un nouvel équipement",
        description: "Crée un nouvel équipement et l'associe au département spécifié.",
        security: [["sanctum" => []]],
        tags: ["Équipements"]
    )]
    #[OA\Parameter(name: "departmentId", in: "path", required: true, description: "ID du département", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["name", "status"],
            properties: [
                new OA\Property(property: "facility_room_id", type: "integer", example: 1, description: "ID de la salle"),
                new OA\Property(property: "name", type: "string", example: "Échographe Portable"),
                new OA\Property(property: "manufacturer", type: "string", example: "Philips"),
                new OA\Property(property: "model_number", type: "string", example: "CX50"),
                new OA\Property(property: "serial_number", type: "string", example: "PH-987654"),
                new OA\Property(property: "status", type: "string", example: "ACTIVE", description: "ACTIVE, IN_USE, IN_MAINTENANCE, OUT_OF_SERVICE, RETIRED"),
                new OA\Property(property: "last_maintenance_date", type: "string", format: "date", example: "2026-01-15"),
                new OA\Property(property: "next_maintenance_date", type: "string", format: "date", example: "2026-07-15"),
                new OA\Property(property: "purchase_date", type: "string", format: "date", example: "2025-05-10"),
                new OA\Property(property: "warranty_expiry_date", type: "string", format: "date", example: "2027-05-10"),
                new OA\Property(property: "notes", type: "string", example: "Capteur linéaire inclus")
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Équipement créé avec succès")]
    #[OA\Response(response: 422, description: "Erreur de validation des données")]
    public function store(Request $request, $departmentId)
    {
        $department = Department::findOrFail($departmentId);

        $validated = $request->validate([
            'facility_room_id'      => 'nullable|exists:facility_rooms,id',
            'name'                  => 'required|string|max:255',
            'manufacturer'          => 'nullable|string|max:255',
            'model_number'          => 'nullable|string|max:255',
            'serial_number'         => 'nullable|string|max:255|unique:equipments,serial_number',
            'status'                => ['required', Rule::in(['ACTIVE', 'IN_USE', 'IN_MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED'])],
            'last_maintenance_date' => 'nullable|date',
            'next_maintenance_date' => 'nullable|date|after_or_equal:last_maintenance_date',
            'purchase_date'         => 'nullable|date',
            'warranty_expiry_date'  => 'nullable|date|after_or_equal:purchase_date',
            'notes'                 => 'nullable|string',
        ]);

        $validated['department_id'] = $department->id;
        $equipment = Equipment::create($validated);

        return response()->json([
            'message' => 'Équipement ajouté avec succès.',
            'data' => $equipment->load('facilityRoom')
        ], 201);
    }

    #[OA\Get(
        path: "/api/departments/{departmentId}/equipment/{equipmentId}",
        summary: "Détails d'un équipement",
        description: "Affiche les détails complets d'une machine.",
        security: [["sanctum" => []]],
        tags: ["Équipements"]
    )]
    #[OA\Parameter(name: "departmentId", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "equipmentId", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Détails récupérés avec succès")]
    #[OA\Response(response: 404, description: "Équipement non trouvé")]
    public function show($departmentId, $equipmentId)
    {
        $equipment = Equipment::where('department_id', $departmentId)
            ->with(['facilityRoom', 'department'])
            ->findOrFail($equipmentId);

        return response()->json($equipment);
    }

    #[OA\Put(
        path: "/api/departments/{departmentId}/equipment/{equipmentId}",
        summary: "Mettre à jour un équipement",
        description: "Met à jour les informations d'un équipement existant.",
        security: [["sanctum" => []]],
        tags: ["Équipements"]
    )]
    #[OA\Parameter(name: "departmentId", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "equipmentId", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["name", "status"],
            properties: [
                new OA\Property(property: "facility_room_id", type: "integer", example: 1),
                new OA\Property(property: "name", type: "string", example: "Échographe Portable V2"),
                new OA\Property(property: "status", type: "string", example: "IN_MAINTENANCE"),
                new OA\Property(property: "serial_number", type: "string", example: "PH-987654"),
                new OA\Property(property: "next_maintenance_date", type: "string", format: "date", example: "2026-08-01")
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Équipement mis à jour")]
    #[OA\Response(response: 422, description: "Données invalides")]
    public function update(Request $request, $departmentId, $equipmentId)
    {
        $equipment = Equipment::where('department_id', $departmentId)->findOrFail($equipmentId);

        $validated = $request->validate([
            'facility_room_id'      => 'nullable|exists:facility_rooms,id',
            'name'                  => 'required|string|max:255',
            'manufacturer'          => 'nullable|string|max:255',
            'model_number'          => 'nullable|string|max:255',
            'serial_number'         => ['nullable', 'string', 'max:255', Rule::unique('equipments')->ignore($equipment->id)],
            'status'                => ['required', Rule::in(['ACTIVE', 'IN_USE', 'IN_MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED'])],
            'last_maintenance_date' => 'nullable|date',
            'next_maintenance_date' => 'nullable|date',
            'purchase_date'         => 'nullable|date',
            'warranty_expiry_date'  => 'nullable|date',
            'notes'                 => 'nullable|string',
        ]);

        $equipment->update($validated);

        return response()->json([
            'message' => 'Équipement mis à jour avec succès.',
            'data' => $equipment->fresh('facilityRoom')
        ]);
    }

    #[OA\Delete(
        path: "/api/departments/{departmentId}/equipment/{equipmentId}",
        summary: "Archiver un équipement",
        description: "Supprime l'équipement (Soft Delete) de la vue principale sans effacer son historique.",
        security: [["sanctum" => []]],
        tags: ["Équipements"]
    )]
    #[OA\Parameter(name: "departmentId", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "equipmentId", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Équipement archivé")]
    #[OA\Response(response: 404, description: "Équipement non trouvé")]
    public function destroy($departmentId, $equipmentId)
    {
        $equipment = Equipment::where('department_id', $departmentId)->findOrFail($equipmentId);
        $equipment->delete();

        return response()->json([
            'message' => 'Équipement archivé avec succès.'
        ]);
    }

    #[OA\Get(
        path: "/api/departments/{departmentId}/equipment/maintenance-alerts",
        summary: "Alertes de maintenance",
        description: "Récupère tous les équipements dont la maintenance est prévue dans les 30 prochains jours ou dépassée.",
        security: [["sanctum" => []]],
        tags: ["Équipements"]
    )]
    #[OA\Parameter(name: "departmentId", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste des alertes récupérée avec succès")]
    public function maintenanceAlerts($departmentId)
    {
        $department = Department::findOrFail($departmentId);

        $alerts = Equipment::where('department_id', $department->id)
            ->needsMaintenance()
            ->with('facilityRoom')
            ->orderBy('next_maintenance_date', 'asc')
            ->get();

        return response()->json($alerts);
    }
}