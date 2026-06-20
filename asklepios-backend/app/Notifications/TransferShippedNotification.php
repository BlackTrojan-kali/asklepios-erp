<?php

namespace App\Notifications;

use App\Models\Pharmacy\StockTransfer;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TransferShippedNotification extends Notification // <-- RETRAIT DE "ShouldQueue" POUR EXÉCUTION IMMÉDIATE
{
    use Queueable;

    public $transfer;

    public function __construct(StockTransfer $transfer)
    {
        $this->transfer = $transfer;
    }

    public function via(object $notifiable): array
    {
        return ['database']; 
    }

    public function toDatabase(object $notifiable): array
    {
        // On s'assure que la relation sourcePharmacy est chargée pour éviter une erreur
        $sourceName = $this->transfer->sourcePharmacy->name ?? 'une autre succursale';

        return [
            'type' => 'TRANSFER_SHIPPED',
            'title' => 'Nouveau transfert en approche',
            'message' => 'La pharmacie de ' . $sourceName . ' a expédié le transfert #' . $this->transfer->id . '.',
            'transfer_id' => $this->transfer->id,
            'source_pharmacy_id' => $this->transfer->source_pharmacy_id,
            'action_url' => '/pharmacy/stock-transfers' // Lien vers lequel rediriger
        ];
    }
}