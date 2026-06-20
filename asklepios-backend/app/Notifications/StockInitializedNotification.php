<?php

namespace App\Notifications;

use App\Models\Pharmacy\Batch;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class StockInitializedNotification extends Notification
{
    use Queueable;

    public $batch;

    public function __construct(Batch $batch)
    {
        $this->batch = $batch;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $articleName = $this->batch->article->name ?? 'Article inconnu';
        
        return [
            'type' => 'STOCK_INITIALIZED',
            'title' => 'Nouveau Stock Initialisé',
            'message' => "Le lot #{$this->batch->batch_number} pour l'article {$articleName} a été initialisé dans les magasins.",
            'batch_id' => $this->batch->id,
            'article_id' => $this->batch->article_id,
            'action_url' => '/pharmacy/storage-locations' // Lien pertinent
        ];
    }
}