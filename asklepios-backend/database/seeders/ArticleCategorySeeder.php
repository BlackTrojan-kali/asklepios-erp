<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ArticleCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // La variable que tu peux changer pour la production
        $hospital_id = env('DEFAULT_HOSPITAL_ID', 1);
        
        $now = Carbon::now();

        // Arborescence complète : Catégories parentes => [Sous-catégories]
        $categoriesTree = [
            'Médicaments' => [
                'Antibiotiques & Antibactériens',
                'Antalgiques & Antipyrétiques',
                'Anti-inflammatoires',
                'Antipaludéens',
                'Cardiologie & Vasculaire',
                'Gastro-entérologie',
                'Gynécologie',
                'Vitamines & Compléments'
            ],
            'Matériel Médical & Consommables' => [
                'Seringues & Aiguilles',
                'Pansements & Compresses',
                'Gants Médicaux',
                'Matériel de Diagnostic (Thermomètres, Tensiomètres)',
                'Perfusion & Transfusion'
            ],
            'Hygiène & Soins' => [
                'Soins Dentaires',
                'Soins Corporels',
                'Antiseptiques & Désinfectants'
            ],
            'Maternité & Bébé' => [
                'Laits Infantiles',
                'Couches & Lingettes',
                'Soins pour Bébé'
            ],
            'Parapharmacie & Cosmétique' => [
                'Soins Dermatologiques',
                'Huiles Essentielles'
            ],
        ];

        foreach ($categoriesTree as $parentName => $subCategories) {
            // 1. Création de la catégorie parente
            $parentId = DB::table('article_categories')->insertGetId([
                'hospital_id' => $hospital_id,
                'article_category_id' => null, // C'est un parent
                'name' => $parentName,
                'description' => "Catégorie principale : " . $parentName,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            // 2. Création des sous-catégories liées à ce parent
            foreach ($subCategories as $subName) {
                DB::table('article_categories')->insert([
                    'hospital_id' => $hospital_id,
                    'article_category_id' => $parentId, // Lien vers le parent
                    'name' => $subName,
                    'description' => "Sous-catégorie de " . $parentName,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
        
        $this->command->info('Les catégories de la pharmacie ont été générées avec succès !');
    }
}