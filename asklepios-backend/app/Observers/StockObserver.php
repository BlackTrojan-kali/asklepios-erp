<?php

namespace App\Observers;

use App\Models\Pharmacy\Stock;
use App\Models\User;
use App\Notifications\LowStockAlertNotification;
use Illuminate\Support\Facades\Notification;

class StockObserver
{
    /**
     * Handle the Stock "updated" event.
     */
    public function updated(Stock $stock): void
    {
        // On vérifie si la quantité a été modifiée
        if ($stock->wasChanged('qty')) {
            
            // On s'assure d'avoir les relations pour lire le seuil critique
            $stock->loadMissing(['batch.article', 'branch']);
            $article = $stock->batch->article;

            if ($article) {
                $minQty = $article->global_min_qty;
                $oldQty = $stock->getOriginal('qty');
                $newQty = $stock->qty;

                // On ne déclenche l'alerte QUE si l'ancienne quantité était AU DESSUS du seuil,
                // et que la nouvelle tombe en DESSOUS ou ÉGAL au seuil (pour éviter le spam à chaque vente)
                if ($oldQty > $minQty && $newQty <= $minQty) {
                    
                    $hospitalId = $article->hospital_id;
                    $branchId = $stock->pharmacy_branch_id;

                    // 1. Cibler les administrateurs de l'hôpital
                    $admins = User::whereHas('profile_admin', function($q) use ($hospitalId) {
                        $q->where('hospital_id', $hospitalId);
                    })->get();

                    // 2. Cibler le magasinier de LA succursale concernée
                    $magasinier = User::whereHas('profile_pharm', function($q) use ($branchId) {
                        $q->where('branch_id', $branchId)
                          ->where('position', 'magasin');
                    })->get();

                    // Fusionner et notifier
                    $usersToNotify = $admins->merge($magasinier);

                    if ($usersToNotify->isNotEmpty()) {
                        Notification::send($usersToNotify, new LowStockAlertNotification($stock));
                    }
                }
            }
        }
    }
}