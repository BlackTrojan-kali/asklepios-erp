<?php

namespace App\Console\Commands;

use App\Models\Hospital\Appointment;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CancelMissedAppointments extends Command
{
    /**
     * Le nom et la signature de la commande console.
     */
    protected $signature = 'appointments:cancel-missed';

    /**
     * La description de la commande.
     */
    protected $description = 'Annule automatiquement les rendez-vous dont l\'heure est dépassée et qui sont toujours au statut SCHEDULED.';

    /**
     * Exécution de la commande.
     */
    public function handle()
    {
        // On récupère la date et l'heure actuelles
        $now = now();

        // Mise à jour de masse pour des performances optimales
        $updatedCount = Appointment::where('status', 'SCHEDULED')
            ->where('scheduled_datetime', '<', $now)
            ->update(['status' => 'CANCELLED']);

        if ($updatedCount > 0) {
            $this->info("{$updatedCount} rendez-vous ont été annulés automatiquement.");
            Log::info("Automatisation : {$updatedCount} rendez-vous expirés ont été passés en CANCELLED.");
        } else {
            $this->info("Aucun rendez-vous expiré à annuler.");
        }
    }
}