<?php

namespace App\Http\Services;

use App\Models\Hospital\ExamRequest;
use App\Models\Hospital\ExamRequestLine;
use Illuminate\Support\Facades\DB;
use Exception;

class ExamRequestService
{
    /**
     * Crée une nouvelle demande d'examens multiples.
     *
     * @param int $consultationId
     * @param array $exams [{ exam_name: string, send_to_internal_lab?: bool, lab_test_id?: int }]
     * @param int|null $profileDoctorId
     * @param int|null $patientVisitId
     * @param int|null $patientId
     * @param int|null $laboratoryId
     * @param int|null $admissionId
     * @return ExamRequest
     * @throws Exception
     */
    public function createExamRequest(
        int $consultationId, 
        array $exams,
        ?int $profileDoctorId = null,
        ?int $patientVisitId = null,
        ?int $patientId = null,
        ?int $laboratoryId = null,
        ?int $admissionId = null // 👉 NOUVEAU : On accepte l'ID d'hospitalisation
    ): ExamRequest
    {
        return DB::transaction(function () use ($consultationId, $exams, $profileDoctorId, $patientVisitId, $patientId, $laboratoryId, $admissionId) {
            
            // 1. Création de l'en-tête de la demande côté Hôpital
            $examRequest = ExamRequest::create([
                'consultation_id' => $consultationId,
                'status'          => 'PENDING',
            ]);

            // Préparation pour le Labo Interne si applicable
            $labRequest = null;
            
            // 👉 CORRECTION : On valide si on a un patientVisitId OU un admissionId
            if ($laboratoryId && $patientId && $profileDoctorId && ($patientVisitId || $admissionId)) {
                $hasInternalExams = collect($exams)->contains(function ($exam) {
                    return !empty($exam['send_to_internal_lab']) && !empty($exam['lab_test_id']);
                });

                if ($hasInternalExams) {
                    $labRequest = \App\Models\Laboratory\LabRequest::create([
                        'patient_id'        => $patientId,
                        'patient_visit_id'  => $patientVisitId,
                        'admission_id'      => $admissionId, // 👉 NOUVEAU : On le lie à l'hospitalisation si applicable
                        'profile_doctor_id' => $profileDoctorId,
                        'laboratory_id'     => $laboratoryId,
                        'status'            => 'PENDING_PAYMENT',
                    ]);
                }
            }

            // 2. Ajout de chaque examen demandé
            foreach ($exams as $exam) {
                $examLine = $examRequest->examRequestLines()->create([
                    'exam_name'    => $exam['exam_name'],
                    'result_notes' => null, // Le résultat sera rempli plus tard par le labo
                    'document_url' => null,
                ]);

                // Si l'examen est destiné au labo interne
                if ($labRequest && !empty($exam['send_to_internal_lab']) && !empty($exam['lab_test_id'])) {
                    \App\Models\Laboratory\LabRequestLine::create([
                        'lab_request_id'       => $labRequest->id,
                        'lab_test_id'          => $exam['lab_test_id'],
                        'exam_request_line_id' => $examLine->id,
                    ]);
                }
            }

            return $examRequest->load('examRequestLines');
        });
    }

    /**
     * Soumet le résultat d'un examen spécifique (utilisé par le laboratoire).
     */
    public function submitExamResult(int $examLineId, ?string $notes, ?string $documentUrl = null): ExamRequestLine
    {
        $examLine = ExamRequestLine::findOrFail($examLineId);
        
        $examLine->update([
            'result_notes' => $notes,
            'document_url' => $documentUrl,
        ]);

        $this->checkAndUpdateParentStatus($examLine->exam_request_id);

        return $examLine;
    }

    /**
     * Vérifie si tous les examens d'une demande ont un résultat. 
     * Si oui, clôture la demande.
     */
    private function checkAndUpdateParentStatus(int $examRequestId): void
    {
        $examRequest = ExamRequest::with('examRequestLines')->find($examRequestId);
        
        if (!$examRequest) return;

        // Si aucune ligne n'a un 'result_notes' vide, c'est que tout est terminé
        $allCompleted = $examRequest->examRequestLines->every(function ($line) {
            return !is_null($line->result_notes) || !is_null($line->document_url);
        });

        if ($allCompleted) {
            $examRequest->update(['status' => 'COMPLETED']);
        }
    }
}