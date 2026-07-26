<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Pharmacy\CashRegisterSession;
use Illuminate\Support\Facades\Auth;

class RequireActiveCashSession
{
    /**
     * Gère la requête entrante.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        // 1. Vérifier l'authentification de l'utilisateur
        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        // 2. N'appliquer la restriction que pour le rôle pharmacien caissier
        if ($user->role->name === 'pharmacy') {
            $activeSession = CashRegisterSession::where('user_id', $user->id)
                ->whereNull('closed_at')
                ->first();

            if (!$activeSession) {
                return response()->json([
                    'message' => 'Vous n\'avez pas de session de caisse active ouverte. Veuillez d\'abord ouvrir une session.'
                ], 403);
            }
        }

        return $next($request);
    }
}
