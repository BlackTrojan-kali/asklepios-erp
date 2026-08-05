<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Hospital\BloodTransfusion;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class FinishBloodTransfusions extends Command
{
    /**
     * Le nom et la signature de la commande console.
     */
    protected $signature = 'hospital:finish-transfusions';

    /**
     * La description de la commande console.
     */
    protected $description = 'Clôture automatiquement les transfusions sanguines en cours depuis plus de 4 heures.';

    /**
     * Exécution de la commande.
     */
    public function handle()
    {
        // On définit la limite : 4 heures avant l'heure actuelle
        $thresholdTime = Carbon::now()->subHours(4);

        // On récupère toutes les transfusions "en cours" ayant commencé avant cette limite
        $transfusions = BloodTransfusion::where('status', 'ON_GOING')
            ->where('start_time', '<=', $thresholdTime)
            ->get();

        $count = 0;

        foreach ($transfusions as $transfusion) {
            $transfusion->update([
                'status'   => 'FINISHED',
                // On fixe l'heure de fin à +4h après le début (pour la cohérence des données)
                'end_time' => Carbon::parse($transfusion->start_time)->addHours(4)
            ]);
            
            $count++;
        }

        // On garde une trace dans les logs pour l'administrateur
        if ($count > 0) {
            Log::info("Tâche planifiée : {$count} transfusion(s) sanguine(s) clôturée(s) automatiquement.");
            $this->info("{$count} transfusion(s) ont été clôturées avec succès.");
        } else {
            $this->info("Aucune transfusion à clôturer.");
        }
    }
}