<?php

namespace App\Http\Services;

use App\Models\Hospital\Invoice;
use App\Models\Hospital\PaymentInvoice;
use App\Models\Hospital\Hospital;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class FinancialReportPdfService
{
    public function generateReport($user, $hospitalId, array $filters, string $reportType)
    {
        $hospital = Hospital::findOrFail($hospitalId);
        
        // 1. Détermination du périmètre (Centre) selon le rôle
        $centerId = null;
        $centerName = "Tous les centres";

        if ($user->profile_reception) {
            $centerId = $user->profile_reception->center_id;
            $centerName = $user->profile_reception->center->name ?? "Centre de réception";
        } elseif ($user->profile_admin && isset($filters['center_id'])) {
            $centerId = $filters['center_id'];
            // Récupérer le nom du centre pour l'affichage
            $centerName = \App\Models\Center::find($centerId)->name ?? "Centre Spécifique";
        }

        // 2. Initialisation des dates
        $startDate = isset($filters['start_date']) ? Carbon::parse($filters['start_date'])->startOfDay() : Carbon::now()->startOfMonth();
        $endDate = isset($filters['end_date']) ? Carbon::parse($filters['end_date'])->endOfDay() : Carbon::now()->endOfDay();

        // 3. Construction des données selon le type de rapport
        $data = [];
        $totals = ['amount' => 0, 'paid' => 0, 'debt' => 0];

        if ($reportType === 'INVOICES') {
            $query = Invoice::with(['patient', 'center'])->whereBetween('created_at', [$startDate, $endDate]);
            if ($centerId) $query->where('center_id', $centerId);
            
            $invoices = $query->orderBy('created_at', 'asc')->get();
            $data = $invoices;
            $totals['amount'] = $invoices->sum('total_amount');

        } elseif ($reportType === 'PAYMENTS') {
            $query = PaymentInvoice::with(['invoice.patient', 'reception.user'])->whereBetween('created_at', [$startDate, $endDate]);
            
            if ($centerId) {
                $query->whereHas('invoice', function($q) use ($centerId) {
                    $q->where('center_id', $centerId);
                });
            }
            
            $payments = $query->orderBy('created_at', 'asc')->get();
            $data = $payments;
            $totals['paid'] = $payments->sum('amount');

        } elseif ($reportType === 'DEBTS') {
            // Dettes : Factures UNPAID créées dans la période
            $query = Invoice::with(['patient', 'center', 'payments'])
                            ->where('status', 'UNPAID')
                            ->whereBetween('created_at', [$startDate, $endDate]);
            
            if ($centerId) $query->where('center_id', $centerId);
            
            $debts = $query->orderBy('created_at', 'asc')->get();
            
            // Calculer le reste à payer pour chaque facture
            foreach ($debts as $debt) {
                $paid = $debt->payments->sum('amount');
                $debt->paid_amount = $paid;
                $debt->remaining_amount = $debt->total_amount - $paid;
                
                $totals['amount'] += $debt->total_amount;
                $totals['paid'] += $paid;
                $totals['debt'] += $debt->remaining_amount;
            }
            $data = $debts;
        }

        // 4. Gestion des Logos (Base64)
        $hospitalLogoBase64 = null;
        if ($hospital->logo_url && file_exists(public_path($hospital->logo_url))) {
            $hospitalLogoBase64 = 'data:image/' . pathinfo(public_path($hospital->logo_url), PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents(public_path($hospital->logo_url)));
        }

        $asklepiosLogoBase64 = null;
        $asklepiosPath = public_path('images/asklepios_logo.png');
        if (file_exists($asklepiosPath)) {
            $asklepiosLogoBase64 = 'data:image/png;base64,' . base64_encode(file_get_contents($asklepiosPath));
        }

        // 5. Préparation de la vue
        $viewData = [
            'hospital' => $hospital,
            'hospitalLogoBase64' => $hospitalLogoBase64,
            'asklepiosLogoBase64' => $asklepiosLogoBase64,
            'reportType' => $reportType,
            'records' => $data,
            'totals' => $totals,
            'startDate' => $startDate->format('d/m/Y'),
            'endDate' => $endDate->format('d/m/Y'),
            'centerName' => $centerName,
            'generated_at' => now()->format('d/m/Y H:i'),
            'generated_by' => $user->first_name . ' ' . $user->last_name,
        ];

        $pdf = Pdf::loadView('pdf.financial_report', $viewData)->setPaper('a4', 'landscape'); // Format Paysage pour les tableaux
        
        return $pdf->download("Rapport_{$reportType}_{$startDate->format('Ymd')}.pdf");
    }
}