<?php

namespace App\Http\Controllers\BI;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;
use Carbon\Carbon;

#[OA\Tag(name: "BI - Dashboard Finance (CEO)", description: "Indicateurs consolidés pour la finance et les ventes en pharmacie")]
class FinanceBIController extends Controller
{
    /**
     * Applique les filtres globaux (Pharmacie, Hôpital, Période) de manière dynamique.
     */
    private function applyGlobalFilters($query, Request $request, $dateColumn = 'created_at', $pharmacyColumn = 'pharmacy_branch_id')
    {
        if ($request->filled('pharmacy_branch_id')) {
            $query->where($pharmacyColumn, $request->pharmacy_branch_id);
        }

        if ($request->filled('hospital_id')) {
            // Jointure sécurisée avec alias pour trouver l'hôpital via la pharmacie
            $query->join('pharmacy_branches as filter_pb', clone $query->raw($pharmacyColumn), '=', 'filter_pb.id')
                  ->where('filter_pb.hospital_id', $request->hospital_id);
        }

        if ($dateColumn && $request->filled('start_date')) {
            $query->where($dateColumn, '>=', $request->start_date . ' 00:00:00');
        }

        if ($dateColumn && $request->filled('end_date')) {
            $query->where($dateColumn, '<=', $request->end_date . ' 23:59:59');
        }

        return $query;
    }

    #[OA\Get(path: "/api/bi/finance/kpis", summary: "KPIs financiers globaux", security: [["sanctum" => []]])]
#[OA\Response(response: 200, description: "élément Recupere avec success")]
    public function getKPIs(Request $request)
    {
        // 1. Ventes (Chiffre d'affaires & Panier moyen)
        $salesQuery = DB::table('pos_sales');
        $salesQuery = $this->applyGlobalFilters($salesQuery, $request, 'pos_sales.created_at', 'pos_sales.pharmacy_branch_id');

        $salesStats = (clone $salesQuery)->select(
            DB::raw('COALESCE(SUM(total_amount), 0) as total_revenue'),
            DB::raw('COUNT(id) as total_sales')
        )->first();

        $totalRevenue = $salesStats->total_revenue;
        $totalSales = $salesStats->total_sales;
        $averageBasket = $totalSales > 0 ? ($totalRevenue / $totalSales) : 0;

        // 2. Trésorerie Actuelle (Solde total des comptes actifs - Indépendant de la période)
        $accountsQuery = DB::table('payment_accounts')->where('status', 'active');
        
        if ($request->filled('pharmacy_branch_id')) {
            $accountsQuery->where('pharmacy_branch_id', $request->pharmacy_branch_id);
        }
        if ($request->filled('hospital_id')) {
            $accountsQuery->join('pharmacy_branches as pb', 'payment_accounts.pharmacy_branch_id', '=', 'pb.id')
                          ->where('pb.hospital_id', $request->hospital_id);
        }
        $totalTreasury = $accountsQuery->sum('balance');

        return response()->json([
            'total_revenue' => round($totalRevenue, 2),
            'total_sales' => $totalSales,
            'average_basket' => round($averageBasket, 2),
            'total_treasury' => round($totalTreasury, 2),
        ]);
    }

    #[OA\Get(path: "/api/bi/finance/revenue-trends", summary: "Tendance du Chiffre d'Affaires", security: [["sanctum" => []]])]
#[OA\Response(response: 200, description: "élément Recupere avec success")]
    public function getRevenueTrends(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $query = DB::table('pos_sales');
        $query = $this->applyGlobalFilters($query, $request, 'pos_sales.created_at', 'pos_sales.pharmacy_branch_id');

        $data = $query->select(
                DB::raw('DATE(pos_sales.created_at) as date'),
                DB::raw('SUM(total_amount) as daily_revenue')
            )
            ->groupBy(DB::raw('DATE(pos_sales.created_at)'))
            ->orderBy('date', 'asc')
            ->get();

        return response()->json($data);
    }

    #[OA\Get(path: "/api/bi/finance/revenue-by-payment-method", summary: "CA par Mode de Paiement", security: [["sanctum" => []]])]
#[OA\Response(response: 200, description: "élément Recupere avec success")]
    public function getRevenueByPaymentMethod(Request $request)
    {
        $query = DB::table('pos_sales');
        $query = $this->applyGlobalFilters($query, $request, 'pos_sales.created_at', 'pos_sales.pharmacy_branch_id');

        $data = $query->select(
                'payment_method as name',
                DB::raw('SUM(total_amount) as value')
            )
            ->groupBy('payment_method')
            ->orderByDesc('value')
            ->get();

        return response()->json($data);
    }

    #[OA\Get(path: "/api/bi/finance/revenue-by-category", summary: "CA généré par catégorie de produits", security: [["sanctum" => []]])]
#[OA\Response(response: 200, description: "élément Recupere avec success")]
    public function getRevenueByCategory(Request $request)
    {
        $query = DB::table('pos_sale_items')
            ->join('pos_sales', 'pos_sale_items.pos_sale_id', '=', 'pos_sales.id')
            ->join('articles', 'pos_sale_items.article_id', '=', 'articles.id')
            ->join('article_categories', 'articles.category_id', '=', 'article_categories.id');

        $query = $this->applyGlobalFilters($query, $request, 'pos_sales.created_at', 'pos_sales.pharmacy_branch_id');

        $data = $query->select(
                'article_categories.name as category_name',
                DB::raw('SUM(pos_sale_items.sub_total) as revenue')
            )
            ->groupBy('article_categories.id', 'article_categories.name')
            ->orderByDesc('revenue')
            ->get();

        return response()->json($data);
    }

    #[OA\Get(path: "/api/bi/finance/top-articles", summary: "Top des articles les plus rentables", security: [["sanctum" => []]])]
#[OA\Response(response: 200, description: "élément Recupere avec success")]
    public function getTopArticles(Request $request)
    {
        $query = DB::table('pos_sale_items')
            ->join('pos_sales', 'pos_sale_items.pos_sale_id', '=', 'pos_sales.id')
            ->join('articles', 'pos_sale_items.article_id', '=', 'articles.id');

        $query = $this->applyGlobalFilters($query, $request, 'pos_sales.created_at', 'pos_sales.pharmacy_branch_id');

        $data = $query->select(
                'articles.name as article_name',
                DB::raw('SUM(pos_sale_items.qty) as total_qty'),
                DB::raw('SUM(pos_sale_items.sub_total) as revenue')
            )
            ->groupBy('articles.id', 'articles.name')
            ->orderByDesc('revenue')
            ->limit(10) // Top 10
            ->get();

        return response()->json($data);
    }

    #[OA\Get(path: "/api/bi/finance/cash-flow", summary: "Résumé des Flux de trésorerie (hors ventes simples)", security: [["sanctum" => []]])]
#[OA\Response(response: 200, description: "élément Recupere avec success")]
    public function getCashFlow(Request $request)
    {
        $query = DB::table('payment_transactions')->where('status', 'completed');
        $query = $this->applyGlobalFilters($query, $request, 'payment_transactions.created_at', 'payment_transactions.pharmacy_branch_id');

        // On groupe par type de transaction (cash_in, cash_out, transfer)
        $data = $query->select(
                'type',
                DB::raw('SUM(amount) as total_amount')
            )
            ->groupBy('type')
            ->get();

        return response()->json($data);
    }
}