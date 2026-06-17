<?php

namespace App\Http\Controllers\Pharmacien;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy\StockMovement;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

#[OA\Tag(name: "Mouvements de Stock", description: "Historique et piste d'audit des mouvements de stock")]
class StockMovementController extends Controller
{
    private function getContext()
    {
        $user = auth()->user();
        if ($user->profile_admin) {
            return [
                'role' => 'admin',
                'hospital_id' => $user->profile_admin->hospital_id,
                'branch_id' => null
            ];
        } elseif ($user->profile_pharm) {
            return [
                'role' => 'pharmacy',
                'hospital_id' => $user->profile_pharm->branch->hospital_id ?? null,
                'branch_id' => $user->profile_pharm->branch_id
            ];
        }
        abort(403, "Profil non autorisé.");
    }

    /**
     * SÉCURITÉ : Restreint la requête à la succursale (Pharmacien) ou à l'hôpital (Admin)
     */
    private function getScopedQuery()
    {
        $context = $this->getContext();
        
        // On charge les relations utiles pour l'affichage
        $query = StockMovement::with([
            'batch.article.category', 
            'storageLocation', 
            'pharmacyBranch'
        ]);

        if ($context['role'] === 'admin') {
            // L'admin voit les mouvements de toutes les succursales de son hôpital
            $query->whereHas('pharmacyBranch', function ($q) use ($context) {
                $q->where('hospital_id', $context['hospital_id']);
            });
        } else {
            // Le pharmacien ne voit que les mouvements de sa propre succursale
            $query->where('pharmacy_branch_id', $context['branch_id']);
        }

        return $query;
    }

    /**
     * FILTRES : Applique les critères de recherche
     */
    private function applyFilters($query, Request $request)
    {
        $context = $this->getContext();

        // Filtre par succursale (uniquement pour l'admin)
        if ($context['role'] === 'admin' && $request->filled('branch_id')) {
            $query->where('pharmacy_branch_id', $request->query('branch_id'));
        }

        // Filtre Type (ENTRY / EXIT)
        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        // Filtre Référence Type (PURCHASE, RETURN, SALE, etc.)
        if ($request->filled('reference_type')) {
            $query->where('reference_type', $request->query('reference_type'));
        }

        // Recherche textuelle (Article ou Lot)
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->whereHas('batch', function($q) use ($search) {
                $q->where('batch_number', 'like', "%{$search}%")
                  ->orWhereHas('article', function($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%")
                         ->orWhere('barcode', 'like', "%{$search}%");
                  });
            });
        }

        // Filtre par Date
        if ($request->filled('start_date') && $request->filled('end_date')) {
            // On ajoute les heures pour couvrir toute la journée
            $start = $request->query('start_date') . ' 00:00:00';
            $end = $request->query('end_date') . ' 23:59:59';
            $query->whereBetween('created_at', [$start, $end]);
        }

        return $query->orderBy('created_at', 'desc');
    }

    #[OA\Get(path: "/api/stock-movements", summary: "Lister l'historique des mouvements", security: [["bearerAuth" => []]], tags: ["Mouvements de Stock"])]
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 20);
        $query = $this->applyFilters($this->getScopedQuery(), $request);
        
        return response()->json($query->paginate($perPage), 200);
    }

    // ==========================================
    // EXPORTS (PDF & EXCEL)
    // ==========================================

    #[OA\Get(path: "/api/stock-movements/export/pdf", summary: "Exporter les mouvements en PDF", security: [["bearerAuth" => []]], tags: ["Mouvements de Stock"])]
    public function exportPdf(Request $request)
    {
        $query = $this->applyFilters($this->getScopedQuery(), $request);
        $movements = $query->get();
        
        // On utilise l'orientation paysage (landscape) car il y a beaucoup de colonnes
        $pdf = Pdf::loadView('exports.pdf.moves', compact('movements'))
                  ->setPaper('a4', 'landscape');

        return $pdf->download("historique_mouvements_" . date('Ymd_His') . ".pdf");
    }

    #[OA\Get(path: "/api/stock-movements/export/excel", summary: "Exporter les mouvements en Excel", security: [["bearerAuth" => []]], tags: ["Mouvements de Stock"])]
    public function exportExcel(Request $request)
    {
        $query = $this->applyFilters($this->getScopedQuery(), $request);
        $movements = $query->get();

        $exportData = $movements->map(function ($m) {
            
            // Traduction des types de référence pour Excel
            $refTypes = [
                'PURCHASE' => 'Achat / Commande',
                'RETURN' => 'Retour Fournisseur',
                'TRANSFER' => 'Transfert Inter-pharmacie',
                'INVENTORY' => 'Inventaire / Ajustement',
                'SALE' => 'Vente',
                'OTHER' => 'Autre'
            ];

            return [
                'Date & Heure' => $m->created_at->format('d/m/Y H:i:s'),
                'Succursale' => $m->pharmacyBranch->name ?? 'N/A',
                'Sens' => $m->type === 'ENTRY' ? 'ENTRÉE (+)' : 'SORTIE (-)',
                'Opération' => $refTypes[$m->reference_type] ?? $m->reference_type,
                'Réf Doc.' => $m->reference_id ? '#' . $m->reference_id : '-',
                'Article' => $m->batch->article->name ?? 'Article inconnu',
                'Lot (Batch)' => $m->batch->batch_number ?? 'STANDARD',
                'Emplacement' => $m->storageLocation ? ($m->storageLocation->aisle . ' - ' . $m->storageLocation->shelf) : '-',
                'Quantité Mouvementée' => $m->qty,
                'Stock Restant Après' => $m->qty_in_stock,
                'Commentaire' => $m->comment ?? '',
            ];
        });

        return Excel::download(new class($exportData) implements FromCollection, WithHeadings {
            protected $data;
            public function __construct($data) { $this->data = collect($data); }
            public function collection() { return $this->data; }
            public function headings(): array { 
                return [
                    'Date & Heure', 'Succursale', 'Sens', 'Opération', 'Réf Doc.', 
                    'Article', 'Lot (Batch)', 'Emplacement', 'Quantité Mouvementée', 'Stock Restant Après', 'Commentaire'
                ]; 
            }
        }, "historique_mouvements_" . date('Ymd_His') . ".xlsx");
    }
}