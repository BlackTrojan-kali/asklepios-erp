<?php

namespace Database\Seeders;

use App\Models\Licence;
use Illuminate\Database\Seeder;

class LicenceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $licences = [
            [
                'name' => 'base_hospital',
                'description' => 'Licence de base pour la gestion globale de l\'établissement hospitalier.',
            ],
            [
                'name' => 'laboratory',
                'description' => 'Licence spécifique pour la gestion du laboratoire et des analyses médicales.',
            ],
            [
                'name' => 'pharmacy',
                'description' => 'Licence spécifique pour la gestion de la pharmacie et des stocks de médicaments.',
            ],
        ];

        foreach ($licences as $licence) {
            // firstOrCreate cherche d'abord par 'name'. 
            // Si la licence n'existe pas, il la crée en ajoutant la 'description'.
            Licence::firstOrCreate(
                ['name' => $licence['name']],
                ['description' => $licence['description']]
            );
        }
    }
}