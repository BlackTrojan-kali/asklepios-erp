<?php

namespace App\Http\Controllers\BI;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "BI - Dashboard Laboratoire (CEO)", description: "Indicateurs consolidés de l'activité, de la rentabilité et de la qualité du laboratoire")]
class LabActivityBIController extends Controller
{
    /**
     * Applique les filtres globaux (Laboratoire, Hôpital, Période) de manière dynamique.
     */
    private function applyGlobalFilters($query, Request $request, $dateColumn = 'lab_requests.created_at', $labColumn = 'lab_requests.laboratory_id')
    {
        if ($request->filled('laboratory_id')) {
            $query->where($labColumn, $request->laboratory_id);
        }

        if ($request->filled('hospital_id')) {
            // Jointure pour récupérer l'hôpital via le laboratoire
            $query->join('laboratories as filter_labs', clone $query->raw($labColumn), '=', 'filter_labs.id')
                  ->where('filter_labs.hospital_id', $request->hospital_id);
        }

        if ($dateColumn && $request->filled('start_date')) {
            $query->where($dateColumn, '>=', $request->start_date . ' 00:00:00');
        }

        if ($dateColumn && $request->filled('end_date')) {
            $query->where($dateColumn, '<=', $request->end_date . ' 23:59:59');
        }

        return $query;
    }

    #[OA\Get(path: "/api/bi/laboratory/kpis", summary: "KPIs globaux du laboratoire", security: [["sanctum" => []]])]
    public function getKPIs(Request $request)
    {
        // 1. Total des requêtes (dossiers labo)
        $requestsQuery = DB::table('lab_requests');
        $requestsQuery = $this->applyGlobalFilters($requestsQuery, $request, 'lab_requests.created_at', 'lab_requests.laboratory_id');
        $totalRequests = (clone $requestsQuery)->count();

        // 2. Chiffre d'affaires théorique généré par le Labo
        $revenueQuery = DB::table('lab_request_lines')
            ->join('lab_requests', 'lab_request_lines.lab_request_id', '=', 'lab_requests.id')
            ->join('lab_tests', 'lab_request_lines.lab_test_id', '=', 'lab_tests.id');
        $revenueQuery = $this->applyGlobalFilters($revenueQuery, $request, 'lab_requests.created_at', 'lab_requests.laboratory_id');
        $totalRevenue = (clone $revenueQuery)->sum('lab_tests.price');

        // 3. Qualité : Taux de prélèvements rejetés (Hémolyse, etc.)
        $samplesQuery = DB::table('lab_samples')
            ->join('lab_requests', 'lab_samples.lab_request_id', '=', 'lab_requests.id');
        $samplesQuery = $this->applyGlobalFilters($samplesQuery, $request, 'lab_samples.created_at', 'lab_requests.laboratory_id');
        
        $totalSamples = (clone $samplesQuery)->count();
        $rejectedSamples = (clone $samplesQuery)->where('lab_samples.status', 'REJECTED_HEMOLYSIS')->count();
        $rejectionRate = $totalSamples > 0 ? round(($rejectedSamples / $totalSamples) * 100, 2) : 0;

        // 4. Clinique : Taux de résultats anormaux
        $resultsQuery = DB::table('lab_results')
            ->join('lab_request_lines', 'lab_results.lab_request_line_id', '=', 'lab_request_lines.id')
            ->join('lab_requests', 'lab_request_lines.lab_request_id', '=', 'lab_requests.id')
            ->where('lab_results.status', 'VALIDATED');
        $resultsQuery = $this->applyGlobalFilters($resultsQuery, $request, 'lab_results.created_at', 'lab_requests.laboratory_id');
        
        $totalResults = (clone $resultsQuery)->count();
        $abnormalResults = (clone $resultsQuery)->where('lab_results.is_abnormal', true)->count();
        $abnormalRate = $totalResults > 0 ? round(($abnormalResults / $totalResults) * 100, 2) : 0;

        return response()->json([
            'total_requests' => $totalRequests,
            'total_revenue' => round($totalRevenue, 2),
            'total_samples' => $totalSamples,
            'rejection_rate' => $rejectionRate, // KPI Qualité pré-analytique
            'abnormal_rate' => $abnormalRate,   // KPI Clinique
        ]);
    }

