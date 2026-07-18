<?php

namespace App\Providers;

use App\Models\Pharmacy\Stock;
use App\Observers\StockObserver;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Enregistrer l'observateur pour surveiller le stock
        Stock::observe(StockObserver::class);
        // Écouter toutes les requêtes SQL
        DB::listen(function ($query) {
            // $query->time est en millisecondes
            if ($query->time > 50) { 
                Log::warning('Requête SQL lente détectée', [
                    'sql' => $query->sql,
                    'bindings' => $query->bindings,
                    'time_ms' => $query->time,
                    // optionnel : pour savoir d'où vient la requête
                    // 'url' => request()->fullUrl(), 
                ]);
            }
        });
        //Model::preventLazyLoading(! app()->isProduction());
    }
}
