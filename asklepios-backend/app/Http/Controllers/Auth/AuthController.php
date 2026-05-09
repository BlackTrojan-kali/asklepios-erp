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
        description: "Vérifie les identifiants de l'utilisateur et retourne un jeton d'accès (Token) ainsi que ses informations de profil.",
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
                new OA\Property(property: "user", description: "Informations de l'utilisateur encodées au format chaîne JSON", type: "string", example: '{"first_name":"John","last_name":"Doe","role":"super_admin","email":"admin@asklepios.com"}')
            ]
        )
    )]
    #[OA\Response(
        response: 401,
        description: "Identifiants invalides",
        content: new OA\JsonContent(example: "invalid credentials")
    )]
    #[OA\Response(
        response: 422,
        description: "Erreur de validation (champs manquants ou mal formatés)"
    )]

    public function login(Request $request){
        $request->validate([
            "email"=>"required|string",
            "password"=>"required|string",
        ]);
        
        $credentials = ["email"=>$request->email,"password"=>$request->password];
        
        if(!Auth::attempt($credentials,$remember = true)){
            return response()->json("invalid credentials",401);
        }
        
        $token = Auth::user()->createToken("API Token")->plainTextToken;
        
        $user = [
            "first_name"=>Auth::user()->first_name, 
            "last_name"=> Auth::user()->last_name,
            "role"=>Auth::user()->role->name,
            "email" => Auth::user()->email, 
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