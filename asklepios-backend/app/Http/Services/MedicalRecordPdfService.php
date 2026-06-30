<?php

namespace App\Http\Services;

use App\Models\Patient;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class MedicalRecordPdfService
{
    public function generateRecord(int $patientId, string $action = 'stream')
    {
        // 1. Récupération complète du dossier
        $patient = Patient::with([
            'hospital',
            'medicalBackground',
            'admissions' => function($query) { $query->orderBy('admission_date', 'desc'); },
            'admissions.bed.facilityRoom',
            'admissions.doctor.user',
            
            // CHARGEMENT DES VISITES
            'patientVisits' => function($query) { $query->orderBy('arrival_time', 'desc'); },
            'patientVisits.center',
            'patientVisits.consultations.profileDoctor.user',
            'patientVisits.consultations.prescriptions.prescriptionLines.article',
            'patientVisits.consultations.examRequests.examRequestLines',
            
            // AJOUT DU CHARGEMENT DES ACTES RÉALISÉS PENDANT LA VISITE
            'patientVisits.performedMedicalActs.medicalActCatalog',
            'patientVisits.performedMedicalActs.equipment' // S'il y a un équipement lié
        ])->findOrFail($patientId);
        // ... Le reste du code des logos (Hospital et Asclépios) reste inchangé ...
        
        // 2. Gestion du Logo de l'Hôpital (En-tête)
        $hospitalLogoBase64 = null;
        if ($patient->hospital && $patient->hospital->logo_url) {
            $hospitalLogoPath = public_path($patient->hospital->logo_url);
            if (file_exists($hospitalLogoPath)) {
                $logoData = file_get_contents($hospitalLogoPath);
                $hospitalLogoBase64 = 'data:image/' . pathinfo($hospitalLogoPath, PATHINFO_EXTENSION) . ';base64,' . base64_encode($logoData);
            }
        }

        // 3. Gestion du Logo Asclépios (Filigrane)
        $asklepiosLogoBase64 = null;
        $asklepiosLogoPath = public_path('images/asklepios_logo.png');
        if (file_exists($asklepiosLogoPath)) {
            $logoData = file_get_contents($asklepiosLogoPath);
            $asklepiosLogoBase64 = 'data:image/png;base64,' . base64_encode($logoData);
        }

        $data = [
            'patient'             => $patient,
            'hospital'            => $patient->hospital,
            'medicalBg'           => $patient->medicalBackground,
            'hospitalLogoBase64'  => $hospitalLogoBase64,
            'asklepiosLogoBase64' => $asklepiosLogoBase64,
            'generated_at'        => now()->format('d/m/Y H:i'),
        ];

        $pdf = Pdf::loadView('pdf.medical_record', $data)->setPaper('a4', 'portrait');

        $safeName = preg_replace('/[^A-Za-z0-9\-]/', '_', $patient->first_name . '_' . $patient->last_name);
        $fileName = 'Carnet_Medical_' . $safeName . '_' . $patient->patient_code . '.pdf';

        if ($action === 'save') {
            $filePath = 'patients/records/' . $fileName;
            Storage::disk('public')->put($filePath, $pdf->output());
            return $filePath;
        }

        return $action === 'download' ? $pdf->download($fileName) : $pdf->stream($fileName);
    }
}