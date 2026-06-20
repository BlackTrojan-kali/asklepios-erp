<?php

namespace App\Http\Controllers\Pharmacien;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy\Inventory;
use App\Models\Pharmacy\InventoryLine;
use App\Models\Pharmacy\Stock;
use App\Http\Services\StockMovementService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;
use Exception;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Excel;

#[OA\Tag(name: "Inventaires", description: "Gestion des inventaires de la pharmacie")]
class InventoryController extends Controller
{
    protected StockMovementService $movementService;

    public function __construct(StockMovementService $movementService)
    {
        $this->movementService = $movementService;
    }

    private function getContext()
    {
        $user = auth()->user();
        if ($user->profile_admin) {
            return [
                'role' => 'admin',
                'hospital_id' => $user->profile_admin->hospital_id,
                'branch_id' => null,
                'user_id' => $user->id
            ];
        } elseif ($user->profile_pharm) {
            return [
                'role' => 'pharmacy',
                'hospital_id' => $user->profile_pharm->branch->hospital_id ?? null,
                'branch_id' => $user->profile_pharm->branch_id,
                'user_id' => $user->id
            ];
        }
        abort(403, "Profil non autorisé.");
    }

    private function getScopedQuery()
    {
        $context = $this->getContext();
        $query = Inventory::with(['user', 'pharmacyBranch']);

        if ($context['role'] === 'admin') {
            $query->whereHas('pharmacyBranch', function ($q) use ($context) {
                $q->where('hospital_id', $context['hospital_id']);
            });
        } else {
            $query->where('pharmacy_branch_id', $context['branch_id']);
        }

        return $query;
    }

    private function applyFilters($query, Request $request)
    {
        $context = $this->getContext();

        if ($context['role'] === 'admin' && $request->filled('branch_id')) {
            $query->where('pharmacy_branch_id', $request->query('branch_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('execution_date', [$request->query('start_date'), $request->query('end_date')]);
        }

        return $query->orderBy('created_at', 'desc');
    }

    #[OA\Get(path: "/api/pharmacy/inventories", summary: "Lister les inventaires", security: [["bearerAuth" => []]], tags: ["Inventaires"])]
    #[OA\Response(response: 200, description: "Liste des inventaires")]
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 15);
        $query = $this->applyFilters($this->getScopedQuery(), $request);
        
        return response()->json($query->paginate($perPage), 200);
    }

    #[OA\Get(path: "/api/pharmacy/inventories/{id}", summary: "Détails d'un inventaire", security: [["bearerAuth" => []]], tags: ["Inventaires"])]
    #[OA\Response(response: 200, description: "Détails avec les lignes")]
    public function show($id)
    {
        $inventory = $this->getScopedQuery()
                          ->with(['lines.batch.article', 'lines.storageLocation',"user"])
                          ->findOrFail($id);

        return response()->json($inventory, 200);
    }

