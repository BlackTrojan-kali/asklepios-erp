<?php

namespace App\Jobs;

use App\Models\Pharmacy\Article;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ExportArticlesPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $hospitalId;
    protected $userId;
    protected $filters;

    public function __construct($hospitalId, $userId, $filters)
    {
        $this->hospitalId = $hospitalId;
        $this->userId = $userId;
        $this->filters = $filters;
    }

    public function handle(): void
    {
        try {
            // 1. Construction de la requête avec relations (Catégorie, Lots et Stocks si besoin)
            $query = Article::with(['category', 'batches'])
                ->where('hospital_id', $this->hospitalId);

            // 2. Application des filtres dynamiques
            if (!empty($this->filters['search'])) {
                $search = $this->filters['search'];
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('barcode', 'like', "%{$search}%");
                });
            }

            if (!empty($this->filters['category_id'])) {
                $query->where('category_id', $this->filters['category_id']);
            }

            if (isset($this->filters['track_batches'])) {
                $query->where('track_batches', filter_var($this->filters['track_batches'], FILTER_VALIDATE_BOOLEAN));
            }

            if (isset($this->filters['is_prescripted'])) {
                $query->where('is_prescripted', filter_var($this->filters['is_prescripted'], FILTER_VALIDATE_BOOLEAN));
            }

            $articles = $query->get();

            // 3. Génération du PDF via la vue Blade
            // Configuration pour le format Paysage (Landscape) car il y a beaucoup de colonnes
            $pdf = Pdf::loadView('pdf.articles_export', ['articles' => $articles])
                      ->setPaper('a4', 'landscape');

            // 4. Sauvegarde du fichier sur le disque
            $fileName = 'export_articles_' . $this->hospitalId . '_' . time() . '.pdf';
            $path = 'exports/pdf/' . $fileName;
            
            Storage::disk('public')->put($path, $pdf->output());

            // 5. TODO: Notifier l'utilisateur
            // C'est ici que vous pouvez déclencher un événement ou insérer une notification en base
            // pour dire au frontend : "Votre fichier est prêt, voici le lien : /storage/exports/pdf/..."
            
        } catch (\Exception $e) {
            Log::error("Erreur lors de l'export PDF des articles : " . $e->getMessage());
        }
    }
}