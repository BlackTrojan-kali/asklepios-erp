<?php

namespace App\Http\Services\Tenant;
 // ✅ Import du bon modèle

use App\Models\System\SaaSTenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Schema;

class TenantService
{
    protected ?SaaSTenant $currentTenant = null; // ✅ Type mis à jour

    public function switchTo(SaaSTenant $tenant): void // ✅ La méthode accepte maintenant un SaaSTenant
    {
        $this->currentTenant = $tenant;

        // 1. PURGE OBLIGATOIRE POUR OCTANE (Vide le cache de la connexion précédente)
        DB::purge('tenant');

        // 2. On injecte les identifiants avec les vrais noms de colonnes de votre table système
        Config::set('database.connections.tenant.database', $tenant->db_database);
        Config::set('database.connections.tenant.host', $tenant->db_host);
        Config::set('database.connections.tenant.username', $tenant->db_username);
        Config::set('database.connections.tenant.password', $tenant->db_password);

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

    public function getCurrentTenant(): ?SaaSTenant // ✅ Type de retour mis à jour
    {
        return $this->currentTenant;
    }
}