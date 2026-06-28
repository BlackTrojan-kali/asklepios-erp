<?php

namespace App\Http\Services;

use App\Models\Patient;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class MedicalRecordPdfService
{
    /**
     * Génère le PDF du carnet médical.
     * * @param int $patientId
     * @param string $action 'stream' (afficher) | 'download' (télécharger) | 'save' (stocker)
     * @return mixed
     */
    public function generateRecord(int $patientId, string $action = 'stream')
    {
        // 1. Récupération complète du dossier patient (Eager Loading massif)
        $patient = Patient::with([
            'medicalBackground',
            'patientVisits' => function($query) {
                $query->orderBy('arrival_time', 'desc'); // Du plus récent au plus ancien
            },
            'patientVisits.center.hospital',
            'patientVisits.consultations.profileDoctor.user',
            'patientVisits.consultations.prescriptions.prescriptionLines.article',
            'patientVisits.consultations.examRequests.examRequestLines',
        ])->findOrFail($patientId);

        // 2. Conversion du logo Asclépios en Base64 (Évite les bugs de chemin avec DomPDF)
        $logoPath = public_path('images/asklepios_logo.png'); // Assure-toi de placer ton logo ici
        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $logoData = file_get_contents($logoPath);
            $logoBase64 = 'data:image/png;base64,' . base64_encode($logoData);
        }

        // 3. Préparation des données pour la vue Blade
        $data = [
            'patient' => $patient,
            'logoBase64' => $logoBase64,
            'generated_at' => now()->format('d/m/Y H:i'),
        ];

        // 4. Génération du PDF
        $pdf = Pdf::loadView('pdf.medical_record', $data)
                  ->setPaper('a4', 'portrait');

        // 5. Action selon le besoin
        $fileName = 'Carnet_Medical_' . str_replace(' ', '_', $patient->name) . '.pdf';

        if ($action === 'save') {
            $filePath = 'patients/records/' . $fileName;
            Storage::disk('public')->put($filePath, $pdf->output());
            return $filePath;
        }

        return $action === 'download' ? $pdf->download($fileName) : $pdf->stream($fileName);
    }
}