    #[OA\Post(path: "/api/pharmacy/inventories", summary: "Créer un brouillon d'inventaire", security: [["bearerAuth" => []]], tags: ["Inventaires"])]
    #[OA\Response(response: 201, description: "Inventaire créé")]
    public function store(Request $request)
    {
        $context = $this->getContext();
        
        // Seul le pharmacien/magasinier peut initier un inventaire dans sa succursale
        if ($context['role'] !== 'pharmacy') {
            return response()->json(['message' => 'Seul un magasinier peut initier un inventaire.'], 403);
        }

        $request->validate([
            'execution_date' => 'required|date',
            'comment' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.batch_id' => 'required|exists:batches,id',
            'lines.*.storage_location_id' => 'nullable|exists:storage_locations,id',
            'lines.*.physical_qty' => 'required|numeric|min:0',
        ]);

        $branchId = $context['branch_id'];

        DB::beginTransaction();
        try {
            $inventory = Inventory::create([
                'pharmacy_branch_id' => $branchId,
                'user_id' => $context['user_id'],
                'status' => 'PENDING',
                'execution_date' => $request->execution_date,
                'comment' => $request->comment,
            ]);

            foreach ($request->lines as $line) {
                // On récupère la quantité système actuelle (0 si le produit n'est pas encore en stock)
                $stock = Stock::where('pharmacy_branch_id', $branchId)
                              ->where('batch_id', $line['batch_id'])
                              ->first();
                              
                $systemQty = $stock ? $stock->qty : 0;
                $discrepancy = $line['physical_qty'] - $systemQty;

                InventoryLine::create([
                    'inventory_id' => $inventory->id,
                    'pharmacy_branch_id' => $branchId,
                    'batch_id' => $line['batch_id'],
                    'storage_location_id' => $line['storage_location_id'] ?? null,
                    'system_qty' => $systemQty,
                    'physical_qty' => $line['physical_qty'],
                    'descrepency' => $discrepancy, // Utilise ton orthographe de la migration
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Inventaire enregistré en brouillon.', 'data' => $inventory], 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }

    #[OA\Put(path: "/api/pharmacy/inventories/{id}", summary: "Modifier un brouillon d'inventaire", security: [["bearerAuth" => []]], tags: ["Inventaires"])]
    #[OA\Response(response: 200, description: "Inventaire mis à jour")]
    public function update(Request $request, $id)
    {
        $context = $this->getContext();
        if ($context['role'] !== 'pharmacy') return response()->json(['message' => 'Non autorisé.'], 403);

        $inventory = $this->getScopedQuery()->findOrFail($id);

        if ($inventory->status !== 'PENDING') {
            return response()->json(['message' => 'Impossible de modifier un inventaire déjà validé.'], 400);
        }

        DB::beginTransaction();
        try {
            // Mise à jour de l'en-tête
            $inventory->update([
                'execution_date' => $request->execution_date ?? $inventory->execution_date,
                'comment' => $request->comment ?? $inventory->comment,
            ]);

            // Si de nouvelles lignes sont fournies, on remplace tout
            if ($request->has('lines')) {
                $inventory->lines()->delete();

                foreach ($request->lines as $line) {
                    $stock = Stock::where('pharmacy_branch_id', $context['branch_id'])
                                  ->where('batch_id', $line['batch_id'])
                                  ->first();
                                  
                    $systemQty = $stock ? $stock->qty : 0;
                    $discrepancy = $line['physical_qty'] - $systemQty;

                    InventoryLine::create([
                        'inventory_id' => $inventory->id,
                        'pharmacy_branch_id' => $context['branch_id'],
                        'batch_id' => $line['batch_id'],
                        'storage_location_id' => $line['storage_location_id'] ?? null,
                        'system_qty' => $systemQty,
                        'physical_qty' => $line['physical_qty'],
                        'descrepency' => $discrepancy,
                    ]);
                }
            }

            DB::commit();
            return response()->json(['message' => 'Inventaire mis à jour avec succès.'], 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }

    #[OA\Delete(path: "/api/pharmacy/inventories/{id}", summary: "Supprimer un inventaire", security: [["bearerAuth" => []]], tags: ["Inventaires"])]
    #[OA\Response(response: 200, description: "Inventaire supprimé")]
    public function destroy($id)
    {
        $context = $this->getContext();
        if ($context['role'] !== 'pharmacy') return response()->json(['message' => 'Non autorisé.'], 403);

        $inventory = $this->getScopedQuery()->findOrFail($id);

        if ($inventory->status !== 'PENDING') {
            return response()->json(['message' => 'Vous ne pouvez supprimer qu\'un inventaire en attente.'], 400);
        }

        $inventory->delete();
        return response()->json(['message' => 'Brouillon d\'inventaire supprimé.'], 200);
    }

    #[OA\Post(path: "/api/pharmacy/inventories/{id}/validate", summary: "Valider l'inventaire et ajuster les stocks", security: [["bearerAuth" => []]], tags: ["Inventaires"])]
    #[OA\Response(response: 200, description: "Inventaire validé")]
    public function validateInventory($id)
    {
        $context = $this->getContext();
        if ($context['role'] !== 'pharmacy') {
            return response()->json(['message' => 'Seul le magasinier peut valider l\'inventaire.'], 403);
        }

        $inventory = $this->getScopedQuery()->with('lines')->findOrFail($id);

        if ($inventory->status !== 'PENDING') {
            return response()->json(['message' => 'Cet inventaire est déjà validé.'], 400);
        }

        DB::beginTransaction();
        try {
            foreach ($inventory->lines as $line) {
                // On recalcule l'écart exact au moment de la validation, au cas où des ventes auraient eu lieu entre-temps
                $stock = Stock::where('pharmacy_branch_id', $context['branch_id'])
                              ->where('batch_id', $line->batch_id)
                              ->first();
                              
                $currentSystemQty = $stock ? $stock->qty : 0;
                $realDiscrepancy = $line->physical_qty - $currentSystemQty;

                // Mise à jour de la ligne avec les vraies données au moment T de la validation
                $line->update([
                    'system_qty' => $currentSystemQty,
                    'descrepency' => $realDiscrepancy
                ]);

                // Si la quantité physique est supérieure, on fait une ENTRÉE de régularisation
                if ($realDiscrepancy > 0) {
                    $this->movementService->recordMovement(
                        'ENTRY', 
                        'INVENTORY', 
                        $inventory->id, 
                        $line->batch_id, 
                        $realDiscrepancy, 
                        $line->storage_location_id, 
                        "Régularisation d'inventaire (Excédent)"
                    );
                } 
                // Si la quantité physique est inférieure, on fait une SORTIE de régularisation
                elseif ($realDiscrepancy < 0) {
                    $this->movementService->recordMovement(
                        'EXIT', 
                        'INVENTORY', 
                        $inventory->id, 
                        $line->batch_id, 
                        abs($realDiscrepancy), 
                        $line->storage_location_id, 
                        "Régularisation d'inventaire (Manquant)"
                    );
                }
            }

            $inventory->update(['status' => 'VALIDATED']);

            DB::commit();
            return response()->json(['message' => 'Inventaire validé. Les stocks ont été ajustés avec succès.'], 200);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la validation : ' . $e->getMessage()], 400);
        }
    }
    // ==========================================
    // EXPORTS (PDF & EXCEL) DÉTAILLÉS
    // ==========================================

    #[OA\Get(path: "/api/pharmacy/inventories/export/pdf", summary: "Exporter les inventaires détaillés en PDF", security: [["bearerAuth" => []]], tags: ["Inventaires"])]
    #[OA\Response(response: 200, description: "Fichier PDF généré")]
    public function exportPdf(Request $request)
    {
        $query = $this->applyFilters($this->getScopedQuery(), $request);
        
        // On charge explicitement les lignes et les relations pour le rapport
        $inventories = $query->with(['lines.batch.article', 'lines.storageLocation'])->get();
        
        $pdf = Pdf::loadView('exports.pdf.inventories', compact('inventories'))
                  ->setPaper('a4', 'landscape');

        return $pdf->download("details_inventaires_" . date('Ymd_His') . ".pdf");
    }

    #[OA\Get(path: "/api/pharmacy/inventories/export/excel", summary: "Exporter les inventaires détaillés en Excel", security: [["bearerAuth" => []]], tags: ["Inventaires"])]
    #[OA\Response(response: 200, description: "Fichier Excel généré")]
    public function exportExcel(Request $request)
    {
        $query = $this->applyFilters($this->getScopedQuery(), $request);
        $inventories = $query->with(['lines.batch.article', 'lines.storageLocation'])->get();
        
        $exportData = [];

        // On "aplatit" les données : 1 ligne de tableau = 1 article compté
        foreach ($inventories as $inv) {
            foreach ($inv->lines as $line) {
                $exportData[] = [
                    'N° Inventaire' => $inv->id,
                    'Date' => $inv->execution_date->format('d/m/Y'),
                    'Succursale' => $inv->pharmacyBranch->name ?? 'N/A',
                    'Réalisé par' => $inv->user->first_name . ' ' . $inv->user->last_name,
                    'Statut' => $inv->status === 'VALIDATED' ? 'Validé' : 'Brouillon',
                    'Article' => $line->batch->article->name ?? 'Article inconnu',
                    'Lot' => $line->batch->batch_number ?? 'N/A',
                    'Emplacement' => $line->storageLocation ? ($line->storageLocation->aisle . '-' . $line->storageLocation->shelf) : 'Non rangé',
                    'Qté Système (Théorique)' => $line->system_qty,
                    'Qté Physique (Réelle)' => $line->physical_qty,
                    'Écart' => $line->descrepency, // Utilise toujours ton orthographe de la DB
                    'Note / Commentaire' => $inv->comment ?? ''
                ];
            }
        }

        return Excel::download(new class($exportData) implements FromCollection, WithHeadings {
            protected $data;
            public function __construct($data) { $this->data = collect($data); }
            public function collection() { return $this->data; }
            public function headings(): array { 
                return [
                    'N° Inventaire', 'Date', 'Succursale', 'Réalisé par', 'Statut', 
                    'Article', 'Lot', 'Emplacement', 'Qté Système (Théorique)', 'Qté Physique (Réelle)', 'Écart', 'Note / Commentaire'
                ]; 
            }
        }, "details_inventaires_" . date('Ymd_His') . ".xlsx");
    }
}