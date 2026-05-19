<?php

namespace App\Http\Services;

use App\Models\Pharmacy\Article;
use App\Models\Pharmacy\Batch;

class BatchService
{
    /**
     * Génère un lot STANDARD pour les articles qui ne nécessitent pas 
     * un suivi strict des lots (sans date de péremption).
     *
     * @param Article $article
     * @param float $defaultPrice Prix d'achat par défaut (0 par défaut)
     * @return Batch|null
     */
    public function handleStandardBatch(Article $article, float $defaultPrice = 0.0)
    {
        // Si l'article trace les lots de façon classique, on ne fait rien
        if ($article->track_batches) {
            return null;
        }

        // firstOrCreate évite de créer des doublons de lots STANDARD 
        // si on modifie l'article plusieurs fois
        return Batch::firstOrCreate(
            [
                'article_id' => $article->id,
                'batch_number' => 'STANDARD',
            ],
            [
                'expire_date' => null,
                'purchase_price' => $defaultPrice,
            ]
        );
    }
}