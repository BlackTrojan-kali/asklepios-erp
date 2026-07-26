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

        // 0. Sécurité : Vérifier que l'utilisateur est bien authentifié
        if (!$user) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        // 1. Le Super Admin global passe partout (Utilisation de ?-> pour éviter les erreurs null)
        if ($user->role?->name === 'super_admin') {
            return $next($request);
        }

        // 2. Récupérer l'ID de l'hôpital de manière optimisée
        $hospitalId = $this->resolveHospitalId($user);

        // CAS SPÉCIAL : Laboratoire autonome (non rattaché à un hôpital)
        // Pour un laborantin sans hospital_id, on cherche l'abonnement via le laboratory_id
        if (!$hospitalId && $user->role?->name === 'laboratory') {
            $laboratoryId = $user->profile_lab?->laboratory_id;
            if (!$laboratoryId) {
                return response()->json(['message' => 'Accès refusé : Aucun laboratoire associé à votre profil.'], 403);
            }

            // Chercher l'abonnement rattaché à ce laboratoire via son hospital_id nul (laboratoire indépendant)
            // On suppose que le laboratoire autonome a son propre abonnement avec hospital_id = laboratory.hospital_id ou 
            // qu'il est géré sans hôpital : on laisse passer si la licence est bien "laboratory"
            // Pour un labo totalement autonome, on skip le contrôle de licence et laisse passer.
            return $next($request);
        }

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

        // 4. Vérification dynamique des dates (Ajustement avec startOfDay et endOfDay)
        $now = now();
        $startingDate = Carbon::parse($subscription->starting_date)->startOfDay();
        $endingDate = Carbon::parse($subscription->ending_date)->endOfDay(); // Valide jusqu'à 23h59 le dernier jour

        // Bloquer si la date du jour a dépassé la date de fin
        if ($now->isAfter($endingDate)) {
            return response()->json([
                'message' => "Accès refusé : Votre abonnement a expiré le {$endingDate->format('d/m/Y')}. Veuillez le renouveler."
            ], 402); // 402 Payment Required est sémantiquement parfait ici
        }

        // Bloquer si l'abonnement n'a pas encore commencé
        if ($now->isBefore($startingDate)) {
            return response()->json([
                'message' => "Accès refusé : Votre abonnement ne sera actif qu'à partir du {$startingDate->format('d/m/Y')}."
            ], 403);
        }

        // 5. On vérifie les licences UNIQUEMENT si la route en exige une
        if (!empty($licences)) {
            $hasRequiredLicence = $subscription->licences->whereIn('name', $licences)->isNotEmpty();

            if (!$hasRequiredLicence) {
                $required = implode(' ou ', $licences);
                return response()->json([
                    'message' => "Accès restreint : Votre établissement n'a pas souscrit à la licence requise ({$required})."
                ], 403);
            }
        }

        return $next($request);
    }

    /**
     * Méthode utilitaire OPTIMISÉE
     */
    private function resolveHospitalId($user)
    {
        // Utilisation du Nullsafe operator (?->) pour éviter les crashs si le rôle n'est pas chargé
        $role = $user->role?->name ?? '';

        return match($role) {
            'admin'      => $user->profile_admin?->hospital_id ?? null,
            'pharmacy'   => $user->profile_pharm?->hospital_id ?? null,
            'doctor'     => $user->profile_doctor?->hospital_id ?? null,
            'laboratory' => $user->profile_lab?->hospital_id ?? null,  // ✅ Corrigé : 'lab' → 'laboratory'
            'reception'  => $user->profile_reception?->hospital_id ?? null,
            default      => null,
        };
    }
}