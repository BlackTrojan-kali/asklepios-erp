<?php

namespace App\Http\Controllers\BI;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;
use Carbon\Carbon;

#[OA\Tag(name: "BI - Dashboard Stock (CEO)", description: "Indicateurs consolidés pour la gestion des stocks (Exclusif CEO)")]
class StockBIController extends Controller
{
    /**
     * Applique les filtres globaux de la BI sur les requêtes de base.
     */
    private function applyGlobalFilters($query, Request $request, $hasStocksJoin = true)
    {
        if ($request->filled('hospital_id')) {
            $query->where('articles.hospital_id', $request->hospital_id);
        }
        
        if ($request->filled('category_id')) {
            $query->where('articles.category_id', $request->category_id);
        }

        if ($request->filled('article_id')) {
            $query->where('articles.id', $request->article_id);
        }

        // Certains graphes utilisent stock_movements au lieu de stocks
        if ($request->filled('pharmacy_branch_id')) {
            if ($hasStocksJoin) {
                $query->where('stocks.pharmacy_branch_id', $request->pharmacy_branch_id);
            } else {
                $query->where('stock_movements.pharmacy_branch_id', $request->pharmacy_branch_id);
            }
        }

        return $query;
    }

    #[OA\Get(path: "/api/bi/stock/kpis", summary: "KPIs globaux du stock", security: [["sanctum" => []]])]
    public function getKPIs(Request $request)
    {
        // 1. Valeur Totale du Stock
        $stockQuery = DB::table('stocks')
            ->join('batches', 'stocks.batch_id', '=', 'batches.id')
            ->join('articles', 'batches.article_id', '=', 'articles.id')
            ->where('stocks.qty', '>', 0);
        
        $stockQuery = $this->applyGlobalFilters($stockQuery, $request);
        $totalValue = (clone $stockQuery)->sum(DB::raw('stocks.qty * batches.purchase_price'));

        // 2. Valeur du stock expiré
        $expiredValue = (clone $stockQuery)
            ->whereNotNull('batches.expire_date')
            ->where('batches.expire_date', '<', Carbon::today())
            ->sum(DB::raw('stocks.qty * batches.purchase_price'));

        // 3. Articles en rupture ou stock critique
        $lowStockQuery = DB::table('articles')
            ->leftJoin('batches', 'articles.id', '=', 'batches.article_id')
            ->leftJoin('stocks', 'batches.id', '=', 'stocks.batch_id');
            
        $lowStockQuery = $this->applyGlobalFilters($lowStockQuery, $request);

        $lowStockCount = $lowStockQuery
            ->select('articles.id')
            ->groupBy('articles.id', 'articles.global_min_qty')
            ->havingRaw('COALESCE(SUM(stocks.qty), 0) <= articles.global_min_qty')
            ->get()
            ->count();

        return response()->json([
            'total_stock_value' => round($totalValue, 2),
            'expired_stock_value' => round($expiredValue, 2),
            'loss_percentage' => $totalValue > 0 ? round(($expiredValue / $totalValue) * 100, 2) : 0,
            'articles_in_low_stock' => $lowStockCount
        ]);
    }

    // 👉 NOUVEAU : Récupère la liste exacte des produits en rupture pour le CEO
    #[OA\Get(path: "/api/bi/stock/low-stock-details", summary: "Détails des articles en rupture ou seuil critique", security: [["sanctum" => []]])]
    public function getLowStockDetails(Request $request)
    {
        $query = DB::table('articles')
            ->leftJoin('article_categories', 'articles.category_id', '=', 'article_categories.id')
            ->leftJoin('batches', 'articles.id', '=', 'batches.article_id')
            ->leftJoin('stocks', 'batches.id', '=', 'stocks.batch_id');

        $query = $this->applyGlobalFilters($query, $request);

        $data = $query->select(
                'articles.id',
                'articles.name as article_name',
                'article_categories.name as category_name',
                'articles.global_min_qty',
                DB::raw('COALESCE(SUM(stocks.qty), 0) as current_qty')
            )
            ->groupBy('articles.id', 'articles.name', 'article_categories.name', 'articles.global_min_qty')
            ->havingRaw('COALESCE(SUM(stocks.qty), 0) <= articles.global_min_qty')
            ->orderBy('current_qty', 'asc')
            ->limit(100) // On limite pour l'affichage Dashboard
            ->get();

        return response()->json($data);
    }

