<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy\PosSale;
use App\Models\Pharmacy\PharmacyBranch;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Historique des Ventes (Admin)", description: "Consultation de toutes les ventes POS réalisées dans l'hôpital par l'administrateur")]
class PosSaleController extends Controller
{
    private function getHospitalId()
    {
        $user = Auth::user();
        if ($user->profile_admin) {
            return $user->profile_admin->hospital_id;
        } else if ($user->profile_pharm) {
            return $user->profile_pharm->hospital_id ?? $user->profile_pharm->branch->hospital_id ?? null;
        }
        abort(403, "Profil non autorisé.");
    }

    /**
     * Liste paginée de toutes les ventes de l'hôpital avec filtres
     */
    #[OA\Get(
        path: "/api/admin/pharmacy/pos-sales",
        operationId: "getAdminPosSales",
        summary: "Liste paginée de toutes les ventes de l'hôpital avec filtres (Admin)",
        security: [["bearerAuth" => []]],
        tags: ["Historique des Ventes (Admin)"]
    )]
    #[OA\Parameter(name: "pharmacy_branch_id", in: "query", required: false, description: "ID de la succursale", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "cash_register_id", in: "query", required: false, description: "ID de la caisse", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "user_id", in: "query", required: false, description: "ID du vendeur/caissier", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "start_date", in: "query", required: false, description: "Date de début (YYYY-MM-DD)", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "end_date", in: "query", required: false, description: "Date de fin (YYYY-MM-DD)", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Recherche par ticket, client ou ordonnance", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "page", in: "query", required: false, description: "Numéro de page", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "per_page", in: "query", required: false, description: "Éléments par page", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste paginée des ventes récupérée avec succès")]
    #[OA\Response(response: 403, description: "Accès refusé")]
    private function buildFilteredQuery(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        
        // Liste des succursales de cet hôpital pour filtrer/vérifier la légitimité des requêtes
        $branchIds = PharmacyBranch::where('hospital_id', $hospitalId)->pluck('id')->toArray();

        $query = PosSale::whereIn('pharmacy_branch_id', $branchIds)
            ->with(['session.user', 'session.register', 'branch.country', 'items.article', 'patient']);

        // Filtrage par succursale
        if ($request->filled('pharmacy_branch_id')) {
            $branchId = (int)$request->query('pharmacy_branch_id');
            if (in_array($branchId, $branchIds)) {
                $query->where('pharmacy_branch_id', $branchId);
            }
        }

        // Filtrage par caisse (via la session)
        if ($request->filled('cash_register_id')) {
            $query->whereHas('session', function ($q) use ($request) {
                $q->where('cash_register_id', $request->query('cash_register_id'));
            });
        }

        // Filtrage par vendeur/caissier
        if ($request->filled('user_id')) {
            $query->whereHas('session', function ($q) use ($request) {
                $q->where('user_id', $request->query('user_id'));
            });
        }

        // Filtrage par mode de paiement (CASH, MOBILE_MONEY, CARD)
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->query('payment_method'));
        }

        // Filtrage par date de début
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->query('start_date'));
        }

        // Filtrage par date de fin
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->query('end_date'));
        }

        // Recherche rapide (client, réf ordonnance, ou numéro de ticket/ID)
        if ($request->filled('search')) {
            $search = $request->query('search');
            $cleanSearch = $search;
            if (preg_match('/^FA-0*([1-9][0-9]*)$/i', $search, $matches)) {
                $cleanSearch = $matches[1];
            } elseif (preg_match('/^FA-0+$/i', $search)) {
                $cleanSearch = '0';
            }
            
            $query->where(function ($q) use ($search, $cleanSearch) {
                $q->where('customer_name', 'like', "%{$search}%")
                  ->orWhere('prescription_ref', 'like', "%{$search}%")
                  ->orWhere('id', $cleanSearch)
                  ->orWhereHas('patient', function ($pq) use ($search) {
                      $pq->where('patient_code', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                  });
            });
        }

        return $query;
    }

    public function index(Request $request)
    {
        $query = $this->buildFilteredQuery($request);
        $totalAmountSum = (float) (clone $query)->sum('total_amount');

        $perPage = (int)$request->query('per_page', 15);
        $sales = $query->latest()->paginate($perPage);

        return response()->json([
            'sales' => $sales,
            'total_amount_sum' => $totalAmountSum
        ], 200);
    }

    /**
     * Exporter les ventes POS en Excel
     */
    #[OA\Get(
        path: "/api/admin/pharmacy/pos-sales/export/excel",
        operationId: "exportAdminPosSalesExcel",
        summary: "Exporter toutes les ventes filtrées en Excel (Admin)",
        security: [["bearerAuth" => []]],
        tags: ["Historique des Ventes (Admin)"]
    )]
    #[OA\Parameter(name: "pharmacy_branch_id", in: "query", required: false, description: "ID de la succursale", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "cash_register_id", in: "query", required: false, description: "ID de la caisse", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "user_id", in: "query", required: false, description: "ID du vendeur", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "payment_method", in: "query", required: false, description: "Mode de paiement", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "start_date", in: "query", required: false, description: "Date de début", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "end_date", in: "query", required: false, description: "Date de fin", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Recherche", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Fichier Excel généré")]
    #[OA\Response(response: 403, description: "Accès refusé")]
    public function exportExcel(Request $request)
    {
        $query = $this->buildFilteredQuery($request);
        $sales = $query->latest()->get();

        $exportData = $sales->map(function ($s) {
            $currency = $s->session->register->branch->country->currency ?? 'XAF';
            $clientName = $s->customer_name ?? 'Anonyme';
            if ($s->patient) {
                $clientName .= " (" . $s->patient->patient_code . ")";
            }
            return [
                'Ticket N°' => $s->receipt_number,
                'Date' => $s->created_at->format('d/m/Y H:i'),
                'Succursale' => $s->branch->name ?? 'N/A',
                'Caisse' => $s->session->register->name ?? 'N/A',
                'Client' => $clientName,
                'Vendeur' => $s->session->user ? ($s->session->user->first_name . ' ' . $s->session->user->last_name) : 'Caissier',
                'Mode Règlement' => $s->payment_method,
                'Total' => $s->total_amount . ' ' . $currency,
            ];
        });

        return \Maatwebsite\Excel\Facades\Excel::download(new class($exportData) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
            protected $data;
            public function __construct($data) { $this->data = collect($data); }
            public function collection() { return $this->data; }
            public function headings(): array { 
                return ['Ticket N°', 'Date', 'Succursale', 'Caisse', 'Client', 'Vendeur', 'Mode Règlement', 'Total']; 
            }
        }, "ventes_pos_" . date('Ymd_His') . ".xlsx");
    }

    /**
     * Exporter les ventes POS en PDF
     */
    #[OA\Get(
        path: "/api/admin/pharmacy/pos-sales/export/pdf",
        operationId: "exportAdminPosSalesPdf",
        summary: "Exporter toutes les ventes filtrées en PDF (Admin)",
        security: [["bearerAuth" => []]],
        tags: ["Historique des Ventes (Admin)"]
    )]
    #[OA\Parameter(name: "pharmacy_branch_id", in: "query", required: false, description: "ID de la succursale", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "cash_register_id", in: "query", required: false, description: "ID de la caisse", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "user_id", in: "query", required: false, description: "ID du vendeur", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "payment_method", in: "query", required: false, description: "Mode de paiement", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "start_date", in: "query", required: false, description: "Date de début", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "end_date", in: "query", required: false, description: "Date de fin", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Recherche", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Fichier PDF généré")]
    #[OA\Response(response: 403, description: "Accès refusé")]
    public function exportPdf(Request $request)
    {
        $query = $this->buildFilteredQuery($request);
        $sales = $query->latest()->get();
        
        if ($sales->isEmpty()) {
            return response()->json(['message' => 'Aucune vente correspondante.'], 404);
        }

        $totalAmountSum = $sales->sum('total_amount');

        // Métadonnées de filtres pour l'en-tête du PDF
        $branchName = 'Toutes les succursales';
        if ($request->filled('pharmacy_branch_id')) {
            $b = PharmacyBranch::find($request->query('pharmacy_branch_id'));
            if ($b) $branchName = $b->name;
        }

        $registerName = 'Toutes les caisses';
        if ($request->filled('cash_register_id')) {
            $r = \App\Models\Pharmacy\CashRegister::find($request->query('cash_register_id'));
            if ($r) $registerName = $r->name;
        }

        $sellerName = 'Tous les vendeurs';
        if ($request->filled('user_id')) {
            $u = User::find($request->query('user_id'));
            if ($u) $sellerName = $u->first_name . ' ' . $u->last_name;
        }

        $paymentMethodLabel = 'Tous les modes';
        if ($request->filled('payment_method')) {
            $pm = $request->query('payment_method');
            if ($pm === 'CASH') $paymentMethodLabel = 'Espèces (CASH)';
            elseif ($pm === 'MOBILE_MONEY') $paymentMethodLabel = 'Mobile Money (Momo)';
            elseif ($pm === 'CARD') $paymentMethodLabel = 'Carte Bancaire';
        }

        $periodLabel = 'Toutes les dates';
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $periodLabel = 'Du ' . date('d/m/Y', strtotime($request->query('start_date'))) . ' au ' . date('d/m/Y', strtotime($request->query('end_date')));
        } elseif ($request->filled('start_date')) {
            $periodLabel = 'À partir du ' . date('d/m/Y', strtotime($request->query('start_date')));
        } elseif ($request->filled('end_date')) {
            $periodLabel = 'Jusqu\'au ' . date('d/m/Y', strtotime($request->query('end_date')));
        }

        $filterInfo = [
            'branch' => $branchName,
            'register' => $registerName,
            'seller' => $sellerName,
            'payment_method' => $paymentMethodLabel,
            'period' => $periodLabel,
            'search' => $request->query('search'),
        ];
        
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('exports.pdf.sales_list', compact('sales', 'totalAmountSum', 'filterInfo'))
                  ->setPaper('a4', 'landscape');

        return $pdf->download("rapport_ventes_pos_" . date('Ymd_His') . ".pdf");
    }

    /**
     * Obtenir la liste de tous les vendeurs/caissiers de l'hôpital
     */
    #[OA\Get(
        path: "/api/admin/pharmacy/pos-sales/sellers",
        operationId: "getAdminPosSalesSellers",
        summary: "Liste de tous les vendeurs/caissiers (Admin)",
        security: [["bearerAuth" => []]],
        tags: ["Historique des Ventes (Admin)"]
    )]
    #[OA\Response(response: 200, description: "Liste des vendeurs récupérée avec succès")]
    public function sellers()
    {
        $hospitalId = $this->getHospitalId();
        
        $sellers = User::whereHas('profile_pharm', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->get(['id', 'first_name', 'last_name']);

        return response()->json($sellers, 200);
    }
}
