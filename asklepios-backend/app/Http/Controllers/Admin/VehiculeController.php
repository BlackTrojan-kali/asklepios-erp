<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Imports\VehiculeImport;
use App\Models\Pharmacy\Vehicule;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Exception;

#[OA\Tag(name: "Véhicules", description: "Gestion des véhicules du parc hospitalier")]
class VehiculeController extends Controller
{
    /**
     * Récupère le contexte (uniquement accessible aux admins pour la gestion du parc)
     */
    private function getContext()
    {
        $user = auth()->user();
        if ($user->profile_admin) {
            return [
                'role' => 'admin',
                'hospital_id' => $user->profile_admin->hospital_id
            ];
        }
        abort(403, "Profil non autorisé. Seul un administrateur peut gérer le parc automobile.");
    }

    private function applyFilters($query, Request $request)
    {
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function($q) use ($search) {
                $q->where('licence_plate', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $isActive = filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $isActive);
        }

        return $query->orderBy('created_at', 'desc');
    }

    #[OA\Get(path: "/api/admin/vehicules", summary: "Lister les véhicules", security: [["bearerAuth" => []]], tags: ["Véhicules"])]
    #[OA\Response(response: 200, description: "Liste paginée des véhicules")]
    public function index(Request $request)
    {
        $context = $this->getContext();
        $query = Vehicule::where('hospital_id', $context['hospital_id']);
        $query = $this->applyFilters($query, $request);
        
        $perPage = $request->query('per_page', 15);
        return response()->json($query->paginate($perPage), 200);
    }

    #[OA\Post(path: "/api/admin/vehicules", summary: "Ajouter un véhicule", security: [["bearerAuth" => []]], tags: ["Véhicules"])]
    #[OA\Response(response: 201, description: "Véhicule créé")]
    public function store(Request $request)
    {
        $context = $this->getContext();

        $request->validate([
            'licence_plate' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'is_active' => 'boolean'
        ]);

        // Vérifier si la plaque existe déjà pour cet hôpital
        if (Vehicule::where('hospital_id', $context['hospital_id'])->where('licence_plate', $request->licence_plate)->exists()) {
            return response()->json(['message' => 'Un véhicule avec cette plaque d\'immatriculation existe déjà dans votre parc.'], 422);
        }

        $vehicule = Vehicule::create([
            'hospital_id' => $context['hospital_id'],
            'licence_plate' => $request->licence_plate,
            'model' => $request->model,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json(['message' => 'Véhicule ajouté avec succès.', 'data' => $vehicule], 201);
    }

    #[OA\Get(path: "/api/admin/vehicules/{id}", summary: "Détails d'un véhicule", security: [["bearerAuth" => []]], tags: ["Véhicules"])]
    #[OA\Response(response: 200, description: "Détails du véhicule")]
    public function show($id)
    {
        $context = $this->getContext();
        $vehicule = Vehicule::where('hospital_id', $context['hospital_id'])->findOrFail($id);

        return response()->json($vehicule, 200);
    }

    #[OA\Put(path: "/api/admin/vehicules/{id}", summary: "Modifier un véhicule", security: [["bearerAuth" => []]], tags: ["Véhicules"])]
    #[OA\Response(response: 200, description: "Véhicule mis à jour")]
    public function update(Request $request, $id)
    {
        $context = $this->getContext();
        $vehicule = Vehicule::where('hospital_id', $context['hospital_id'])->findOrFail($id);

        $request->validate([
            'licence_plate' => 'string|max:255',
            'model' => 'string|max:255',
            'is_active' => 'boolean'
        ]);

        // Vérifier les doublons de plaques si elle est modifiée
        if ($request->has('licence_plate') && $request->licence_plate !== $vehicule->licence_plate) {
            if (Vehicule::where('hospital_id', $context['hospital_id'])->where('licence_plate', $request->licence_plate)->exists()) {
                return response()->json(['message' => 'Cette plaque est déjà assignée à un autre véhicule.'], 422);
            }
        }

        $vehicule->update($request->only(['licence_plate', 'model', 'is_active']));

        return response()->json(['message' => 'Véhicule mis à jour avec succès.', 'data' => $vehicule], 200);
    }

    #[OA\Delete(path: "/api/admin/vehicules/{id}", summary: "Supprimer un véhicule", security: [["bearerAuth" => []]], tags: ["Véhicules"])]
    #[OA\Response(response: 200, description: "Véhicule supprimé")]
    public function destroy($id)
    {
        $context = $this->getContext();
        $vehicule = Vehicule::where('hospital_id', $context['hospital_id'])->findOrFail($id);
        
        $vehicule->delete();

        return response()->json(['message' => 'Véhicule supprimé du parc.'], 200);
    }

    // ==========================================
    // EXPORTS ET IMPORTS EXCEL
    // ==========================================

    #[OA\Get(path: "/api/admin/vehicules/export/excel", summary: "Exporter les véhicules en Excel", security: [["bearerAuth" => []]], tags: ["Véhicules"])]
    #[OA\Response(response: 200, description: "Fichier Excel généré")]
    public function exportExcel(Request $request)
    {
        $context = $this->getContext();
        $query = Vehicule::where('hospital_id', $context['hospital_id']);
        $vehicules = $this->applyFilters($query, $request)->get();

        $exportData = $vehicules->map(function ($v) {
            return [
                'Plaque Immatriculation' => $v->licence_plate,
                'Modèle' => $v->model,
                'Statut' => $v->is_active ? 'Actif' : 'Inactif',
                'Date Ajout' => $v->created_at->format('d/m/Y H:i')
            ];
        });

        return Excel::download(new class($exportData) implements FromCollection, WithHeadings {
            protected $data;
            public function __construct($data) { $this->data = collect($data); }
            public function collection() { return $this->data; }
            public function headings(): array { 
                return ['Plaque Immatriculation', 'Modèle', 'Statut', 'Date Ajout']; 
            }
        }, "parc_vehicules_" . date('Ymd_His') . ".xlsx");
    }

    #[OA\Post(path: "/api/admin/vehicules/import", summary: "Importer une liste de véhicules (Excel)", security: [["bearerAuth" => []]], tags: ["Véhicules"])]
    #[OA\Response(response: 200, description: "Véhicules importés")]
    public function importExcel(Request $request)
    {
        $context = $this->getContext();

        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:5120', // Max 5MB
        ]);

        try {
            Excel::import(new VehiculeImport($context['hospital_id']), $request->file('file'));
            return response()->json(['message' => 'Importation des véhicules réussie.'], 200);
        } catch (Exception $e) {
            return response()->json(['message' => 'Erreur lors de l\'importation : ' . $e->getMessage()], 500);
        }
    }
}