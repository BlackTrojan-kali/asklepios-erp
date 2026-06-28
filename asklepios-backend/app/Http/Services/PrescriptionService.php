<?php

namespace App\Http\Services;

use App\Models\Hospital\Prescription;
use Illuminate\Support\Facades\DB;
use Exception;

class PrescriptionService
{
    /**
     * Crée une nouvelle ordonnance avec ses lignes de médicaments.
     *
     * @param int $consultationId
     * @param array $medications [{ article_id?: int, custom_medication_name?: string, dosage: string }]
     * @return Prescription
     * @throws Exception
     */
    public function createPrescription(int $consultationId, array $medications): Prescription
    {
        return DB::transaction(function () use ($consultationId, $medications) {
            
            // 1. Création de l'en-tête de l'ordonnance
            $prescription = Prescription::create([
                'consultation_id' => $consultationId,
                'status'          => 'PENDING', // En attente de délivrance à la pharmacie
            ]);

            // 2. Ajout des lignes
            foreach ($medications as $med) {
                $prescription->prescriptionLines()->create([
                    'article_id'             => $med['article_id'] ?? null,
                    'custom_medication_name' => $med['custom_medication_name'] ?? null,
                    'dosage'                 => $med['dosage'],
                ]);
            }

            // Retourne l'ordonnance avec ses lignes chargées
            return $prescription->load('prescriptionLines');
        });
    }

    /**
     * Met à jour le statut d'une ordonnance (ex: passage à DELIVERED par la pharmacie).
     */
    public function updateStatus(int $prescriptionId, string $status): Prescription
    {
        $prescription = Prescription::findOrFail($prescriptionId);
        $prescription->update(['status' => $status]);
        
        return $prescription;
    }
}