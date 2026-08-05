<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\System\Hospital;
use App\Models\System\SaaSInvoice; // Table de facturation dans la DB System
use App\Services\Tenant\TenantService;
use App\Models\Tenant\Center; // Table dans la DB du client
use App\Models\Tenant\PharmacyBranch;
use App\Models\Tenant\Laboratory;

class GenerateMonthlySaaSInvoices extends Command
{
    protected $signature = 'saas:generate-invoices';
    protected $description = 'Génère les factures mensuelles d\'Asklepios pour tous les hôpitaux clients.';

    public function handle(TenantService $tenantService)
    {
        // 1. On s'assure d'être sur la base de données System
        $tenantService->switchToSystem();

        // 2. On récupère tous les hôpitaux actifs dans notre SaaS
        $hospitals = Hospital::where('status', 'ACTIVE')->get();

        foreach ($hospitals as $hospital) {
            
            // 3. 🚨 ON BASCULE DANS LA BASE DE DONNÉES DU CLIENT
            try {
                $tenantService->switchTo($hospital);

                // 4. On compte les entités actives directement dans SA base de données
                $activeCenters = Center::where('is_active', true)->count();
                $activePharmacies = PharmacyBranch::where('is_active', true)->count();
                $activeLabs = Laboratory::where('is_active', true)->count();

                // 5. On calcule le prix (Ex: 50 000 FCFA / centre, 25 000 / pharmacie...)
                $totalPrice = ($activeCenters * 50000) + ($activePharmacies * 25000) + ($activeLabs * 30000);

            } catch (\Exception $e) {
                $this->error("Impossible de se connecter à la DB de {$hospital->name}");
                continue;
            }

            // 6. 🚨 ON REVIENT DANS LA BASE SYSTEM POUR ENREGISTRER LA FACTURE
            $tenantService->switchToSystem();

            SaaSInvoice::create([
                'hospital_id' => $hospital->id,
                'centers_count' => $activeCenters,
                'pharmacies_count' => $activePharmacies,
                'labs_count' => $activeLabs,
                'total_amount' => $totalPrice,
                'billing_month' => now()->format('Y-m'),
                'status' => 'UNPAID'
            ]);

            $this->info("Facture générée pour {$hospital->name} : {$totalPrice} FCFA");
        }
    }
}