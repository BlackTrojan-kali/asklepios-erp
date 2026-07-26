<?php

namespace App\Http\Services;

use App\Models\PatientCoverage;

class PatientCoverageService
{
    /**
     * Créer une nouvelle couverture d'assurance pour un patient
     */
    public function createCoverage(array $data): PatientCoverage
    {
        // On s'assure de définir un statut actif par défaut si non précisé
        if (!isset($data['is_active'])) {
            $data['is_active'] = true;
        }

        return PatientCoverage::create($data);
    }

    /**
     * Mettre à jour une couverture existante
     */
    public function updateCoverage(int $id, array $data): PatientCoverage
    {
        $coverage = PatientCoverage::findOrFail($id);
        $coverage->update($data); 
        
        return $coverage;
    }

    /**
     * Supprimer une couverture
     */
    public function deleteCoverage(int $id): bool
    {
        $coverage = PatientCoverage::findOrFail($id);
        return $coverage->delete();
    }
}