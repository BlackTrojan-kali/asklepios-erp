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
    public function generateInvoicesReportPdf($user, array $filters)
    {
        // 1. Initialiser la requête avec les relations et les accesseurs
        // On charge 'payments' pour que $invoice->total_paid et $invoice->remaining_debt fonctionnent
        $query = Invoice::with(['patient', 'center', 'payments']);

        // 2. Gestion des droits d'accès
        if ($user->profile_reception) {
            // La réceptionniste ne voit QUE son centre
            $query->where('center_id', $user->profile_reception->center_id);
        } elseif ($user->profile_admin) {
            // L'admin peut voir tous les centres de son hôpital, ou filtrer par un centre précis
            $query->whereHas('center', function($q) use ($user) {
                $q->where('hospital_id', $user->profile_admin->hospital_id);
            });
            if (!empty($filters['center_id'])) {
                $query->where('center_id', $filters['center_id']);
            }
        }

        // 3. Application des filtres de recherche (Dates & Patient)
        if (!empty($filters['start_date'])) {
            $query->whereDate('created_at', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->whereDate('created_at', '<=', $filters['end_date']);
        }
        if (!empty($filters['patient_id'])) {
            $query->where('patient_id', $filters['patient_id']);
        }

        // Récupération des données triées
        $invoices = $query->orderBy('created_at', 'desc')->get();

        // 4. Calculs des totaux globaux pour le bas de page
        $grandTotalAmount = 0;
        $grandTotalPaid = 0;
        $grandTotalDebt = 0;

        foreach ($invoices as $invoice) {
            $grandTotalAmount += $invoice->total_amount;
            $grandTotalPaid   += $invoice->total_paid; // Utilise l'accesseur que nous avons créé !
            $grandTotalDebt   += $invoice->remaining_debt; // Utilise l'accesseur
        }

        // 5. Génération du PDF
        $pdf = Pdf::loadView('pdf.invoices_report', [
            'invoices' => $invoices,
            'filters' => $filters,
            'user' => $user,
            'generated_at' => now()->format('d/m/Y H:i'),
            'grandTotalAmount' => $grandTotalAmount,
            'grandTotalPaid' => $grandTotalPaid,
            'grandTotalDebt' => $grandTotalDebt,
            // Optionnel: Récupérer le logo si tu l'as
            'logoBase64' => $this->getLogoBase64() 
        ]);

        // Mode Paysage (Landscape) recommandé pour les tableaux avec beaucoup de colonnes
        $pdf->setPaper('A4', 'landscape'); 

        return $pdf->stream('Rapport_Factures_Creances.pdf');
    }

    private function getLogoBase64()
    {
        $path = public_path('images/asklepios_logo.png');
        if (file_exists($path)) {
            $type = pathinfo($path, PATHINFO_EXTENSION);
            $data = file_get_contents($path);
            return 'data:image/' . $type . ';base64,' . base64_encode($data);
        }
        return null;
    }
    public function generatePaymentsReportPdf($user, array $filters)
    {
        // 1. Initialiser la requête avec les relations nécessaires
        $query = PaymentInvoice::with(['invoice.patient', 'invoice.center', 'reception.user']);

        // 2. Gestion des droits d'accès
        if ($user->profile_reception) {
            // La réceptionniste ne voit QUE les paiements de son centre
            $query->whereHas('invoice', function($q) use ($user) {
                $q->where('center_id', $user->profile_reception->center_id);
            });
        } elseif ($user->profile_admin) {
            // L'admin voit tout l'hôpital
            $query->whereHas('invoice.center', function($q) use ($user) {
                $q->where('hospital_id', $user->profile_admin->hospital_id);
            });
            // S'il filtre par centre spécifique
            if (!empty($filters['center_id'])) {
                $query->whereHas('invoice', function($q) use ($filters) {
                    $q->where('center_id', $filters['center_id']);
                });
            }
        }

        // 3. Application des filtres
        if (!empty($filters['start_date'])) {
            $query->whereDate('created_at', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->whereDate('created_at', '<=', $filters['end_date']);
        }
        if (!empty($filters['payment_method'])) {
            $query->where('payment_method', $filters['payment_method']);
        }
        if (!empty($filters['patient_id'])) {
            $query->whereHas('invoice', function($q) use ($filters) {
                $q->where('patient_id', $filters['patient_id']);
            });
        }

        // Récupération des données triées par date (les plus récentes en haut)
        $payments = $query->orderBy('created_at', 'desc')->get();

        // 4. Calculs des totaux
        $grandTotal = 0;
        $totalsByMethod = []; // Pour le récapitulatif (ex: 5000 en CASH, 10000 en MOBILE_MONEY)

        foreach ($payments as $payment) {
            $grandTotal += $payment->amount;
            
            $method = $payment->payment_method;
            if (!isset($totalsByMethod[$method])) {
                $totalsByMethod[$method] = 0;
            }
            $totalsByMethod[$method] += $payment->amount;
        }

        // 5. Génération du PDF
        $pdf = Pdf::loadView('pdf.payments_report', [
            'payments'       => $payments,
            'filters'        => $filters,
            'user'           => $user,
            'generated_at'   => now()->format('d/m/Y H:i'),
            'grandTotal'     => $grandTotal,
            'totalsByMethod' => $totalsByMethod,
            'logoBase64'     => $this->getLogoBase64()
        ]);

        return $pdf->stream('Rapport_Encaissements.pdf');
    }
}