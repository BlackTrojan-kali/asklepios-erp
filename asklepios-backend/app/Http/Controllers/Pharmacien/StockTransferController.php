<?php

namespace App\Http\Controllers\Pharmacien;

use App\Http\Controllers\Controller;
use App\Http\Services\StockMovementService;
use App\Models\Pharmacy\StockTransfer;
use App\Models\Pharmacy\StockTransferLine;
use App\Models\User;
use App\Notifications\TransferShippedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use OpenApi\Attributes as OA;
use Exception;
use Illuminate\Support\Facades\Notification;

#[OA\Tag(name: "Transferts de Stock", description: "Gestion des transferts inter-pharmacies")]
class StockTransferController extends Controller
{
    protected StockMovementService $stockMovementService;

    public function __construct(StockMovementService $stockMovementService)
    {
        $this->stockMovementService = $stockMovementService;
    }

    private function getContext()
    {
        $user = auth()->user();
        if ($user->profile_admin) {
            return ['role' => 'admin', 'branch_id' => null];
        } elseif ($user->profile_pharm) {
            return ['role' => 'pharmacy', 'branch_id' => $user->profile_pharm->branch_id];
        }
        abort(403, "Profil non autorisé.");
    }

    private function applyFilters($query, Request $request, $context)
    {
        if ($context['role'] === 'pharmacy') {
            $branchId = $context['branch_id'];
            $query->where(function ($q) use ($branchId) {
                $q->where('source_pharmacy_id', $branchId)
                  ->orWhere('destination_pharmacy_id', $branchId);
            });
        } elseif ($context['role'] === 'admin' && $request->filled('pharmacy_id')) {
            $pharmacyId = $request->query('pharmacy_id');
            $query->where(function ($q) use ($pharmacyId) {
                $q->where('source_pharmacy_id', $pharmacyId)
                  ->orWhere('destination_pharmacy_id', $pharmacyId);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [
                $request->query('start_date') . ' 00:00:00',
                $request->query('end_date') . ' 23:59:59'
            ]);
        }

        return $query->with(['sourcePharmacy', 'destinationPharmacy', 'driver', 'vehicule', 'lines.batch.article'])
                     ->orderBy('created_at', 'desc');
    }

    #[OA\Get(path: "/api/stock-transfers", summary: "Lister les transferts (Paginé)", security: [["bearerAuth" => []]], tags: ["Transferts de Stock"])]
    #[OA\Response(response: 200, description: "Liste des transferts")]
    public function index(Request $request)
    {
        $context = $this->getContext();
        $query = StockTransfer::query();
        $query = $this->applyFilters($query, $request, $context);
        
        $perPage = $request->query('per_page', 15);
        return response()->json($query->paginate($perPage), 200);
    }

    #[OA\Post(path: "/api/stock-transfers", summary: "Créer un transfert (Expédition)", security: [["bearerAuth" => []]], tags: ["Transferts de Stock"])]
    #[OA\Response(response: 201, description: "Transfert initié")]
    public function store(Request $request)
    {
        $context = $this->getContext();
        if ($context['role'] !== 'pharmacy') {
            return response()->json(['message' => 'Seul un magasinier peut initier un transfert.'], 403);
        }

        $request->validate([
            'destination_pharmacy_id' => 'required|exists:pharmacy_branches,id|different:source_pharmacy_id',
            'driver_id' => 'required|exists:drivers,id',
            'vehicule_id' => 'required|exists:vehicules,id',
            'lines' => 'required|array|min:1',
            'lines.*.batch_id' => 'required|exists:batches,id',
            'lines.*.qty' => 'required|numeric|min:0.1'
        ]);

        DB::beginTransaction();

        try {
            $transfer = StockTransfer::create([
                'source_pharmacy_id' => $context['branch_id'],
                'destination_pharmacy_id' => $request->destination_pharmacy_id,
                'driver_id' => $request->driver_id,
                'vehicule_id' => $request->vehicule_id,
                'status' => 'INITIATED',
                'shipped_at' => now(),
            ]);

            foreach ($request->lines as $lineData) {
                StockTransferLine::create([
                    'stock_transfer_id' => $transfer->id,
                    'batch_id' => $lineData['batch_id'],
                    'qty_requested' => $lineData['qty'],
                    'qty_shipped' => $lineData['qty']
                ]);

                $this->stockMovementService->recordMovement(
                    'EXIT', 
                    'TRANSFER_OUT', 
                    $transfer->id, 
                    $lineData['batch_id'], 
                    $lineData['qty'], 
                    null, 
                    "Transfert initié vers la succursale #{$request->destination_pharmacy_id}"
                );
            }

            // =========================================================
            // SYSTÈME DE NOTIFICATION CIBLÉE
            // =========================================================

            // On s'assure que la relation est chargée pour l'utiliser dans le template de la notification
            $transfer->load('sourcePharmacy');

            $hospitalId = auth()->user()->profile_pharm->hospital_id;
            $destinationPharmacyId = $request->destination_pharmacy_id;

            // 1. Cibler les Administrateurs de cet hôpital
            $admins = User::whereHas('profile_admin', function($q) use ($hospitalId) {
                $q->where('hospital_id', $hospitalId);
            })->get();

            // 2. Cibler les Pharmaciens (uniquement "magasin") de la succursale destinataire
            $destinationPharmacists = User::whereHas('profile_pharm', function($q) use ($destinationPharmacyId) {
                // Attention: Assure-toi que "branch_id" existe bien dans ta table profile_pharms
                $q->where('branch_id', $destinationPharmacyId)
                  ->where('position', 'magasin'); 
            })->get();

            // 3. Fusion et Envoi
            $usersToNotify = $admins->merge($destinationPharmacists);

            if ($usersToNotify->isNotEmpty()) {
                Notification::send($usersToNotify, new TransferShippedNotification($transfer));
            }
            // =========================================================

            DB::commit();
            return response()->json(['message' => 'Transfert initié avec succès.', 'data' => $transfer->load('lines')], 201);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors du transfert : ' . $e->getMessage()], 400);
        }
    }

    #[OA\Post(path: "/api/stock-transfers/{id}/receive", summary: "Réceptionner un transfert", security: [["bearerAuth" => []]], tags: ["Transferts de Stock"])]
    #[OA\Response(response: 200, description: "Transfert réceptionné")]
    public function receive($id)
    {
        $context = $this->getContext();
        $transfer = StockTransfer::with('lines')->findOrFail($id);

        if ($context['role'] !== 'pharmacy' || $transfer->destination_pharmacy_id !== $context['branch_id']) {
            return response()->json(['message' => 'Seule la pharmacie destinataire peut réceptionner ce transfert.'], 403);
        }

        if ($transfer->status !== 'INITIATED') {
            return response()->json(['message' => 'Ce transfert ne peut plus être réceptionné (Statut: ' . $transfer->status . ').'], 400);
        }

        DB::beginTransaction();

        try {
            $transfer->update([
                'status' => 'TERMINATED',
                'received_at' => now()
            ]);

            foreach ($transfer->lines as $line) {
                $this->stockMovementService->recordMovement(
                    'ENTRY', 
                    'TRANSFER_IN', 
                    $transfer->id, 
                    $line->batch_id, 
                    $line->qty_shipped, 
                    null, 
                    "Réception du transfert depuis la succursale #{$transfer->source_pharmacy_id}"
                );
            }

            DB::commit();
            return response()->json(['message' => 'Transfert réceptionné avec succès et stocks mis à jour.'], 200);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la réception : ' . $e->getMessage()], 400);
        }
    }

    #[OA\Post(path: "/api/stock-transfers/{id}/cancel", summary: "Annuler un transfert initié", security: [["bearerAuth" => []]], tags: ["Transferts de Stock"])]
    #[OA\Response(response: 200, description: "Transfert annulé")]
    public function cancel($id)
    {
        $context = $this->getContext();
        $transfer = StockTransfer::with('lines')->findOrFail($id);

        if ($context['role'] !== 'pharmacy' || $transfer->source_pharmacy_id !== $context['branch_id']) {
            return response()->json(['message' => 'Seule la pharmacie expéditrice peut annuler ce transfert.'], 403);
        }

        if ($transfer->status !== 'INITIATED') {
            return response()->json(['message' => 'Impossible d\'annuler. Le transfert est déjà ' . $transfer->status . '.'], 400);
        }

        DB::beginTransaction();

        try {
            $transfer->update(['status' => 'CANCELLED']);

            foreach ($transfer->lines as $line) {
                $this->stockMovementService->recordMovement(
                    'ENTRY', 
                    'TRANSFER_CANCEL', 
                    $transfer->id, 
                    $line->batch_id, 
                    $line->qty_shipped, 
                    null, 
                    "Annulation du transfert. Restitution du stock."
                );
            }

            DB::commit();
            return response()->json(['message' => 'Transfert annulé. Les stocks ont été restitués à votre pharmacie.'], 200);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de l\'annulation : ' . $e->getMessage()], 400);
        }
    }

    #[OA\Get(path: "/api/stock-transfers/export/pdf", summary: "Exporter les transferts en PDF", security: [["bearerAuth" => []]], tags: ["Transferts de Stock"])]
    #[OA\Response(response: 200, description: "Fichier PDF généré")]
    public function exportPdf(Request $request)
    {
        $context = $this->getContext();
        $query = StockTransfer::query();
        $transfers = $this->applyFilters($query, $request, $context)->get();

        $pdf = Pdf::loadView('exports.pdf.stock_transfers', [
            'transfers' => $transfers,
            'role' => $context['role'],
            'filters' => $request->all(),
            'date' => now()->format('d/m/Y H:i')
        ]);

        return $pdf->download('Rapport_Transferts_Stock_' . date('Ymd_His') . '.pdf');
    }

    #[OA\Get(path: "/api/stock-transfers/{id}/waybill", summary: "Télécharger le bordereau de route en PDF", security: [["bearerAuth" => []]], tags: ["Transferts de Stock"])]
    #[OA\Response(response: 200, description: "Fichier PDF du bordereau de route")]
    public function downloadWaybill(Request $request, $id)
    {
        $context = $this->getContext();

        $query = StockTransfer::with(['sourcePharmacy', 'destinationPharmacy', 'driver', 'vehicule', 'lines.batch.article'])
                              ->where('id', $id);

        if ($context['role'] === 'pharmacy') {
            $branchId = $context['branch_id'];
            $query->where(function ($q) use ($branchId) {
                $q->where('source_pharmacy_id', $branchId)
                  ->orWhere('destination_pharmacy_id', $branchId);
            });
        }

        $transfer = $query->firstOrFail();

        $pdf = Pdf::loadView('exports.pdf.stock_transfer_waybill', compact('transfer'))
                  ->setPaper('a4', 'portrait');

        return $pdf->download("Bordereau_Route_TRF_" . str_pad($transfer->id, 5, '0', STR_PAD_LEFT) . "_" . date('Ymd') . ".pdf");
    }
}