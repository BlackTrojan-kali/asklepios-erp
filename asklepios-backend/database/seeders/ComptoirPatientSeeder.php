<?php

namespace Database\Seeders;

use App\Models\Hospital; // Assure-toi que ce namespace correspond à ton modèle Hospital
use App\Models\Patient;  // Assure-toi que ce namespace correspond à ton modèle Patient
use Illuminate\Database\Seeder;

class ComptoirPatientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // On récupère tous les hôpitaux de la plateforme
        $hospitals = Hospital::all();

        if ($hospitals->isEmpty()) {
            $this->command->info('Aucun hôpital trouvé. Veuillez d\'abord créer un hôpital.');
            return;
        }

        foreach ($hospitals as $hospital) {
            // firstOrCreate permet de ne pas créer de doublons si tu relances le seeder
            Patient::firstOrCreate(
                [
                    'hospital_id' => $hospital->id,
                    'patient_code' => 'COMPTOIR', // Code unique et facile à retenir/chercher
                ],
                [
                    'first_name' => 'Patient',
                    'last_name' => 'Comptoir',
                    'bith_date' => '1900-01-01', // Date par défaut (attention à la coquille de la migration)
                    'contact_phone' => '000000000',
                ]
            );
        }

        $this->command->info('Les patients "Comptoir" ont été créés avec succès pour tous les hôpitaux.');
    }
}