<?php

namespace App\Http\Services;

use App\Models\Pharmacy\Batch;
use App\Models\Pharmacy\PharmacyBranch;
use App\Models\Pharmacy\Stock;

class StockService
{
    /**
     * Génère un enregistrement de stock (quantité 0) pour un lot spécifique
     * dans TOUTES les succursales de la pharmacie de l'hôpital connecté.
     * Utile lorsqu'un nouveau lot est créé manuellement.
     *
     * @param Batch $batch Le lot concerné
     * @param int $hospitalId L'ID de l'hôpital
     * @return void
     */
    public function initializeStockForBatch(Batch $batch, int $hospitalId)
    {
        // 1. Récupérer toutes les succursales de cet hôpital
        $branches = PharmacyBranch::where('hospital_id', $hospitalId)->get();

        // 2. Créer le stock s'il n'existe pas pour chaque succursale
        foreach ($branches as $branch) {
            Stock::firstOrCreate(
                [
                    'pharmacy_branch_id' => $branch->id,
                    'batch_id'           => $batch->id,
                ],
                [
                    'qty' => 0.0,
                ]
            );
        }
    }

    /**
     * Génère les enregistrements de stock pour TOUS les lots de TOUS les articles
     * dans TOUTES les succursales de l'hôpital connecté.
     * Utile pour une synchronisation globale ou lors de la création d'une nouvelle succursale.
     *
     * @param int $hospitalId L'ID de l'hôpital
     * @return void
     */
    public function initializeAllStocksForHospital(int $hospitalId)
    {
        // 1. Récupérer toutes les succursales
        $branches = PharmacyBranch::where('hospital_id', $hospitalId)->get();
        
        // 2. Récupérer tous les lots des articles de cet hôpital
        $batches = Batch::whereHas('article', function ($query) use ($hospitalId) {
            $query->where('hospital_id', $hospitalId);
        })->get();

        // 3. Boucler pour créer les entrées manquantes
        foreach ($branches as $branch) {
            foreach ($batches as $batch) {
                Stock::firstOrCreate(
                    [
                        'pharmacy_branch_id' => $branch->id,
                        'batch_id'           => $batch->id,
                    ],
                    [
                        'qty' => 0.0,
                    ]
                );
            }
        }
    }
}