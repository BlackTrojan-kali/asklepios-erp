<?php

namespace App\Http\Services;

use App\Models\Pharmacy\Batch;
use App\Models\Pharmacy\PharmacyBranch;
use App\Models\Pharmacy\Stock;
use App\Models\User;
use App\Notifications\StockInitializedNotification;
use Illuminate\Support\Facades\Notification;

class StockService
{
    public function initializeStockForBatch(Batch $batch, int $hospitalId)
    {
        $branches = PharmacyBranch::where('hospital_id', $hospitalId)->get();

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

        // --- NOUVEAU : NOTIFIER LES MAGASINIERS ---
        // Cibler les pharmaciens (magasin) de cet hôpital
        $magasiniers = User::whereHas('profile_pharm', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId)
              ->where('position', 'magasin');
        })->get();

        if ($magasiniers->isNotEmpty()) {
            Notification::send($magasiniers, new StockInitializedNotification($batch));
        }
    }

    public function initializeAllStocksForHospital(int $hospitalId)
    {
        $branches = PharmacyBranch::where('hospital_id', $hospitalId)->get();
        
        $batches = Batch::whereHas('article', function ($query) use ($hospitalId) {
            $query->where('hospital_id', $hospitalId);
        })->get();

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
        
        // Optionnel : Tu peux aussi envoyer une notification globale ici si nécessaire.
    }
}