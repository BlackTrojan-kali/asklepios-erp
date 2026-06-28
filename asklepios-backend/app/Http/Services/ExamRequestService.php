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
     * @param array $exams [{ exam_name: string }]
     * @return ExamRequest
     * @throws Exception
     */
    public function createExamRequest(int $consultationId, array $exams): ExamRequest
    {
        return DB::transaction(function () use ($consultationId, $exams) {
            
            // 1. Création de l'en-tête de la demande
            $examRequest = ExamRequest::create([
                'consultation_id' => $consultationId,
                'status'          => 'PENDING',
            ]);

            // 2. Ajout de chaque examen demandé
            foreach ($exams as $exam) {
                $examRequest->examRequestLines()->create([
                    'exam_name'    => $exam['exam_name'],
                    'result_notes' => null, // Le résultat sera rempli plus tard par le labo
                    'document_url' => null,
                ]);
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

        // Optionnel : Vérifier si toutes les lignes de l'ExamRequest parent sont terminées
        // pour passer le statut global de la demande à "COMPLETED".
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