    #[OA\Get(path: "/api/bi/laboratory/request-trends", summary: "Évolution journalière des demandes d'analyses", security: [["sanctum" => []]])]
    public function getRequestTrends(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $query = DB::table('lab_requests');
        $query = $this->applyGlobalFilters($query, $request, 'lab_requests.created_at', 'lab_requests.laboratory_id');

        $data = $query->select(
                DB::raw('DATE(lab_requests.created_at) as date'),
                DB::raw('COUNT(id) as total_requests')
            )
            ->groupBy(DB::raw('DATE(lab_requests.created_at)'))
            ->orderBy('date', 'asc')
            ->get();

        return response()->json($data);
    }

    #[OA\Get(path: "/api/bi/laboratory/top-tests", summary: "Palmarès des examens les plus prescrits et rentables", security: [["sanctum" => []]])]
    public function getTopTests(Request $request)
    {
        $query = DB::table('lab_request_lines')
            ->join('lab_requests', 'lab_request_lines.lab_request_id', '=', 'lab_requests.id')
            ->join('lab_tests', 'lab_request_lines.lab_test_id', '=', 'lab_tests.id')
            ->join('lab_categories', 'lab_tests.lab_category_id', '=', 'lab_categories.id');

        $query = $this->applyGlobalFilters($query, $request, 'lab_requests.created_at', 'lab_requests.laboratory_id');

        $data = $query->select(
                'lab_tests.name as test_name',
                'lab_tests.code as test_code',
                'lab_categories.name as category_name',
                DB::raw('COUNT(lab_request_lines.id) as total_performed'),
                DB::raw('SUM(lab_tests.price) as total_revenue')
            )
            ->groupBy('lab_tests.id', 'lab_tests.name', 'lab_tests.code', 'lab_categories.name')
            ->orderByDesc('total_revenue')
            ->limit(15) // Top 15
            ->get();

        return response()->json($data);
    }

    #[OA\Get(path: "/api/bi/laboratory/revenue-by-category", summary: "Chiffre d'affaires par catégorie d'analyse (Hématologie, Biochimie, etc.)", security: [["sanctum" => []]])]
    public function getRevenueByCategory(Request $request)
    {
        $query = DB::table('lab_request_lines')
            ->join('lab_requests', 'lab_request_lines.lab_request_id', '=', 'lab_requests.id')
            ->join('lab_tests', 'lab_request_lines.lab_test_id', '=', 'lab_tests.id')
            ->join('lab_categories', 'lab_tests.lab_category_id', '=', 'lab_categories.id');

        $query = $this->applyGlobalFilters($query, $request, 'lab_requests.created_at', 'lab_requests.laboratory_id');

        $data = $query->select(
                'lab_categories.name as category_name',
                DB::raw('SUM(lab_tests.price) as revenue'),
                DB::raw('COUNT(lab_request_lines.id) as volume')
            )
            ->groupBy('lab_categories.id', 'lab_categories.name')
            ->orderByDesc('revenue')
            ->get();

        return response()->json($data);
    }

    #[OA\Get(path: "/api/bi/laboratory/sample-quality", summary: "Répartition des prélèvements par statut (Qualité)", security: [["sanctum" => []]])]
    public function getSampleQuality(Request $request)
    {
        $query = DB::table('lab_samples')
            ->join('lab_requests', 'lab_samples.lab_request_id', '=', 'lab_requests.id');

        $query = $this->applyGlobalFilters($query, $request, 'lab_samples.created_at', 'lab_requests.laboratory_id');

        $data = $query->select(
                'lab_samples.status as name',
                DB::raw('COUNT(lab_samples.id) as value')
            )
            ->groupBy('lab_samples.status')
            ->get();

        return response()->json($data);
    }
}