<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Subscription;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class CheckLicence
{
    public function handle(Request $request, Closure $next, ...$licences): Response
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

        // 3. Chercher le dernier abonnement en date (AVEC CACHE DE 1 HEURE)
        $cacheKey = "hospital_{$hospitalId}_latest_subscription";
        
        $subscription = Cache::remember($cacheKey, 3600, function () use ($hospitalId) {
            return Subscription::with('licences')
                ->where('hospital_id', $hospitalId)
                ->orderBy('ending_date', 'desc') // Prendre l'abonnement avec la date de fin la plus lointaine
                ->first();
        });

        // Si l'hôpital n'a jamais eu d'abonnement
        if (!$subscription) {
            return response()->json(['message' => 'Accès refusé : Aucun abonnement trouvé pour cet établissement.'], 403);
        }

        // 4. Vérification dynamique des dates (calculée à la seconde près, indépendamment du cache)
        $now = now();
        $startingDate = Carbon::parse($subscription->starting_date);
        $endingDate = Carbon::parse($subscription->ending_date);

        // Bloquer si la date du jour a dépassé la date de fin
        if ($now->isAfter($endingDate)) {
            return response()->json([
                'message' => "Accès refusé : Votre abonnement a expiré le {$endingDate->format('d/m/Y')}. Veuillez le renouveler."
            ], 403); // Optionnel : utiliser 402 Payment Required
        }

        // Bloquer si l'abonnement n'a pas encore commencé
        if ($now->isBefore($startingDate)) {
            return response()->json([
                'message' => "Accès refusé : Votre abonnement ne sera actif qu'à partir du {$startingDate->format('d/m/Y')}."
            ], 403);
        }

        // 5. On vérifie si l'abonnement contient AU MOINS UNE des licences demandées
        $hasRequiredLicence = $subscription->licences->whereIn('name', $licences)->isNotEmpty();

        if (!$hasRequiredLicence) {
            $required = implode(' ou ', $licences);
            return response()->json([
                'message' => "Accès restreint : Votre établissement n'a pas souscrit à la licence requise ({$required})."
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