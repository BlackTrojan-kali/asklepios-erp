<?php

namespace App\Http\Middleware;

use App\HttpServices\Tenant\TenantService;
use Closure;
use Illuminate\Http\Request;
use App\Models\System\SaaSTenant; // 👉 On utilise le modèle de routage

class IdentifyTenant
{
    public function __construct(protected TenantService $tenantService) {}

    public function handle(Request $request, Closure $next)
    {
        $domain = explode('.', $request->getHost())[0];
        
        // 1. On cherche la licence dans la base système
        $tenantConfig = SaaSTenant::where('domain', $domain)->where('status', 'ACTIVE')->first();

        if (!$tenantConfig) {
            return response()->json(['error' => 'Licence invalide ou introuvable.'], 403);
        }

        // 2. On bascule la connexion (votre TenantService actuel)
        $this->tenantService->switchTo($tenantConfig);

        // 3. À partir d'ici, Laravel est connecté à la DB du client !
        // Si vous faites Hospital::first(), ça ira lire dans la table "hospitals" du client.
        return $next($request);
    }
}