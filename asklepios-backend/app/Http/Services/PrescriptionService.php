<?php
namespace App\Http\Services;

use App\Models\Hospital\Prescription;
use App\Models\Pharmacy\Article;
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
            
            // 2. Optimisation : Récupérer tous les IDs des articles pour faire UNE SEULE requête
            $articleIds = collect($medications)->pluck('article_id')->filter()->unique();
            
            // On crée un dictionnaire [id => name] (ex: [5 => 'Paracétamol', 12 => 'Aspirine'])
            $articleNames = $articleIds->isEmpty() 
                ? collect() 
                : Article::whereIn('id', $articleIds)->pluck('name', 'id');

            // 3. Préparation des lignes pour l'insertion en masse
            $prescriptionLines = [];
            
            foreach ($medications as $med) {
                $articleId = $med['article_id'] ?? null;
                
                // Récupération sécurisée du nom de l'article depuis la collection
                $fetchedName = $articleId ? $articleNames->get($articleId) : null;

                $prescriptionLines[] = [
                    'article_id'             => $articleId,
                    'custom_medication_name' => $med['custom_medication_name'] ?? $fetchedName,
                    'dosage'                 => $med['dosage'],
                ];
            }

            // 4. Insertion de toutes les lignes en une seule opération via la relation
            $prescription->prescriptionLines()->createMany($prescriptionLines);

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