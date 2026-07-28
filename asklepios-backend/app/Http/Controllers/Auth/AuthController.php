<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use OpenApi\Attributes as OA;

#[OA\Info(
    version: "1.0.0",
    title: "Asklepios ERP API Documentation",
    description: "Documentation interactive de l'API Asklepios pour la gestion hospitalière. Permet aux développeurs front-end de tester les requêtes en temps réel.",
    contact: new OA\Contact(
        name: "Support Technique Asklepios",
        email: "admin@asklepios.com"
    )
)]
#[OA\Server(
    url: "http://localhost:8000",
    description: "Serveur API de Développement"
)]
#[OA\SecurityScheme(
    securityScheme: "bearerAuth",
    type: "http",
    description: "Saisissez le jeton (Token) obtenu lors de la connexion pour tester les routes protégées.",
    name: "Authorization",
    in: "header",
    scheme: "bearer",
    bearerFormat: "JWT"
)]
class AuthController extends Controller
{
   #[OA\Post(
        path: "/api/auth/login",
        operationId: "loginUser",
        summary: "Authentifier un utilisateur",
        description: "Vérifie les identifiants de l'utilisateur et retourne un jeton d'accès (Token) ainsi que ses informations de profil, incluant ses licences actives et ses restrictions.",
        tags: ["Authentification"]
    )]
    #[OA\RequestBody(
        required: true,
        description: "Identifiants de connexion requis",
        content: new OA\JsonContent(
            required: ["email", "password"],
            properties: [
                new OA\Property(property: "email", description: "L'adresse email de l'utilisateur", type: "string", format: "email", example: "admin@asklepios.com"),
                new OA\Property(property: "password", description: "Le mot de passe de l'utilisateur", type: "string", format: "password", example: "password123")
            ]
        )
    )]
    #[OA\Response(
        response: 200,
        description: "Connexion réussie",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "token", description: "Jeton d'authentification Laravel Sanctum", type: "string", example: "1|ra67UvPXYZ123456789..."),
                new OA\Property(property: "user", description: "Informations de l'utilisateur encodées au format chaîne JSON", type: "string", example: '{"id":1,"first_name":"John","last_name":"Doe","role":"ceo","email":"admin@asklepios.com","licences":["pharmacy","base_hospital"]}')
            ]
        )
    )]
    #[OA\Response(response: 401, description: "Identifiants invalides", content: new OA\JsonContent(example: "invalid credentials"))]
    #[OA\Response(response: 422, description: "Erreur de validation")]
    public function login(Request $request){
        $request->validate([
            "email"=>"required|string",
            "password"=>"required|string",
        ]);
        
        $credentials = ["email"=>$request->email,"password"=>$request->password];
        
        if(!Auth::attempt($credentials,$remember = true)){
            return response()->json("invalid credentials",401);
        }
        
        $authUser = Auth::user();
        $token = $authUser->createToken("API Token")->plainTextToken;
        
        // --- NOUVELLE LOGIQUE : Récupération des Licences Actives ---
        $licences = [];
        $restrictions = null;
        $hospitalId = null;

        // 1. Déterminer l'ID de l'hôpital selon le profil
        if ($authUser->profile_ceo) {
            $hospitalId = $authUser->profile_ceo->hospital_id;
        } elseif ($authUser->profile_admin) {
            $hospitalId = $authUser->profile_admin->hospital_id;
        } // Ajouter d'autres profils ici si nécessaire (ex: pharmacien)

        // 2. Si un hôpital est lié, on cherche ses abonnements valides (en cours)
        if ($hospitalId) {
            $now = now();
            // On récupère les souscriptions dont la date actuelle est comprise entre le début et la fin
            $activeSubscriptions = \App\Models\Subscription::where('hospital_id', $hospitalId)
                ->where('starting_date', '<=', $now)
                ->where('ending_date', '>=', $now)
                ->with('licences') // Utilise la relation définie dans votre modèle Subscription
                ->get();

            // On extrait les noms des licences
            foreach ($activeSubscriptions as $sub) {
                foreach ($sub->licences as $licence) {
                    $licences[] = $licence->name;
                }
            }
            $licences = array_values(array_unique($licences)); // Éviter les doublons
        }

        // 3. Appliquer les restrictions spécifiques à l'Admin (s'il s'agit d'un admin)
        if ($authUser->profile_admin) {
            // Restriction des licences
            if (!empty($authUser->profile_admin->accessible_licences)) {
                $licences = array_intersect($licences, $authUser->profile_admin->accessible_licences);
                $licences = array_values($licences);
            }

            // Préparation des restrictions géographiques pour le frontend
            $restrictions = [
                'centers'    => $authUser->profile_admin->center_ids ?? 'ALL',
                'pharmacies' => $authUser->profile_admin->pharmacy_branch_ids ?? 'ALL',
                'labs'       => $authUser->profile_admin->laboratory_ids ?? 'ALL',
            ];
        }

        // --- CONSTITUTION DE LA RÉPONSE GLOBALE ---
        $user = [
            "id" => $authUser->id,
            "first_name"=> $authUser->first_name, 
            "last_name"=> $authUser->last_name,
            "role"=> $authUser->role->name,
            "email" => $authUser->email,
            
            // 👉 Ajout des licences et restrictions pour débloquer la Sidebar React
            "licences" => $licences,
            "restrictions" => $restrictions,

            "profile_ceo"=> $authUser->profile_ceo,
            "profile_admin"=> $authUser->profile_admin,
            "profile_doctor"=> $authUser->profile_doctor,
            "profile_lab" => $authUser->profile_lab,
            "profile_reception"=> $authUser->profile_reception, 
            "profile_pharm"=> $authUser->profile_pharm
        ];
        
        $user = json_encode($user);
        
        return response()->json(["token"=>$token,"user"=>$user],200);
    }

    #[OA\Post(
        path: "/api/auth/logout",
        operationId: "logoutUser",
        summary: "Déconnecter l'utilisateur",
        description: "Révoque et supprime le jeton d'accès actuel de l'utilisateur. L'utilisateur doit être connecté pour utiliser cette route.",
        security: [["bearerAuth" => []]],
        tags: ["Authentification"]
    )]
    #[OA\Response(
        response: 200,
        description: "Déconnexion réussie",
        content: new OA\JsonContent(type: "string", example: "logged out")
    )]
    #[OA\Response(
        response: 401,
        description: "Non autorisé (Le token est manquant ou invalide)"
    )]
    
    public function logout(Request $request){
        $request->user()->currentAccessToken()->delete();
        return response()->json("logged out");
    }
}