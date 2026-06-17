<?php

namespace App\Http\Controllers\Pharmacien;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy\PurchaseReturnLine;
use App\Http\Services\StockMovementService;
use App\Models\Pharmacy\PurchaseReturn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use OpenApi\Attributes as OA;
use Exception;

#[OA\Tag(name: "Retours Fournisseurs", description: "Gestion des retours de marchandises (Admin & Pharmacy)")]
class PurchaseReturnController extends Controller
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
     * SÉCURITÉ : Retourne la requête de base restreinte à l'hôpital ou la succursale de l'utilisateur.
     * Utilisé pour récupérer un modèle spécifique (Update, Delete, Validate).
     */
    private function getScopedQuery()
    {
        $context = $this->getContext();
        $query = PurchaseReturn::with(['provider', 'sourcePharmacy', 'purchaseOrder', 'lines.batch.article']);
        
        if ($context['role'] === 'admin') {
            $query->where('hospital_id', $context['hospital_id']);
        } else {
            $query->where('source_pharmacy_id', $context['branch_id']);
        }

        return $query;
    }

    /**
     * FILTRES : Applique les filtres de recherche (GET) sur une requête existante.
     * Utilisé uniquement pour les listes (Index, Exports).
     */
    private function applyFilters($query, Request $request)
    {
        $context = $this->getContext();

        if ($context['role'] === 'admin' && $request->filled('branch_id')) {
            $query->where('source_pharmacy_id', $request->query('branch_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('provider_id')) {
            $query->where('provider_id', $request->query('provider_id'));
        }
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('return_date', [$request->query('start_date'), $request->query('end_date')]);
        }

        return $query->orderBy('created_at', 'desc');
    }

    #[OA\Get(path: "/api/purchase-returns", summary: "Lister les retours fournisseurs", security: [["bearerAuth" => []]], tags: ["Retours Fournisseurs"])]
    #[OA\Response(response: 200, description: "Liste des retours récupérée")]
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 15);
        
        // On sécurise PUIS on filtre
        $query = $this->applyFilters($this->getScopedQuery(), $request);
        
        return response()->json($query->paginate($perPage), 200);
    }

    #[OA\Post(path: "/api/purchase-returns", summary: "Initier un retour fournisseur", security: [["bearerAuth" => []]], tags: ["Retours Fournisseurs"])]
    #[OA\Response(response: 201, description: "Retour initié avec succès")]
    public function store(Request $request)
    {
        $context = $this->getContext();
        
        $request->validate([
            'provider_id' => 'required|exists:providers,id',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
            'source_pharmacy_id' => $context['role'] === 'admin' ? 'required|exists:pharmacy_branches,id' : 'nullable',
            'return_date' => 'required|date',
            'lines' => 'required|array|min:1',
            'lines.*.batch_id' => 'required|exists:batches,id',
            'lines.*.qty_returned' => 'required|numeric|min:0.1',
            'lines.*.reason' => 'nullable|string',
        ]);
        
        $branchId = $context['role'] === 'admin' ? $request->source_pharmacy_id : $context['branch_id'];

        DB::beginTransaction();
        try {
            $return = PurchaseReturn::create([
                'hospital_id' => $context['hospital_id'],
                'provider_id' => $request->provider_id,
                'source_pharmacy_id' => $branchId,
                'purchase_order_id' => $request->purchase_order_id,
                'return_date' => $request->return_date,
                'status' => 'PENDING',
            ]);
            
            foreach ($request->lines as $line) {
                PurchaseReturnLine::create([
                    'purchase_return_id' => $return->id,
                    'pharmacy_branch_id' => $branchId,
                    'batch_id' => $line['batch_id'],
                    'qty_returned' => $line['qty_returned'],
                    'reason' => $line['reason'] ?? null
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Retour initié avec succès', 'data' => $return->load('lines.batch.article')], 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }

    #[OA\Put(path: "/api/purchase-returns/{id}", summary: "Modifier un retour", security: [["bearerAuth" => []]], tags: ["Retours Fournisseurs"])]
    #[OA\Response(response: 200, description: "Retour mis à jour")]
    public function update(Request $request, $id)
    {
        // On utilise UNIQUEMENT le scope de sécurité ici
        $return = $this->getScopedQuery()->where('id', $id)->firstOrFail();

        if ($return->status !== 'PENDING') {
            return response()->json(['message' => 'Impossible de modifier un retour déjà expédié ou annulé.'], 400);
        }

        DB::beginTransaction();
        try {
            $return->lines()->delete();

            foreach ($request->lines as $line) {
                PurchaseReturnLine::create([
                    'purchase_return_id' => $return->id,
                    'pharmacy_branch_id' => $return->source_pharmacy_id,
                    'batch_id' => $line['batch_id'],
                    'qty_returned' => $line['qty_returned'],
                    'reason' => $line['reason'] ?? null
                ]);
            }

            $return->update([
                'provider_id' => $request->provider_id ?? $return->provider_id,
                'purchase_order_id' => $request->purchase_order_id ?? $return->purchase_order_id,
                'return_date' => $request->return_date ?? $return->return_date,
            ]);

            DB::commit();
            return response()->json(['message' => 'Retour mis à jour'], 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }

    #[OA\Delete(path: "/api/purchase-returns/{id}", summary: "Supprimer un retour", security: [["bearerAuth" => []]], tags: ["Retours Fournisseurs"])]
    #[OA\Response(response: 200, description: "Retour supprimé")]
    public function destroy(Request $request, $id)
    {
        $return = $this->getScopedQuery()->where('id', $id)->firstOrFail();

        if ($return->status !== 'PENDING') {
            return response()->json(['message' => 'Impossible de supprimer un retour traité.'], 400);
        }

        $return->delete();
        return response()->json(['message' => 'Retour supprimé.'], 200);
    }

    #[OA\Post(path: "/api/purchase-returns/{id}/cancel", summary: "Annuler un retour", security: [["bearerAuth" => []]], tags: ["Retours Fournisseurs"])]
    #[OA\Response(response: 200, description: "Retour annulé avec succès")]
    public function cancelReturn(Request $request, $id)
    {
        $return = $this->getScopedQuery()->where('id', $id)->firstOrFail();

        if ($return->status !== 'PENDING') {
            return response()->json(['message' => 'Seul un retour en attente peut être annulé.'], 400);
        }

        $return->update(['status' => 'CANCELLED']);
        return response()->json(['message' => 'Retour annulé avec succès.'], 200);
    }

    #[OA\Post(path: "/api/purchase-returns/{id}/validate", summary: "Valider le retour (Sortie de stock)", security: [["bearerAuth" => []]], tags: ["Retours Fournisseurs"])]
    #[OA\Response(response: 200, description: "Retour validé et stock déduit")]
    public function validateReturn(Request $request, $id)
    {
        $return = $this->getScopedQuery()->where('id', $id)->firstOrFail();

        if ($return->status !== 'PENDING') {
            return response()->json(['message' => 'Le retour a déjà été validé ou annulé.'], 400);
        }

        DB::beginTransaction();
        try {
            foreach ($return->lines as $line) {
                $this->movementService->recordMovement(
                    'EXIT', 
                    'RETURN', 
                    $return->id, 
                    $line->batch_id, 
                    $line->qty_returned, 
                    null, 
                    "Retour marchandise fournisseur #{$return->id} - Motif: {$line->reason}"
                );
            }

            $return->update(['status' => 'SHIPPED']);

            DB::commit();
            return response()->json(['message' => 'Retour validé et stock déduit avec succès', 'status' => 'SHIPPED'], 200);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la validation : ' . $e->getMessage()], 400);
        }
    }

    #[OA\Get(path: "/api/purchase-returns/export/pdf", summary: "Exporter les retours détaillés en PDF", security: [["bearerAuth" => []]], tags: ["Retours Fournisseurs"])]
    #[OA\Response(response: 200, description: "Fichier PDF généré")]
    public function exportPdf(Request $request)
    {
        $query = $this->applyFilters($this->getScopedQuery(), $request);
        $returns = $query->get();
        
        $pdf = Pdf::loadView('exports.pdf.purchase_returns', compact('returns'))
                  ->setPaper('a4', 'landscape');

        return $pdf->download("details_retours_" . date('Ymd_His') . ".pdf");
    }

    #[OA\Get(path: "/api/purchase-returns/export/excel", summary: "Exporter les retours détaillés en Excel", security: [["bearerAuth" => []]], tags: ["Retours Fournisseurs"])]
    #[OA\Response(response: 200, description: "Fichier Excel généré")]
    public function exportExcel(Request $request)
    {
        $query = $this->applyFilters($this->getScopedQuery(), $request);
        $returns = $query->get();
        
        $exportData = [];

        foreach ($returns as $r) {
            foreach ($r->lines as $line) {
                $exportData[] = [
                    'Retour N°' => $r->id,
                    'Date de Retour' => $r->return_date->format('d/m/Y'),
                    'Fournisseur' => $r->provider->name ?? 'Inconnu',
                    'Commande Réf' => $r->purchase_order_id ? '#' . $r->purchase_order_id : 'N/A',
                    'Statut' => $r->status,
                    'Article' => $line->batch->article->name ?? 'Article Inconnu',
                    'Lot Renvoyé (Batch)' => $line->batch->batch_number ?? 'N/A',
                    'Qté Retournée' => $line->qty_returned,
                    'Motif' => $line->reason ?? 'Non précisé',
                ];
            }
        }

        return Excel::download(new class($exportData) implements FromCollection, WithHeadings {
            protected $data;
            public function __construct($data) { $this->data = collect($data); }
            public function collection() { return $this->data; }
            public function headings(): array { 
                return [
                    'Retour N°', 'Date de Retour', 'Fournisseur', 'Commande Réf', 
                    'Statut', 'Article', 'Lot Renvoyé (Batch)', 'Qté Retournée', 'Motif'
                ]; 
            }
        }, "details_retours_" . date('Ymd_His') . ".xlsx");
    }
}