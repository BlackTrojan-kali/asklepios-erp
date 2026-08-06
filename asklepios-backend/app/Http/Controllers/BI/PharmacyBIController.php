<?php

namespace App\Http\Controllers\BI;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Pharmacy BI & Reporting", description: "Tableaux de bord consolidés pour le DG et rapports de conformité MINSANTE")]

class PharmacyBIController extends Controller
{
    /**
     * Sécurisation des données par Hôpital (Tenant)
     */
    private function getHospitalId()
    {
        $user = auth()->user();
        if ($user->profile_admin) return $user->profile_admin->hospital_id;
        if ($user->profile_ceo) return $user->profile_ceo->hospital_id; // Profil hypothétique du gérant
        abort(403, "Accès refusé. Réservé à la direction et à l'administration.");
    }

    /**
     * Applique les filtres globaux (Dates, Centre, Succursale) à une requête Eloquent ou QueryBuilder
     */
    private function applyFilters($query, Request $request, $dateColumn = 'created_at', $branchColumn = 'pharmacy_branch_id')
    {
        if ($request->filled('start_date')) {
            $query->whereDate($dateColumn, '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate($dateColumn, '<=', $request->end_date);
        }
        if ($request->filled('pharmacy_branch_id')) {
            $query->where($branchColumn, $request->pharmacy_branch_id);
        } elseif ($request->filled('center_id')) {
            // Filtrer par centre médical (qui contient plusieurs succursales)
            $query->whereIn($branchColumn, function($q) use ($request) {
                $q->select('id')->from('pharmacy_branches')
                  ->where('center_id', $request->center_id)
                  ->where('hospital_id', $this->getHospitalId());
            });
        }

        return $query;
    }

    #[OA\Get(path: "/api/pharmacy/bi/kpis", summary: "KPIs Globaux (CA, Marges, Panier Moyen)", security: [["sanctum" => []]])]
  #[OA\Response(response: 200, description: "Données récupérées avec succès")]
    
    public function getGlobalKPIs(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        // 1. Requête de base sur les ventes
        $salesQuery = DB::table('pos_sales')
            ->join('pharmacy_branches', 'pos_sales.pharmacy_branch_id', '=', 'pharmacy_branches.id')
            ->where('pharmacy_branches.hospital_id', $hospitalId);
        
        $salesQuery = $this->applyFilters($salesQuery, $request, 'pos_sales.created_at', 'pos_sales.pharmacy_branch_id');

        // Total CA & Panier Moyen
        $salesData = (clone $salesQuery)->select(
            DB::raw('COUNT(pos_sales.id) as total_transactions'),
            DB::raw('SUM(pos_sales.total_amount) as total_revenue'),
            DB::raw('AVG(pos_sales.total_amount) as average_basket')
        )->first();

        // 2. Calcul des Marges (via les lignes de ventes et les lots)
        $marginQuery = DB::table('pos_sale_items')
            ->join('pos_sales', 'pos_sale_items.pos_sale_id', '=', 'pos_sales.id')
            ->join('pharmacy_branches', 'pos_sales.pharmacy_branch_id', '=', 'pharmacy_branches.id')
            ->leftJoin('batches', 'pos_sale_items.batch_id', '=', 'batches.id')
            ->where('pharmacy_branches.hospital_id', $hospitalId);

        $marginQuery = $this->applyFilters($marginQuery, $request, 'pos_sales.created_at', 'pos_sales.pharmacy_branch_id');

        $marginData = $marginQuery->select(
            DB::raw('SUM(pos_sale_items.sub_total) as total_selling_value'),
            DB::raw('SUM(pos_sale_items.qty * COALESCE(batches.purchase_price, 0)) as total_purchase_cost')
        )->first();

        $grossMargin = $marginData->total_selling_value - $marginData->total_purchase_cost;
        $marginPercentage = $marginData->total_selling_value > 0 ? ($grossMargin / $marginData->total_selling_value) * 100 : 0;

        return response()->json([
            'total_revenue'        => (float) $salesData->total_revenue,
            'total_transactions'   => (int) $salesData->total_transactions,
            'average_basket'       => (float) $salesData->average_basket,
            'gross_margin'         => (float) $grossMargin,
            'margin_percentage'    => round($marginPercentage, 2)
        ]);
    }

    #[OA\Get(path: "/api/pharmacy/bi/sales-analytics", summary: "Analyse détaillée des ventes", security: [["sanctum" => []]])]
     #[OA\Response(response: 200, description: "Données récupérées avec succès")]
    public function getSalesAnalytics(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        // 1. Tendance des ventes (Quotidienne ou Mensuelle)
        $groupBy = $request->input('group_by', 'date'); // 'date' ou 'month'
        $dateFormat = $groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';

        $trendsQuery = DB::table('pos_sales')
            ->join('pharmacy_branches', 'pos_sales.pharmacy_branch_id', '=', 'pharmacy_branches.id')
            ->where('pharmacy_branches.hospital_id', $hospitalId);
        
        $trendsQuery = $this->applyFilters($trendsQuery, $request, 'pos_sales.created_at', 'pos_sales.pharmacy_branch_id');

        $salesTrends = $trendsQuery->select(
            DB::raw("DATE_FORMAT(pos_sales.created_at, '{$dateFormat}') as period"),
            DB::raw('SUM(pos_sales.total_amount) as revenue'),
            DB::raw('COUNT(pos_sales.id) as transactions')
        )->groupBy('period')->orderBy('period', 'asc')->get();

        // 2. CA par mode de paiement
        $paymentMethods = (clone $trendsQuery)->select(
            'pos_sales.payment_method',
            DB::raw('SUM(pos_sales.total_amount) as revenue'),
            DB::raw('COUNT(pos_sales.id) as count')
        )->groupBy('pos_sales.payment_method')->get();

        // 3. MINSANTE : Ventes sous ordonnance vs Ventes libres
        $prescriptionRatio = (clone $trendsQuery)->select(
            DB::raw('SUM(CASE WHEN pos_sales.has_prescription = 1 THEN pos_sales.total_amount ELSE 0 END) as prescription_revenue'),
            DB::raw('SUM(CASE WHEN pos_sales.has_prescription = 0 THEN pos_sales.total_amount ELSE 0 END) as otc_revenue')
        )->first();

        // 4. Top 10 Articles les plus vendus (en valeur)
        $topArticlesQuery = DB::table('pos_sale_items')
            ->join('pos_sales', 'pos_sale_items.pos_sale_id', '=', 'pos_sales.id')
            ->join('pharmacy_branches', 'pos_sales.pharmacy_branch_id', '=', 'pharmacy_branches.id')
            ->join('articles', 'pos_sale_items.article_id', '=', 'articles.id')
            ->join('article_categories', 'articles.category_id', '=', 'article_categories.id')
            ->where('pharmacy_branches.hospital_id', $hospitalId);

        $topArticlesQuery = $this->applyFilters($topArticlesQuery, $request, 'pos_sales.created_at', 'pos_sales.pharmacy_branch_id');

        $topArticles = $topArticlesQuery->select(
            'articles.name as article_name',
            'article_categories.name as category_name',
            DB::raw('SUM(pos_sale_items.qty) as total_qty'),
            DB::raw('SUM(pos_sale_items.sub_total) as total_revenue')
        )->groupBy('articles.id', 'articles.name', 'article_categories.name')
         ->orderByDesc('total_revenue')
         ->limit(10)
         ->get();

        return response()->json([
            'sales_trends'       => $salesTrends,
            'payment_methods'    => $paymentMethods,
            'prescription_ratio' => $prescriptionRatio,
            'top_articles'       => $topArticles
        ]);
    }

    #[OA\Get(path: "/api/pharmacy/bi/inventory-valuation", summary: "Valorisation des stocks en temps réel", security: [["sanctum" => []]])]
     #[OA\Response(response: 200, description: "Données récupérées avec succès")]
    public function getInventoryValuation(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        // Technique pour récupérer le stock ACTUEL : Le dernier mouvement enregistré par Succursale/Lot
        $latestMovements = DB::table('stock_movements')
            ->select('pharmacy_branch_id', 'batch_id', DB::raw('MAX(id) as max_id'))
            ->groupBy('pharmacy_branch_id', 'batch_id');

        $currentStockQuery = DB::table('stock_movements as sm')
            ->joinSub($latestMovements, 'latest', function ($join) {
                $join->on('sm.id', '=', 'latest.max_id');
            })
            ->join('pharmacy_branches', 'sm.pharmacy_branch_id', '=', 'pharmacy_branches.id')
            ->join('batches', 'sm.batch_id', '=', 'batches.id')
            ->join('articles', 'batches.article_id', '=', 'articles.id')
            ->join('article_categories', 'articles.category_id', '=', 'article_categories.id')
            ->where('pharmacy_branches.hospital_id', $hospitalId)
            ->where('sm.qty_in_stock', '>', 0); // On ne valorise que ce qui est en stock
            
        // Si le filtre demande un centre ou une succursale spécifique
        if ($request->filled('pharmacy_branch_id')) {
            $currentStockQuery->where('sm.pharmacy_branch_id', $request->pharmacy_branch_id);
        }

        // 1. Valorisation Globale
        $valuation = (clone $currentStockQuery)->select(
            DB::raw('SUM(sm.qty_in_stock * batches.purchase_price) as total_purchase_value'),
            DB::raw('SUM(sm.qty_in_stock * articles.default_selling_price) as total_selling_value')
        )->first();

        // 2. Valorisation par Catégorie
        $valuationByCategory = (clone $currentStockQuery)->select(
            'article_categories.name as category_name',
            DB::raw('SUM(sm.qty_in_stock) as total_items'),
            DB::raw('SUM(sm.qty_in_stock * batches.purchase_price) as purchase_value')
        )->groupBy('article_categories.name')->get();

        return response()->json([
            'total_purchase_value' => (float) $valuation->total_purchase_value,
            'total_selling_value'  => (float) $valuation->total_selling_value,
            'potential_profit'     => (float) ($valuation->total_selling_value - $valuation->total_purchase_value),
            'by_category'          => $valuationByCategory
        ]);
    }

    #[OA\Get(path: "/api/pharmacy/bi/minsante-compliance", summary: "Rapports de conformité MINSANTE (Péremptions & Ruptures)", security: [["sanctum" => []]])]
    #[OA\Response(response: 200, description: "Données récupérées avec succès")]
    public function getMinsanteCompliance(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        // SOUS-REQUÊTE : Obtenir les quantités actuellement en stock
        $latestMovements = DB::table('stock_movements')
            ->select('pharmacy_branch_id', 'batch_id', DB::raw('MAX(id) as max_id'))
            ->groupBy('pharmacy_branch_id', 'batch_id');

        $activeStockBase = DB::table('stock_movements as sm')
            ->joinSub($latestMovements, 'latest', function ($join) {
                $join->on('sm.id', '=', 'latest.max_id');
            })
            ->join('pharmacy_branches', 'sm.pharmacy_branch_id', '=', 'pharmacy_branches.id')
            ->join('batches', 'sm.batch_id', '=', 'batches.id')
            ->join('articles', 'batches.article_id', '=', 'articles.id')
            ->where('pharmacy_branches.hospital_id', $hospitalId)
            ->where('sm.qty_in_stock', '>', 0);

        if ($request->filled('pharmacy_branch_id')) {
            $activeStockBase->where('sm.pharmacy_branch_id', $request->pharmacy_branch_id);
        }

        // 1. GESTION DES PÉREMPTIONS (Lots expirant dans les 6 prochains mois)
        $sixMonthsFromNow = Carbon::now()->addMonths(6)->toDateString();
        $today = Carbon::now()->toDateString();

        $expiringBatches = (clone $activeStockBase)
            ->select(
                'pharmacy_branches.name as branch_name',
                'articles.name as article_name',
                'batches.batch_number',
                'batches.expire_date',
                'sm.qty_in_stock'
            )
            ->whereNotNull('batches.expire_date')
            ->where('batches.expire_date', '<=', $sixMonthsFromNow)
            ->orderBy('batches.expire_date', 'asc')
            ->get()
            ->map(function ($item) use ($today) {
                $item->status = $item->expire_date < $today ? 'EXPIRED' : 'EXPIRING_SOON';
                return $item;
            });

        // 2. ALERTE DE RUPTURE DE STOCK (Global Min Qty)
        // Pour les alertes, on groupe par article pour toute la structure (ou par succursale)
        $stockPerArticle = (clone $activeStockBase)
            ->select(
                'articles.id',
                'articles.name',
                'articles.global_min_qty',
                DB::raw('SUM(sm.qty_in_stock) as total_qty')
            )
            ->groupBy('articles.id', 'articles.name', 'articles.global_min_qty')
            ->havingRaw('SUM(sm.qty_in_stock) <= articles.global_min_qty')
            ->get();

        return response()->json([
            'expiring_batches_count' => $expiringBatches->count(),
            'expired_batches_count'  => $expiringBatches->where('status', 'EXPIRED')->count(),
            'expiring_batches_list'  => $expiringBatches,
            'low_stock_alerts_count' => $stockPerArticle->count(),
            'low_stock_articles'     => $stockPerArticle
        ]);
    }
}