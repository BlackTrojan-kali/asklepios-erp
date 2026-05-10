<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Gère la requête entrante.
     * Le paramètre ...$roles permet de récupérer une liste dynamique de rôles séparés par des virgules.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // 1. Vérifier si l'utilisateur est bien connecté
        if (! $request->user()) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        // 2. Récupérer le rôle de l'utilisateur
        // En me basant sur ton AuthController, ton rôle est accessible via la relation ->role->name
        $userRole = $request->user()->role->name ?? null;

        // 3. Vérifier si le rôle de l'utilisateur est dans le tableau des rôles autorisés
        if (! in_array($userRole, $roles)) {
            return response()->json([
                'message' => 'Accès refusé. Vous n\'avez pas les permissions nécessaires.'
            ], 403); // 403 = Forbidden (Interdit)
        }

        // Si tout est bon, on laisse passer la requête
        return $next($request);
    }
}