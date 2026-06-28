<?php

namespace App\Jobs\Hospital;

use App\Http\Services\MedicalRecordPdfService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GeneratePatientMedicalRecordJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $patientId;

    /**
     * Create a new job instance.
     */
    public function __construct(int $patientId)
    {
        $this->patientId = $patientId;
    }

    /**
     * Execute the job.
     */
    public function handle(MedicalRecordPdfService $pdfService): void
    {
        // On génère le PDF et on le sauvegarde sur le disque (storage/app/public/patients/records/)
        $savedPath = $pdfService->generateRecord($this->patientId, 'save');
        
        // TODO: Ici tu pourrais ajouter le code pour envoyer le PDF par email au patient ou au docteur.
        // Mail::to($patient->email)->send(new MedicalRecordMail($savedPath));
    }
}