<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\Center;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // On récupère tous les centres existants
        $centers = Center::all();

        // Sécurité : S'il n'y a pas de centres, on ne peut pas créer de départements
        if ($centers->isEmpty()) {
            $this->command->info('Aucun centre trouvé. Veuillez d\'abord créer des centres.');
            return;
        }

        // Liste standard des départements pour un hôpital (ERP Asklepios)
        $standardDepartments = [
            ['name' => 'Urgences', 'alias' => 'URG'],
            ['name' => 'Pédiatrie', 'alias' => 'PED'],
            ['name' => 'Cardiologie', 'alias' => 'CARDIO'],
            ['name' => 'Maternité & Gynécologie', 'alias' => 'MAT'],
            ['name' => 'Laboratoire d\'Analyses Médicales', 'alias' => 'LABO'],
            ['name' => 'Pharmacie', 'alias' => 'PHARM'],
            ['name' => 'Consultations Externes', 'alias' => 'OPD'],
            ['name' => 'Chirurgie Générale', 'alias' => 'CHIR'],
            ['name' => 'Imagerie Médicale (Radiologie)', 'alias' => 'RADIO'],
            ['name' => 'Administration', 'alias' => 'ADMIN'],
        ];

        // Pour chaque centre, on crée ces départements
        foreach ($centers as $center) {
            foreach ($standardDepartments as $dept) {
                // On utilise firstOrCreate pour éviter les doublons si on relance le seeder
                Department::firstOrCreate([
                    'center_id' => $center->id,
                    'name' => $dept['name'],
                ], [
                    'alias' => $dept['alias'],
                ]);
            }
        }

        $this->command->info('Les départements hospitaliers ont été générés avec succès !');
    }
}