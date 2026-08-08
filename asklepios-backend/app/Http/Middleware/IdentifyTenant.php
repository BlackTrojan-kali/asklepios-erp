<?php

namespace App\Http\Middleware;

use App\Http\Services\Tenant\TenantService;
use Closure;
use Illuminate\Http\Request;
use App\Models\System\SaaSTenant;

class IdentifyTenant
{
    public function __construct(protected TenantService $tenantService) {}

    public function handle(Request $request, Closure $next)
    {
        $host = $request->getHost(); // Récupère 'localhost', '192.168.1.140' ou 'hopital.erp.com'
        
        // 1. Détection intelligente de l'environnement
        if (filter_var($host, FILTER_VALIDATE_IP) || $host === 'localhost') {
            // Si on navigue via une adresse IP (réseau local) ou 'localhost', 
            // on force la recherche sur la valeur par défaut de votre Seeder.
            $domain = 'localhost';
        } else {
            // En production, si on utilise un vrai domaine avec des points,
            // on extrait le sous-domaine proprement.
            $domain = explode('.', $host)[0];
        }
        
        // 2. On cherche la licence dans la base système
        $tenantConfig = SaaSTenant::where('domain', $domain)->where('status', 'ACTIVE')->first();

        if (!$tenantConfig) {
            return response()->json(['error' => 'Licence invalide ou introuvable.'], 403);
        }

        // 3. On bascule la connexion
        $this->tenantService->switchTo($tenantConfig);

        return $next($request);
    }
}