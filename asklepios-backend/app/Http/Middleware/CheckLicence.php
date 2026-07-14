<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Subscription;
use Illuminate\Support\Facades\Cache;

class CheckLicence
{
    public function handle(Request $request, Closure $next, string $licenceName): Response
    {
        $user = $request->user();

        // 1. Le Super Admin global passe partout
        if ($user->role->name === 'super_admin') {
            return $next($request);
        }

        // 2. Récupérer l'ID de l'hôpital de manière optimisée
        $hospitalId = $this->resolveHospitalId($user);

        if (!$hospitalId) {
            return response()->json(['message' => 'Accès refusé : Aucun hôpital associé à votre profil.'], 403);
        }

        // 3. Chercher l'abonnement actif (AVEC CACHE DE 1 HEURE)
        $cacheKey = "hospital_{$hospitalId}_active_subscription";
        
        $subscription = Cache::remember($cacheKey, 3600, function () use ($hospitalId) {
            return Subscription::with('licences')
                ->where('hospital_id', $hospitalId)
                ->where('starting_date', '<=', now())
                ->where('ending_date', '>=', now())
                ->first();
        });

        // Si aucun abonnement actif
        if (!$subscription) {
            return response()->json(['message' => 'Accès refusé : Aucun abonnement actif trouvé pour cet établissement.'], 403);
        }

        // 4. On vérifie s'il contient la licence demandée
        if (!$subscription->licences->contains('name', $licenceName)) {
            return response()->json([
                'message' => "Accès restreint : Votre établissement n'a pas souscrit à la licence '{$licenceName}'."
            ], 403);
        }

        return $next($request);
    }

    /**
     * Méthode utilitaire OPTIMISÉE (0 requête SQL inutile)
     */
    private function resolveHospitalId($user)
    {
        $role = $user->role->name ?? '';

        // Selon le rôle, on ne tape qu'une seule fois dans la bonne table de profil
        return match($role) {
            'admin'     => $user->profile_admin->hospital_id ?? null,
            'pharmacy'  => $user->profile_pharm->hospital_id ?? null,
            'doctor'    => $user->profile_doctor->hospital_id ?? null,
            'lab'       => $user->profile_lab->hospital_id ?? null,
            'reception' => $user->profile_reception->hospital_id ?? null,
            default     => null,
        };
    }
}