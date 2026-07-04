<?php

namespace App\Http\Controllers\Pharmacien;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy\PurchaseOrder;
use App\Models\Pharmacy\PurchaseOrderLine;
use App\Models\Pharmacy\Batch;
use App\Http\Services\StockMovementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use OpenApi\Attributes as OA;
use Exception;

#[OA\Tag(name: "Commandes Fournisseurs", description: "Gestion des approvisionnements (Admin & Pharmacien)")]
class PurchaseOrderController extends Controller
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
                'role' => 'pharmacien',
                'hospital_id' => $user->profile_pharm->branch->hospital_id ?? null,
                'branch_id' => $user->profile_pharm->branch_id
            ];
        }
        abort(403, "Profil non autorisé.");
    }

    /**
     * Helper : Construire la requête de base filtrée selon le rôle
     */
    private function getBaseQuery(Request $request)
    {
        $context = $this->getContext();
        $query = PurchaseOrder::with(['provider', 'destinationPharmacy', 'user', 'lines.article']);

        // Filtrage par rôle
        if ($context['role'] === 'admin') {
            $query->where('hospital_id', $context['hospital_id']);
            // L'admin peut filtrer par succursale (standardisé avec pharmacy_branch_id)
            if ($request->filled('pharmacy_branch_id')) {
                $query->where('destination_pharmacy_id', $request->query('pharmacy_branch_id'));
            }
        } else {
            // Le pharmacien ne voit que sa succursale
            $query->where('destination_pharmacy_id', $context['branch_id']);
        }

        // Filtres globaux (Statut, Fournisseur)
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('provider_id')) {
            $query->where('provider_id', $request->query('provider_id'));
        }
        
        // 🚨 CORRECTION DU FILTRE DE PÉRIODE 🚨
        if ($request->filled('start_date')) {
            $query->where('created_at', '>=', $request->query('start_date') . ' 00:00:00');
        }
        if ($request->filled('end_date')) {
            $query->where('created_at', '<=', $request->query('end_date') . ' 23:59:59');
        }

        return $query->orderBy('created_at', 'desc');
    }

    // ==========================================
    // 1. LISTER (INDEX AVEC PAGINATION)
    // ==========================================
    #[OA\Get(path: "/api/purchase-orders", summary: "Lister les commandes (Filtrable)", security: [["bearerAuth" => []]], tags: ["Commandes Fournisseurs"])]
    #[OA\Parameter(name: "pharmacy_branch_id", in: "query", required: false, description: "Filtrer par succursale (Admin)", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "status", in: "query", required: false, description: "Filtrer par statut", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "provider_id", in: "query", required: false, description: "Filtrer par fournisseur", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "start_date", in: "query", required: false, description: "Date de début", schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Parameter(name: "end_date", in: "query", required: false, description: "Date de fin", schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Response(response: 200, description: "Liste des commandes récupérée")]
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 15);
        $orders = $this->getBaseQuery($request)->paginate($perPage);
        return response()->json($orders, 200);
    }

    // ==========================================
    // 2. CRÉER UNE COMMANDE
    // ==========================================
    #[OA\Post(path: "/api/purchase-orders", summary: "Créer une commande", security: [["bearerAuth" => []]], tags: ["Commandes Fournisseurs"])]
    #[OA\Response(response: 201, description: "Commande créée avec succès")]
    public function store(Request $request)
    {
        $context = $this->getContext();
        
        $request->validate([
            'provider_id' => 'required|exists:providers,id',
            'destination_pharmacy_id' => $context['role'] === 'admin' ? 'required|exists:pharmacy_branches,id' : 'nullable',
            'lines' => 'required|array|min:1',
            'lines.*.article_id' => 'required|exists:articles,id',
            'lines.*.qty_ordered' => 'required|numeric|min:0.1',
            'lines.*.unit_cost' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $totalAmount = 0;

            $order = PurchaseOrder::create([
                'hospital_id' => $context['hospital_id'],
                'provider_id' => $request->provider_id,
                'destination_pharmacy_id' => $context['role'] === 'admin' ? $request->destination_pharmacy_id : $context['branch_id'],
                'user_id' => auth()->id(),
                'status' => 'PENDING',
                'total_amount' => 0 
            ]);

            foreach ($request->lines as $line) {
                $cost = $line['unit_cost'] ?? 0;
                $totalAmount += ($line['qty_ordered'] * $cost);

                PurchaseOrderLine::create([
                    'purchase_order_id' => $order->id,
                    'article_id' => $line['article_id'],
                    'qty_ordered' => $line['qty_ordered'],
                    'qty_received' => 0,
                    'unit_cost' => $cost
                ]);
            }

            $order->update(['total_amount' => $totalAmount]);

            DB::commit();
            return response()->json(['message' => 'Commande créée avec succès', 'data' => $order->load('lines')], 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la création : ' . $e->getMessage()], 500);
        }
    }

    // ==========================================
    // 3. MODIFIER (Uniquement si PENDING)
    // ==========================================
    #[OA\Put(path: "/api/purchase-orders/{id}", summary: "Modifier une commande en attente", security: [["bearerAuth" => []]], tags: ["Commandes Fournisseurs"])]
    #[OA\Response(response: 200, description: "Commande mise à jour")]
    public function update(Request $request, $id)
    {
        $order = $this->getBaseQuery($request)->where('id', $id)->firstOrFail();

        if ($order->status !== 'PENDING') {
            return response()->json(['message' => 'Impossible de modifier une commande déjà traitée ou annulée.'], 400);
        }

        DB::beginTransaction();
        try {
            $order->lines()->delete();
            $totalAmount = 0;

            foreach ($request->lines as $line) {
                $cost = $line['unit_cost'] ?? 0;
                $totalAmount += ($line['qty_ordered'] * $cost);

                PurchaseOrderLine::create([
                    'purchase_order_id' => $order->id,
                    'article_id' => $line['article_id'],
                    'qty_ordered' => $line['qty_ordered'],
                    'qty_received' => 0,
                    'unit_cost' => $cost
                ]);
            }

            $order->update([
                'provider_id' => $request->provider_id ?? $order->provider_id,
                'total_amount' => $totalAmount
            ]);

            DB::commit();
            return response()->json(['message' => 'Commande mise à jour'], 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }

    // ==========================================
    // 4. SUPPRIMER (Uniquement si PENDING)
    // ==========================================
    #[OA\Delete(path: "/api/purchase-orders/{id}", summary: "Supprimer une commande", security: [["bearerAuth" => []]], tags: ["Commandes Fournisseurs"])]
    #[OA\Response(response: 200, description: "Commande supprimée")]
    public function destroy(Request $request, $id)
    {
        $order = $this->getBaseQuery($request)->where('id', $id)->firstOrFail();

        if ($order->status !== 'PENDING') {
            return response()->json(['message' => 'Impossible de supprimer une commande traitée.'], 400);
        }

        $order->delete();
        return response()->json(['message' => 'Commande supprimée.'], 200);
    }

    // ==========================================
    // 5. ANNULER UNE COMMANDE
    // ==========================================
    #[OA\Post(path: "/api/purchase-orders/{id}/cancel", summary: "Annuler une commande (Sans mouvement de stock)", security: [["bearerAuth" => []]], tags: ["Commandes Fournisseurs"])]
    #[OA\Response(response: 200, description: "Action effectuée avec succès")]
    public function cancelOrder(Request $request, $id)
    {
        $order = $this->getBaseQuery($request)->where('id', $id)->firstOrFail();

        if ($order->status !== 'PENDING') {
            return response()->json(['message' => 'Seule une commande en attente peut être annulée.'], 400);
        }

        $order->update(['status' => 'CANCELLED']);
        return response()->json(['message' => 'Commande annulée avec succès.'], 200);
    }

    // ==========================================
    // 6. VALIDER / RÉCEPTIONNER (Mouvement de Stock)
    // ==========================================
    #[OA\Post(path: "/api/purchase-orders/{id}/validate", summary: "Réceptionner la commande (Entrée en stock)", security: [["bearerAuth" => []]], tags: ["Commandes Fournisseurs"])]
    #[OA\Response(response: 200, description: "Action effectuée avec succès")]
    public function validateOrder(Request $request, $id)
    {
        $order = $this->getBaseQuery($request)->where('id', $id)->firstOrFail();

        if (in_array($order->status, ['CANCELLED', 'RECEIVED'])) { 
            return response()->json(['message' => 'Statut invalide pour la réception.'], 400);
        }

        $request->validate([
            'lines' => 'required|array',
            'lines.*.line_id' => 'required|exists:purchase_order_lines,id',
            'lines.*.qty_received' => 'required|numeric|min:0',
            'lines.*.batch_number' => 'nullable|string',
            'lines.*.expire_date' => 'nullable|date',
            'lines.*.storage_location_id' => 'nullable|exists:storage_locations,id'
        ]);

        DB::beginTransaction();
        try {
            $allFullyReceived = true;

            foreach ($request->lines as $receivedData) {
                $line = PurchaseOrderLine::where('purchase_order_id', $order->id)->findOrFail($receivedData['line_id']);
                
                if ($receivedData['qty_received'] > 0) {
                    $line->qty_received += $receivedData['qty_received'];
                    $line->save();

                    $batchNumber = !empty($receivedData['batch_number']) ? $receivedData['batch_number'] : 'STANDARD';

                    $batch = Batch::firstOrCreate([
                        'article_id' => $line->article_id,
                        'batch_number' => $batchNumber
                    ], [
                        'expire_date' => $receivedData['expire_date'] ?? null,
                        'purchase_price' => $line->unit_cost ?? 0 
                    ]);

                    $this->movementService->recordMovement(
                        'ENTRY', 
                        'PURCHASE', 
                        $order->id, 
                        $batch->id, 
                        $receivedData['qty_received'], 
                        $receivedData['storage_location_id'] ?? null, 
                        "Réception commande fournisseur #{$order->id}"
                    );
                }

                if ($line->qty_received < $line->qty_ordered) {
                    $allFullyReceived = false;
                }
            }

            $newStatus = $allFullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
            $order->update(['status' => $newStatus]);

            DB::commit();
            return response()->json(['message' => 'Réception enregistrée et stock mis à jour', 'status' => $newStatus], 200);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la réception : ' . $e->getMessage()], 400);
        }
    }

    // ==========================================
    // 7. EXPORTS (PDF & EXCEL) DÉTAILLÉS
    // ==========================================
    #[OA\Get(path: "/api/purchase-orders/export/pdf", summary: "Exporter l'historique détaillé en PDF", security: [["bearerAuth" => []]], tags: ["Commandes Fournisseurs"])]
    #[OA\Parameter(name: "pharmacy_branch_id", in: "query", required: false, description: "Succursale", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "status", in: "query", required: false, description: "Statut", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "start_date", in: "query", required: false, description: "Début", schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Parameter(name: "end_date", in: "query", required: false, description: "Fin", schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Response(response: 200, description: "Fichier généré avec succès")]
    public function exportPdf(Request $request)
    {
        $orders = $this->getBaseQuery($request)->get();
        
        $filters = $request->all();
        $user = auth()->user();

        $pdf = Pdf::loadView('exports.pdf.purchase_orders', compact('orders', 'filters', 'user'))
                  ->setPaper('a4', 'landscape');

        return $pdf->download("details_commandes_" . date('Ymd_His') . ".pdf");
    }

    #[OA\Get(path: "/api/purchase-orders/export/excel", summary: "Exporter l'historique détaillé en Excel", security: [["bearerAuth" => []]], tags: ["Commandes Fournisseurs"])]
    #[OA\Parameter(name: "pharmacy_branch_id", in: "query", required: false, description: "Succursale", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "start_date", in: "query", required: false, description: "Début", schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Parameter(name: "end_date", in: "query", required: false, description: "Fin", schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Response(response: 200, description: "Fichier généré avec succès")]
    public function exportExcel(Request $request)
    {
        $orders = $this->getBaseQuery($request)->get();
        $exportData = [];

        foreach ($orders as $order) {
            foreach ($order->lines as $line) {
                $ecart = max(0, $line->qty_ordered - $line->qty_received);
                $isCompleted = $line->qty_received >= $line->qty_ordered;

                $exportData[] = [
                    'Commande N°' => $order->id,
                    'Date' => $order->created_at->format('d/m/Y H:i'),
                    'Succursale' => $order->destinationPharmacy->name ?? 'N/A', // 👉 Ajout pour l'admin
                    'Fournisseur' => $order->provider->name ?? 'Inconnu',
                    'Statut Commande' => $order->status,
                    'Article' => $line->article->name ?? 'Article Inconnu',
                    'Qté Commandée' => $line->qty_ordered,
                    'Qté Reçue' => $line->qty_received,
                    'Écart / Manquant' => $ecart,
                    'État Livraison' => $isCompleted ? 'Complète' : 'Incomplète',
                    'Prix U. (FCFA)' => $line->unit_cost,
                    'Total Ligne (FCFA)' => $line->qty_ordered * $line->unit_cost,
                ];
            }
        }

        return Excel::download(new class($exportData) implements FromCollection, WithHeadings {
            protected $data;
            public function __construct($data) { $this->data = collect($data); }
            public function collection() { return $this->data; }
            public function headings(): array { 
                return [
                    'Commande N°', 'Date', 'Succursale', 'Fournisseur', 'Statut Commande', 
                    'Article', 'Qté Commandée', 'Qté Reçue', 'Écart / Manquant', 
                    'État Livraison', 'Prix U. (FCFA)', 'Total Ligne (FCFA)'
                ]; 
            }
        }, "details_commandes_" . date('Ymd_His') . ".xlsx");
    }

    // ==========================================
    // 8. TÉLÉCHARGER LE BON DE COMMANDE (PDF FOURNISSEUR)
    // ==========================================
    #[OA\Get(path: "/api/purchase-orders/{id}/pdf", summary: "Télécharger le bon de commande en PDF", security: [["bearerAuth" => []]], tags: ["Commandes Fournisseurs"])]
    #[OA\Response(response: 200, description: "Fichier PDF du bon de commande")]
    public function downloadOrderForm(Request $request, $id)
    {
        $context = $this->getContext();

        $query = PurchaseOrder::with(['provider', 'destinationPharmacy', 'hospital', 'lines.article', 'user'])
                              ->where('id', $id);

        if ($context['role'] === 'admin') {
            $query->where('hospital_id', $context['hospital_id']);
        } else {
            $query->where('destination_pharmacy_id', $context['branch_id']);
        }

        $order = $query->firstOrFail();

        $pdf = Pdf::loadView('exports.pdf.purchase_order_form', compact('order'))
                  ->setPaper('a4', 'portrait');

        return $pdf->download("Bon_de_Commande_N" . str_pad($order->id, 5, '0', STR_PAD_LEFT) . "_" . date('Ymd') . ".pdf");
    }
}