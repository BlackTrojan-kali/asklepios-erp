<?php

namespace App\Http\Services;

use App\Models\Hospital\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoicePdfService
{
    /**
     * Construit le fichier PDF de la facture patient
     */
    public function generateInvoicePdf(int $invoiceId, string $action = 'stream')
    {
        $invoice = Invoice::with([
            'patient.hospital',
            'center',
            'consultations.profileDoctor.user',
            'performedMedicalActs.medicalActCatalog',
            'performedMedicalActs.equipment', 
            'admissions.bed.facilityRoom.category',
            'labRequests.lines.test',
            'payments.reception.user',
            'splits' // 👉 NOUVEAU : Chargement de la relation pour le calcul du Tiers Payant
        ])->findOrFail($invoiceId);

        // Encodage Base64 du logo de l'Hôpital (En-tête)
        $hospitalLogoBase64 = null;
        if ($invoice->patient->hospital && $invoice->patient->hospital->logo_url) {
            $hospitalLogoPath = public_path($invoice->patient->hospital->logo_url);
            if (file_exists($hospitalLogoPath)) {
                $hospitalLogoBase64 = 'data:image/' . pathinfo($hospitalLogoPath, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($hospitalLogoPath));
            }
        }

        // Encodage Base64 du logo Asclépios (Filigrane central d'authenticité)
        $asklepiosLogoBase64 = null;
        $asklepiosLogoPath = public_path('images/asklepios_logo.png');
        if (file_exists($asklepiosLogoPath)) {
            $asklepiosLogoBase64 = 'data:image/png;base64,' . base64_encode(file_get_contents($asklepiosLogoPath));
        }

      // Calcul des éléments complexes (nuits d'hospitalisation réelles)
        $processedAdmissions = [];
        foreach ($invoice->admissions as $admission) {
            $startDate = \Carbon\Carbon::parse($admission->admission_date);
            
            // Si pas de date de sortie, on arrête le compteur à la date de la facture !
            $endDate = $admission->actual_discharge_date 
                        ? \Carbon\Carbon::parse($admission->actual_discharge_date) 
                        : \Carbon\Carbon::parse($invoice->created_at); 

            $nights = max(1, $startDate->diffInDays($endDate));
            
            $pricePerNight = $admission->bed->facilityRoom->category->price_per_night ?? 0;

            $processedAdmissions[] = [
                'description' => "Séjour Hospitalisation - Lit " . ($admission->bed->bed_number ?? '') . " (" . ($admission->bed->facilityRoom->name ?? '') . ")",
                'nights'      => $nights,
                'unit_price'  => $pricePerNight,
                'subtotal'    => $nights * $pricePerNight,
                'period'      => $startDate->format('d/m/Y') . " au " . $endDate->format('d/m/Y')
            ];
        }
        
        $data = [
            'invoice'             => $invoice,
            'patient'             => $invoice->patient,
            'hospital'            => $invoice->patient->hospital,
            'admissions'          => $processedAdmissions,
            'hospitalLogoBase64'  => $hospitalLogoBase64,
            'asklepiosLogoBase64' => $asklepiosLogoBase64,
            'generated_at'        => now()->format('d/m/Y H:i'),
        ];

        $pdf = Pdf::loadView('pdf.invoice', $data)->setPaper('a4', 'portrait');

        $fileName = 'Facture_' . $invoice->patient->patient_code . '_' . $invoice->id . '.pdf';

        return $action === 'download' ? $pdf->download($fileName) : $pdf->stream($fileName);
    }
}