    #[OA\Get(path: "/api/bi/stock/valuation-by-category", summary: "Valeur du stock par catégorie", security: [["sanctum" => []]])]
    public function getValuationByCategory(Request $request)
    {
        $query = DB::table('stocks')
            ->join('batches', 'stocks.batch_id', '=', 'batches.id')
            ->join('articles', 'batches.article_id', '=', 'articles.id')
            ->join('article_categories', 'articles.category_id', '=', 'article_categories.id')
            ->where('stocks.qty', '>', 0);

        $query = $this->applyGlobalFilters($query, $request);

        $data = $query->select(
                'article_categories.name as category_name',
                DB::raw('SUM(stocks.qty * batches.purchase_price) as total_value'),
                DB::raw('COUNT(DISTINCT articles.id) as distinct_articles')
            )
            ->groupBy('article_categories.id', 'article_categories.name')
            ->orderByDesc('total_value')
            ->get();

        return response()->json($data);
    }

    #[OA\Get(path: "/api/bi/stock/expiring-soon", summary: "Top des lots expirant bientôt", security: [["sanctum" => []]])]
    #[OA\Get(path: "/api/bi/stock/expiring-soon", summary: "Top des lots expirant bientôt", security: [["sanctum" => []]])]
    public function getExpiringSoon(Request $request)
    {
        // 👉 CORRECTION ICI : Utilisation de integer() au lieu de query() pour forcer le type
        $days = $request->integer('days', 90);
        $thresholdDate = Carbon::today()->addDays($days);

        $query = DB::table('stocks')
            ->join('batches', 'stocks.batch_id', '=', 'batches.id')
            ->join('articles', 'batches.article_id', '=', 'articles.id')
            ->join('pharmacy_branches', 'stocks.pharmacy_branch_id', '=', 'pharmacy_branches.id')
            ->where('stocks.qty', '>', 0)
            ->whereNotNull('batches.expire_date')
            ->where('batches.expire_date', '>=', Carbon::today())
            ->where('batches.expire_date', '<=', $thresholdDate);

        $query = $this->applyGlobalFilters($query, $request);

        $data = $query->select(
                'articles.name as article_name',
                'batches.batch_number',
                'pharmacy_branches.name as pharmacy_name',
                'stocks.qty',
                'batches.expire_date',
                DB::raw('stocks.qty * batches.purchase_price as risk_value')
            )
            ->orderBy('batches.expire_date', 'asc')
            ->limit(50)
            ->get();

        return response()->json($data);
    }

    #[OA\Get(path: "/api/bi/stock/movement-trends", summary: "Tendances des entrées/sorties", security: [["sanctum" => []]])]
    public function getMovementTrends(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $query = DB::table('stock_movements')
            ->join('batches', 'stock_movements.batch_id', '=', 'batches.id')
            ->join('articles', 'batches.article_id', '=', 'articles.id')
            ->whereNull('stock_movements.deleted_at')
            ->whereBetween('stock_movements.created_at', [
                $request->start_date . ' 00:00:00', 
                $request->end_date . ' 23:59:59'
            ]);

        // Appel aux filtres avec paramètre $hasStocksJoin à false car on est sur stock_movements
        $query = $this->applyGlobalFilters($query, $request, false);

        $data = $query->select(
                DB::raw('DATE(stock_movements.created_at) as date'),
                'stock_movements.type',
                DB::raw('SUM(stock_movements.qty * batches.purchase_price) as total_value')
            )
            ->groupBy(DB::raw('DATE(stock_movements.created_at)'), 'stock_movements.type')
            ->orderBy('date', 'asc')
            ->get();

        $formattedData = [];
        foreach ($data as $row) {
            $date = $row->date;
            if (!isset($formattedData[$date])) {
                $formattedData[$date] = ['date' => $date, 'ENTRY' => 0, 'EXIT' => 0];
            }
            $formattedData[$date][$row->type] = round($row->total_value, 2);
        }

        return response()->json(array_values($formattedData));
    }
}