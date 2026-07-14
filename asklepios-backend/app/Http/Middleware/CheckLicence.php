<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Subscription;

class CheckLicence
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string $licenceName Le nom de la licence requise (ex: 'pharmacy')
     */
    public function handle(Request $request, Closure $next, ...$licenceNames): Response
    {
        $user = $request->user();

        // 1. Le Super Admin global passe partout, sans restriction
        if ($user->profile_super_admin) {
            return $next($request);
        }

        // 2. Récupérer l'ID de l'hôpital en fonction du profil de l'utilisateur
        $hospitalId = $this->resolveHospitalId($user);

        if (!$hospitalId) {
            return response()->json(['message' => 'Accès refusé : Aucun hôpital associé à votre profil.'], 403);
        }

        // 3. Chercher l'abonnement actif (Date de début passée, Date de fin dans le futur)
        $subscription = Subscription::with('licences')
            ->where('hospital_id', $hospitalId)
            ->where('starting_date', '<=', now())
            ->where('ending_date', '>=', now())
            ->first();

        // Si aucun abonnement actif n'est trouvé
        if (!$subscription) {
            // Optionnel : Vérifier si le dernier abonnement a expiré pour un meilleur message
            $lastSub = Subscription::where('hospital_id', $hospitalId)->latest('ending_date')->first();
            
            if ($lastSub && $lastSub->ending_date < now()) {
                return response()->json([
                    'message' => 'Accès bloqué : L\'abonnement de votre établissement a expiré le ' . $lastSub->ending_date->format('d/m/Y') . '.'
                ], 402); // 402 = Payment Required
            }

            return response()->json(['message' => 'Accès refusé : Aucun abonnement actif trouvé pour cet établissement.'], 403);
        }

        // 4. L'abonnement est actif, on vérifie s'il contient au moins une des licences demandées
        $hasLicence = false;
        foreach ($licenceNames as $name) {
            $subNames = explode(',', $name);
            foreach ($subNames as $subName) {
                if ($subscription->licences->contains('name', trim($subName))) {
                    $hasLicence = true;
                    break 2;
                }
            }
        }

        if (!$hasLicence) {
            $namesStr = implode(" ou ", $licenceNames);
            return response()->json([
                'message' => "Accès restreint : Votre établissement n'a pas souscrit à la licence '{$namesStr}'."
            ], 403);
        }

        // Tout est en règle, on continue !
        return $next($request);
    }

    /**
     * Méthode utilitaire pour trouver l'hôpital selon le profil actif
     */
    private function resolveHospitalId($user)
    {
        return $user->profile_admin->hospital_id 
            ?? $user->profile_pharm->hospital_id 
            ?? $user->profile_doctor->hospital_id 
            ?? $user->profile_lab?->hospital_id 
          //  ?? $user->profile_lab?->laboratory->hospital_id 
            ?? $user->profile_reception->hospital_id 
            ?? null;
    }
}