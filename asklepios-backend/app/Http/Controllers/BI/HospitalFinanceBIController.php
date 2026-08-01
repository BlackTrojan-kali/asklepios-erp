<?php

namespace App\Http\Controllers\BI;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "BI - Dashboard Finance Hôpital (CEO)", description: "Indicateurs consolidés de la facturation, des encaissements et des créances d'assurance")]
class HospitalFinanceBIController extends Controller
{
    /**
     * Applique les filtres globaux (Centre, Hôpital, Période) de manière dynamique.
     */
    private function applyGlobalFilters($query, Request $request, $dateColumn = 'invoices.created_at', $centerColumn = 'invoices.center_id')
    {
        if ($request->filled('center_id')) {
            $query->where($centerColumn, $request->center_id);
        }

        if ($request->filled('hospital_id')) {
            // Jointure pour récupérer l'hôpital via le centre
            $query->join('centers as filter_centers', clone $query->raw($centerColumn), '=', 'filter_centers.id')
                  ->where('filter_centers.hospital_id', $request->hospital_id);
        }

        if ($dateColumn && $request->filled('start_date')) {
            $query->where($dateColumn, '>=', $request->start_date . ' 00:00:00');
        }

        if ($dateColumn && $request->filled('end_date')) {
            $query->where($dateColumn, '<=', $request->end_date . ' 23:59:59');
        }

        return $query;
    }

    #[OA\Get(path: "/api/bi/hospital-finance/kpis", summary: "KPIs Financiers de l'hôpital", security: [["sanctum" => []]])]
    public function getKPIs(Request $request)
    {
        // 1. Total Facturé (Ce que l'hôpital a produit comme valeur)
        $invoicesQuery = DB::table('invoices');
        $invoicesQuery = $this->applyGlobalFilters($invoicesQuery, $request, 'invoices.created_at', 'invoices.center_id');
        $totalInvoiced = (clone $invoicesQuery)->sum('total_amount');

        // 2. Total Encaissé (Ce qui est réellement entré en caisse via les reçus)
        $paymentsQuery = DB::table('payment_invoices')
            ->join('invoices', 'payment_invoices.invoice_id', '=', 'invoices.id');
        $paymentsQuery = $this->applyGlobalFilters($paymentsQuery, $request, 'payment_invoices.created_at', 'invoices.center_id');
        $totalCollected = (clone $paymentsQuery)->sum('payment_invoices.amount');

        // 3. Répartition Patient vs Assurance (Via les parts de factures)
        $splitsQuery = DB::table('invoice_splits')
            ->join('invoices', 'invoice_splits.invoice_id', '=', 'invoices.id');
        $splitsQuery = $this->applyGlobalFilters($splitsQuery, $request, 'invoices.created_at', 'invoices.center_id');

        $patientExpected = (clone $splitsQuery)->where('type', 'PATIENT')->sum('amount_to_pay');
        $insuranceExpected = (clone $splitsQuery)->where('type', 'INSURANCE')->sum('amount_to_pay');
        
        // 4. Total des impayés (Reste à recouvrer : Patients + Assurances)
        $totalOutstanding = (clone $splitsQuery)->where('invoice_splits.status', 'UNPAID')->sum('amount_to_pay');

        return response()->json([
            'total_invoiced' => round($totalInvoiced, 2),
            'total_collected' => round($totalCollected, 2),
            'total_outstanding' => round($totalOutstanding, 2),
            'patient_expected_share' => round($patientExpected, 2),
            'insurance_expected_share' => round($insuranceExpected, 2),
            'collection_rate' => $totalInvoiced > 0 ? round(($totalCollected / $totalInvoiced) * 100, 2) : 0,
        ]);
    }

