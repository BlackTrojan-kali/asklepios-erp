<?php

namespace App\Http\Services;

use App\Models\Patient;

class PatientCodeService
{
    /**
     * Génère un code patient unique, lisible et sans caractères ambigus.
     * Format final : H{hospital_id}-XXXX-XXXX (ex: H1-A3K9-M2W4)
     * * @param int $hospitalId L'ID de l'hôpital pour isoler visuellement les codes
     * @return string
     */
    public function generateUniqueCode(int $hospitalId): string
    {
        // Alphabet sécurisé : pas de O, 0, 1, I, L
        $characters = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
        $codeLength = 8;
        $maxAttempts = 10; // Sécurité anti-boucle infinie (bien que très improbable)
        $attempts = 0;

        do {
            $randomString = '';
            for ($i = 0; $i < $codeLength; $i++) {
                $randomString .= $characters[random_int(0, strlen($characters) - 1)];
            }

            // On coupe en deux blocs de 4 pour la lisibilité
            $block1 = substr($randomString, 0, 4);
            $block2 = substr($randomString, 4, 4);

            // On préfixe avec l'ID de l'hôpital (H1, H2...) pour une identification rapide
            $formattedCode = "H{$hospitalId}-{$block1}-{$block2}";
            
            $attempts++;
            
            // Si par miracle on atteint 10 collisions, on ajoute un timestamp pour forcer l'unicité
            if ($attempts >= $maxAttempts) {
                $formattedCode .= '-' . time();
            }

        } while (Patient::where('patient_code', $formattedCode)->exists());

        return $formattedCode;
    }
}