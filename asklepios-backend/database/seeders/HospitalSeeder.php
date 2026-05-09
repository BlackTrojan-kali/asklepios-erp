<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Hospital; // N'oublie pas d'importer ton modèle

class HospitalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // On vérifie s'il existe déjà pour éviter les doublons lors de lancements multiples
        $hospital = Hospital::firstOrCreate(
            ['niu' => 'M0123456789123'], // Condition de recherche (par exemple le NIU)
            [
                'name' => 'Hôpital de Test Asklepios',
                'logo_url' => 'https://ui-avatars.com/api/?name=Hôpital+Asklepios&color=ffffff&background=0D8ABC', // Un faux logo généré automatiquement
            ]
        );

        // Tu peux aussi en créer un deuxième si tu veux tester du multi-établissements plus tard
        /*
        Hospital::firstOrCreate(
            ['niu' => 'M9876543210987'],
            [
                'name' => 'Clinique Annexe Asklepios',
                'logo_url' => null,
            ]
        );
        */
    }
}