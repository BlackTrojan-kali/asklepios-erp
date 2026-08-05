<?php

namespace App\HttpServices\Tenant;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Schema;
use App\Models\System\Hospital;

class TenantService
{
    protected ?Hospital $currentTenant = null;

    public function switchTo(Hospital $tenant): void
    {
        $this->currentTenant = $tenant;

        // 1. PURGE OBLIGATOIRE POUR OCTANE (Vide le cache de la connexion précédente)
        DB::purge('tenant');

        // 2. On injecte les identifiants de la base de cet hôpital
        Config::set('database.connections.tenant.database', $tenant->database_name);
        Config::set('database.connections.tenant.host', $tenant->database_host);
        Config::set('database.connections.tenant.username', $tenant->database_username);
        Config::set('database.connections.tenant.password', $tenant->database_password);

        // 3. On reconnecte
        DB::reconnect('tenant');

        // 4. On dit à Laravel que TOUTES les requêtes modèles utilisent 'tenant' maintenant
        DB::setDefaultConnection('tenant');
        Schema::connection('tenant');
    }

    public function switchToSystem(): void
    {
        $this->currentTenant = null;
        DB::purge('tenant');
        DB::setDefaultConnection('system');
        Schema::connection('system');
    }

    public function getCurrentTenant(): ?Hospital
    {
        return $this->currentTenant;
    }
}