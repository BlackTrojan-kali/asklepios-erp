<?php

namespace App\Http\Services;

use App\Models\Hospital\Invoice;
use App\Models\Hospital\BagCenter; // 👉 AJOUT
use Barryvdh\DomPDF\Facade\Pdf;

class InvoicePdfService
{
    public function generateInvoicePdf(int $invoiceId, string $action = 'stream')
    {
        $invoice = Invoice::with([
            'patient.hospital',
            'center',
            'consultations.profileDoctor.user',
            'consultations.bloodTransfusions.bloodBag', // 👉 NOUVEAU : Chargement des transfusions
            'performedMedicalActs.medicalActCatalog',
            'performedMedicalActs.equipment', 
            'admissions.bed.facilityRoom.category',
            'labRequests.lines.test.category',
            'payments.reception.user',
            'payments.invoiceSplit', 
            'splits.guarantorClaim.insuranceCompany' 
        ])->findOrFail($invoiceId);

        $hospitalLogoBase64 = null;
        if ($invoice->patient->hospital && $invoice->patient->hospital->logo_url) {
            $hospitalLogoPath = public_path($invoice->patient->hospital->logo_url);
            if (file_exists($hospitalLogoPath)) {
                $hospitalLogoBase64 = 'data:image/' . pathinfo($hospitalLogoPath, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($hospitalLogoPath));
            }
        }

        $asklepiosLogoBase64 = null;
        $asklepiosLogoPath = public_path('images/asklepios_logo.png');
        if (file_exists($asklepiosLogoPath)) {
            $asklepiosLogoBase64 = 'data:image/png;base64,' . base64_encode(file_get_contents($asklepiosLogoPath));
        }

        $processedAdmissions = [];
        foreach ($invoice->admissions as $admission) {
            $startDate = \Carbon\Carbon::parse($admission->admission_date);
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

        // 👉 NOUVEAU : Traitement des Transfusions Sanguines pour le PDF
        $processedTransfusions = [];
        foreach ($invoice->consultations as $consultation) {
            foreach ($consultation->bloodTransfusions as $transfusion) {
                $pricing = BagCenter::where('center_id', $transfusion->center_id)
                                    ->where('blood_type', $transfusion->bloodBag->blood_type ?? '')
                                    ->first();
                $price = $pricing ? $pricing->price : 0;
                
                $processedTransfusions[] = [
                    'description' => "Transfusion Sanguine - Poche " . ($transfusion->bloodBag->blood_type ?? 'N/A') . " (" . ($transfusion->bloodBag->volume_ml ?? '') . "ml)",
                    'date'        => \Carbon\Carbon::parse($transfusion->start_time)->format('d/m/Y H:i'),
                    'price'       => $price
                ];
            }
        }
        
        $data = [
            'invoice'             => $invoice,
            'patient'             => $invoice->patient,
            'hospital'            => $invoice->patient->hospital,
            'admissions'          => $processedAdmissions,
            'transfusions'        => $processedTransfusions, // 👉 Ajout à la vue
            'hospitalLogoBase64'  => $hospitalLogoBase64,
            'asklepiosLogoBase64' => $asklepiosLogoBase64,
            'generated_at'        => now()->format('d/m/Y H:i'),
        ];

        $pdf = Pdf::loadView('pdf.invoice', $data)->setPaper('a4', 'portrait');
        $fileName = 'Facture_' . $invoice->patient->patient_code . '_' . $invoice->id . '.pdf';

        return $action === 'download' ? $pdf->download($fileName) : $pdf->stream($fileName);
    }
}