    #[OA\Get(path: "/api/bi/hospital-finance/revenue-trends", summary: "Tendances des encaissements journaliers", security: [["sanctum" => []]])]
    public function getRevenueTrends(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $query = DB::table('payment_invoices')
            ->join('invoices', 'payment_invoices.invoice_id', '=', 'invoices.id');
        
        $query = $this->applyGlobalFilters($query, $request, 'payment_invoices.created_at', 'invoices.center_id');

        $data = $query->select(
                DB::raw('DATE(payment_invoices.created_at) as date'),
                DB::raw('SUM(payment_invoices.amount) as daily_revenue')
            )
            ->groupBy(DB::raw('DATE(payment_invoices.created_at)'))
            ->orderBy('date', 'asc')
            ->get();

        return response()->json($data);
    }

    #[OA\Get(path: "/api/bi/hospital-finance/revenue-by-service", summary: "Chiffre d'affaires réparti par service", security: [["sanctum" => []]])]
    public function getRevenueByService(Request $request)
    {
        $query = DB::table('invoice_lines')
            ->join('invoices', 'invoice_lines.invoice_id', '=', 'invoices.id');

        $query = $this->applyGlobalFilters($query, $request, 'invoices.created_at', 'invoices.center_id');

        // Utilisation du CASE WHEN pour catégoriser la ligne de facture selon la foreign key remplie
        $data = $query->select(
                DB::raw("CASE 
                    WHEN invoice_lines.consultation_id IS NOT NULL THEN 'Consultations'
                    WHEN invoice_lines.admission_id IS NOT NULL THEN 'Admissions & Hospitalisation'
                    WHEN invoice_lines.lab_request_id IS NOT NULL THEN 'Laboratoire & Analyses'
                    ELSE 'Autres Services' 
                END as service_name"),
                DB::raw('SUM(invoice_lines.unit_price) as revenue')
            )
            ->groupBy('service_name')
            ->orderByDesc('revenue')
            ->get();

        return response()->json($data);
    }

    #[OA\Get(path: "/api/bi/hospital-finance/payment-methods", summary: "Répartition des encaissements par méthode de paiement", security: [["sanctum" => []]])]
    public function getPaymentMethods(Request $request)
    {
        $query = DB::table('payment_invoices')
            ->join('invoices', 'payment_invoices.invoice_id', '=', 'invoices.id');

        $query = $this->applyGlobalFilters($query, $request, 'payment_invoices.created_at', 'invoices.center_id');

        $data = $query->select(
                'payment_invoices.payment_method as name',
                DB::raw('SUM(payment_invoices.amount) as value')
            )
            ->groupBy('payment_invoices.payment_method')
            ->orderByDesc('value')
            ->get();

        return response()->json($data);
    }

    #[OA\Get(path: "/api/bi/hospital-finance/insurance-claims", summary: "Statut des réclamations auprès des assurances", security: [["sanctum" => []]])]
    public function getInsuranceClaims(Request $request)
    {
        $query = DB::table('guarantor_claims')
            ->join('insurance_companies', 'guarantor_claims.insurance_company_id', '=', 'insurance_companies.id');

        $query = $this->applyGlobalFilters($query, $request, 'guarantor_claims.created_at', 'guarantor_claims.center_id');

        // On récupère le montant réclamé par assurance et par statut
        $data = $query->select(
                'insurance_companies.name as insurance_name',
                'guarantor_claims.status',
                DB::raw('SUM(guarantor_claims.total_claim_amount) as total_amount')
            )
            ->groupBy('insurance_companies.name', 'guarantor_claims.status')
            ->orderByDesc('total_amount')
            ->get();

        // Formatage de la donnée pour qu'elle soit facile à utiliser dans un graphique Stacked Bar
        // [{ insurance_name: 'AXA', DRAFT: 50000, SUBMITTED: 150000, PAID: 200000, DISPUTED: 0 }, ...]
        $formatted = [];
        foreach ($data as $row) {
            $name = $row->insurance_name;
            if (!isset($formatted[$name])) {
                $formatted[$name] = [
                    'insurance_name' => $name,
                    'DRAFT' => 0,
                    'SUBMITTED' => 0,
                    'PAID' => 0,
                    'DISPUTED' => 0
                ];
            }
            $formatted[$name][$row->status] = round($row->total_amount, 2);
        }

        // Transformer le dictionnaire en tableau indexé
        return response()->json(array_values($formatted));
    }
}