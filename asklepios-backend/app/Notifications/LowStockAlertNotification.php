<?php

namespace App\Notifications;

use App\Models\Pharmacy\Stock;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class LowStockAlertNotification extends Notification
{
    use Queueable;

    public $stock;

    public function __construct(Stock $stock)
    {
        $this->stock = $stock;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $articleName = $this->stock->batch->article->name ?? 'Article';
        $branchName = $this->stock->branch->name ?? 'la pharmacie';
        $minQty = $this->stock->batch->article->global_min_qty ?? 0;

        return [
            'type' => 'STOCK_ALERT',
            'title' => 'Alerte Seuil Critique',
            'message' => "Stock critique pour {$articleName} à {$branchName}. Reste: {$this->stock->qty} (Seuil: {$minQty}).",
            'stock_id' => $this->stock->id,
            'pharmacy_branch_id' => $this->stock->pharmacy_branch_id,
            'action_url' => '/admin/purchase-orders' // Invite à commander
        ];
    }
}