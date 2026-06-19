<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Imports\DriverImport;
use App\Models\Pharmacy\Driver;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Exception;

#[OA\Tag(name: "Chauffeurs", description: "Gestion des chauffeurs d'ambulances et véhicules")]
class DriverController extends Controller
{
    /**
     * Récupère le contexte (uniquement accessible aux admins)
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
        abort(403, "Profil non autorisé. Seul un administrateur peut gérer les chauffeurs.");
    }

    private function applyFilters($query, Request $request)
    {
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function($q) use ($search) {
                $q->where('fullname', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $isActive = filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $isActive);
        }

        return $query->orderBy('created_at', 'desc');
    }

    #[OA\Get(path: "/api/admin/drivers", summary: "Lister les chauffeurs", security: [["bearerAuth" => []]], tags: ["Chauffeurs"])]
    #[OA\Response(response: 200, description: "Liste paginée des chauffeurs")]
    public function index(Request $request)
    {
        $context = $this->getContext();
        $query = Driver::where('hospital_id', $context['hospital_id']);
        $query = $this->applyFilters($query, $request);
        
        $perPage = $request->query('per_page', 15);
        return response()->json($query->paginate($perPage), 200);
    }

    #[OA\Post(path: "/api/admin/drivers", summary: "Ajouter un chauffeur", security: [["bearerAuth" => []]], tags: ["Chauffeurs"])]
    #[OA\Response(response: 201, description: "Chauffeur créé")]
    public function store(Request $request)
    {
        $context = $this->getContext();

        $request->validate([
            'fullname' => 'required|string|max:255',
            'phone' => 'nullable|numeric',
            'is_active' => 'boolean'
        ]);

        $driver = Driver::create([
            'hospital_id' => $context['hospital_id'],
            'fullname' => $request->fullname,
            'phone' => $request->phone,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json(['message' => 'Chauffeur ajouté avec succès.', 'data' => $driver], 201);
    }

    #[OA\Get(path: "/api/admin/drivers/{id}", summary: "Détails d'un chauffeur", security: [["bearerAuth" => []]], tags: ["Chauffeurs"])]
    #[OA\Response(response: 200, description: "Détails du chauffeur")]
    public function show($id)
    {
        $context = $this->getContext();
        $driver = Driver::where('hospital_id', $context['hospital_id'])->findOrFail($id);

        return response()->json($driver, 200);
    }

    #[OA\Put(path: "/api/admin/drivers/{id}", summary: "Modifier un chauffeur", security: [["bearerAuth" => []]], tags: ["Chauffeurs"])]
    #[OA\Response(response: 200, description: "Chauffeur mis à jour")]
    public function update(Request $request, $id)
    {
        $context = $this->getContext();
        $driver = Driver::where('hospital_id', $context['hospital_id'])->findOrFail($id);

        $request->validate([
            'fullname' => 'string|max:255',
            'phone' => 'nullable|numeric',
            'is_active' => 'boolean'
        ]);

        $driver->update($request->only(['fullname', 'phone', 'is_active']));

        return response()->json(['message' => 'Informations du chauffeur mises à jour.', 'data' => $driver], 200);
    }

    #[OA\Delete(path: "/api/admin/drivers/{id}", summary: "Supprimer un chauffeur", security: [["bearerAuth" => []]], tags: ["Chauffeurs"])]
    #[OA\Response(response: 200, description: "Chauffeur supprimé")]
    public function destroy($id)
    {
        $context = $this->getContext();
        $driver = Driver::where('hospital_id', $context['hospital_id'])->findOrFail($id);
        
        $driver->delete();

        return response()->json(['message' => 'Chauffeur supprimé avec succès.'], 200);
    }

    // ==========================================
    // EXPORTS ET IMPORTS EXCEL
    // ==========================================

    #[OA\Get(path: "/api/admin/drivers/export/excel", summary: "Exporter les chauffeurs en Excel", security: [["bearerAuth" => []]], tags: ["Chauffeurs"])]
    #[OA\Response(response: 200, description: "Fichier Excel généré")]
    public function exportExcel(Request $request)
    {
        $context = $this->getContext();
        $query = Driver::where('hospital_id', $context['hospital_id']);
        $drivers = $this->applyFilters($query, $request)->get();

        $exportData = $drivers->map(function ($d) {
            return [
                'Nom Complet' => $d->fullname,
                'Téléphone' => $d->phone ?? 'N/A',
                'Statut' => $d->is_active ? 'Actif' : 'Inactif',
                'Date Ajout' => $d->created_at->format('d/m/Y H:i')
            ];
        });

        return Excel::download(new class($exportData) implements FromCollection, WithHeadings {
            protected $data;
            public function __construct($data) { $this->data = collect($data); }
            public function collection() { return $this->data; }
            public function headings(): array { 
                return ['Nom Complet', 'Téléphone', 'Statut', 'Date Ajout']; 
            }
        }, "liste_chauffeurs_" . date('Ymd_His') . ".xlsx");
    }

    #[OA\Post(path: "/api/admin/drivers/import", summary: "Importer une liste de chauffeurs (Excel)", security: [["bearerAuth" => []]], tags: ["Chauffeurs"])]
    #[OA\Response(response: 200, description: "Chauffeurs importés")]
    public function importExcel(Request $request)
    {
        $context = $this->getContext();

        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:5120',
        ]);

        try {
            Excel::import(new DriverImport($context['hospital_id']), $request->file('file'));
            return response()->json(['message' => 'Importation des chauffeurs réussie.'], 200);
        } catch (Exception $e) {
            return response()->json(['message' => 'Erreur lors de l\'importation : ' . $e->getMessage()], 500);
        }
    }
}