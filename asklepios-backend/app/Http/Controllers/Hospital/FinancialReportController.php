<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Http\Services\FinancialReportPdfService;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class FinancialReportController extends Controller
{
    protected $reportService;

    public function __construct(FinancialReportPdfService $reportService)
    {
        $this->reportService = $reportService;
    }

    private function getHospitalId()
    {
        $user = auth()->user();
        if ($user->profile_admin) return $user->profile_admin->hospital_id;
        if ($user->profile_reception) return $user->profile_reception->hospital_id;
        abort(403, "Accès refusé.");
    }

    #[OA\Get(
        path: "/api/shared/reports/finance",
        summary: "Générer un rapport financier PDF",
        description: "Génère un PDF selon le type: INVOICES (Factures), PAYMENTS (Encaissements) ou DEBTS (Créances).",
        security: [["sanctum" => []]],
        tags: ["Facturation"]
    )]
    
    #[OA\Response(response: 200, description: "élément généré avec succès")]
    public function generateReport(Request $request)
    {
        $request->validate([
            'report_type' => 'required|in:INVOICES,PAYMENTS,DEBTS',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date|after_or_equal:start_date',
            'center_id'   => 'nullable|exists:centers,id'
        ]);

        $hospitalId = $this->getHospitalId();
        $user = auth()->user();

        // Si l'utilisateur est un docteur, on bloque l'accès aux rapports financiers globaux
        if ($user->profile_doctor) {
            abort(403, "Les médecins n'ont pas accès aux rapports financiers consolidés.");
        }

        return $this->reportService->generateReport(
            $user, 
            $hospitalId, 
            $request->only(['start_date', 'end_date', 'center_id']), 
            $request->report_type
        );
    }
}