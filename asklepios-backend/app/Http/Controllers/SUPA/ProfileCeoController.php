<?php

namespace App\Http\Controllers\SUPA;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ProfileCeo;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "SuperAdmin - Direction (CEO/DSI/DAF)", 
    description: "Gestion des profils directeurs des hôpitaux par le Super Admin"
)]
class ProfileCeoController extends Controller
{
    #[OA\Get(
        path: "/api/superadmin/ceos",
        operationId: "getSuperAdminCeos",
        summary: "Liste tous les profils (CEO, DSI, DAF)",
        description: "Récupère la liste complète des profils de direction avec les informations de l'utilisateur et de l'hôpital associés.",
        tags: ["SuperAdmin - Direction (CEO/DSI/DAF)"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(
        response: 200,
        description: "Liste récupérée avec succès",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "status", type: "string", example: "success"),
                new OA\Property(property: "data", type: "array", items: new OA\Items(
                    properties: [
                        new OA\Property(property: "id", type: "integer", example: 1),
                        new OA\Property(property: "user_id", type: "integer", example: 5),
                        new OA\Property(property: "hospital_id", type: "integer", example: 2),
                        new OA\Property(property: "type", type: "string", example: "ceo"),
                        new OA\Property(property: "user", type: "object"),
                        new OA\Property(property: "hospital", type: "object")
                    ]
                ))
            ]
        )
    )]
    public function index()
    {
        // On charge la relation user et hospital pour éviter le problème N+1
        $profiles = ProfileCeo::with(['user', 'hospital'])->latest()->get();
        
        return response()->json([
            'status' => 'success',
            'data' => $profiles
        ]);
    }

    #[OA\Post(
        path: "/api/superadmin/ceos",
        operationId: "storeSuperAdminCeo",
        summary: "Créer un nouveau profil (CEO, DSI, DAF)",
        description: "Crée un nouvel utilisateur et l'associe automatiquement à un profil de direction pour un hôpital donné.",
        tags: ["SuperAdmin - Direction (CEO/DSI/DAF)"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["first_name", "phone", "email", "password", "hospital_id", "type"],
            properties: [
                new OA\Property(property: "first_name", type: "string", description: "Prénom", example: "Jean"),
                new OA\Property(property: "last_name", type: "string", description: "Nom de famille", example: "Dupont"),
                new OA\Property(property: "phone", type: "integer", description: "Numéro de téléphone", example: 690000000),
                new OA\Property(property: "email", type: "string", format: "email", example: "directeur@hopital.com"),
                new OA\Property(property: "password", type: "string", format: "password", description: "Minimum 8 caractères", example: "MotDePasseSecurise123"),
                new OA\Property(property: "hospital_id", type: "integer", description: "ID de l'hôpital existant", example: 1),
                new OA\Property(property: "type", type: "string", description: "Rôle dans la direction", enum: ["ceo", "dsi", "daf"], example: "ceo")
            ]
        )
    )]
    #[OA\Response(
        response: 201,
        description: "Profil créé avec succès",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "status", type: "string", example: "success"),
                new OA\Property(property: "message", type: "string", example: "Profil créé avec succès."),
                new OA\Property(property: "data", type: "object")
            ]
        )
    )]
    #[OA\Response(
        response: 422,
        description: "Erreur de validation des données",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "message", type: "string", example: "The given data was invalid."),
                new OA\Property(property: "errors", type: "object")
            ]
        )
    )]
    #[OA\Response(
        response: 500,
        description: "Erreur interne du serveur",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "status", type: "string", example: "error"),
                new OA\Property(property: "message", type: "string", example: "Erreur lors de la création."),
                new OA\Property(property: "error", type: "string")
            ]
        )
    )]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'required|numeric',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string',
            'hospital_id' => 'required|exists:hospitals,id',
            'type' => ['required', Rule::in(['ceo', 'dsi', 'daf'])],
        ]);

        $roleCeo = Role::where("name","ceo")->first();
        try {
            DB::beginTransaction();

            // 1. Création de l'utilisateur de base
            $user = User::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'phone' => $validated['phone'],
                'email' => $validated['email'],
                "role_id"=> $roleCeo->id,
                'password' => Hash::make($validated['password']),
            ]);

            // 2. Création du profil spécifique
            $profile = ProfileCeo::create([
                'user_id' => $user->id,
                'hospital_id' => $validated['hospital_id'],
                'type' => $validated['type'],
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Profil créé avec succès.',
                'data' => $profile->load('user')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors de la création.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    #[OA\Put(
        path: "/api/superadmin/ceos/{id}",
        operationId: "updateSuperAdminCeo",
        summary: "Mettre à jour un profil existant",
        description: "Met à jour les informations de l'utilisateur et/ou du profil CEO/DSI/DAF.",
        tags: ["SuperAdmin - Direction (CEO/DSI/DAF)"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(
        name: "id",
        in: "path",
        required: true,
        description: "ID du profil (ProfileCeo)",
        schema: new OA\Schema(type: "integer", example: 1)
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "first_name", type: "string", example: "Jean-Marc"),
                new OA\Property(property: "last_name", type: "string", example: "Dupont"),
                new OA\Property(property: "phone", type: "integer", example: 690000001),
                new OA\Property(property: "email", type: "string", format: "email", example: "jm.dupont@hopital.com"),
                new OA\Property(property: "password", type: "string", format: "password", description: "Laisser vide pour ne pas modifier"),
                new OA\Property(property: "hospital_id", type: "integer", example: 1),
                new OA\Property(property: "type", type: "string", enum: ["ceo", "dsi", "daf"], example: "dsi")
            ]
        )
    )]
    #[OA\Response(
        response: 200,
        description: "Profil mis à jour avec succès",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "status", type: "string", example: "success"),
                new OA\Property(property: "message", type: "string", example: "Profil mis à jour avec succès."),
                new OA\Property(property: "data", type: "object")
            ]
        )
    )]
    #[OA\Response(
        response: 404,
        description: "Profil introuvable",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "message", type: "string", example: "No query results for model [App\\Models\\ProfileCeo].")
            ]
        )
    )]
    #[OA\Response(
        response: 422,
        description: "Erreur de validation",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "message", type: "string", example: "The email has already been taken."),
                new OA\Property(property: "errors", type: "object")
            ]
        )
    )]
    #[OA\Response(
        response: 500,
        description: "Erreur interne du serveur"
    )]
    public function update(Request $request, $id)
    {
        $profile = ProfileCeo::findOrFail($id);
        $user = $profile->user;

        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'sometimes|numeric',
            // On ignore l'email actuel de l'utilisateur pour la règle d'unicité
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:4',
            'hospital_id' => 'sometimes|exists:hospitals,id',
            'type' => ['sometimes', Rule::in(['ceo', 'dsi', 'daf'])],
        ]);

        try {
            DB::beginTransaction();

            // 1. Mise à jour de l'utilisateur
            if ($request->has('first_name')) $user->first_name = $validated['first_name'];
            if ($request->has('last_name')) $user->last_name = $validated['last_name'];
            if ($request->has('phone')) $user->phone = $validated['phone'];
            if ($request->has('email')) $user->email = $validated['email'];
            if ($request->filled('password')) $user->password = Hash::make($validated['password']);
            
            $user->save();

            // 2. Mise à jour du profil
            if ($request->has('hospital_id')) $profile->hospital_id = $validated['hospital_id'];
            if ($request->has('type')) $profile->type = $validated['type'];
            
            $profile->save();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Profil mis à jour avec succès.',
                'data' => $profile->load('user')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors de la mise à jour.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    #[OA\Delete(
        path: "/api/superadmin/ceos/{id}",
        operationId: "destroySuperAdminCeo",
        summary: "Supprimer un profil",
        description: "Supprime définitivement le profil directeur ainsi que le compte utilisateur associé.",
        tags: ["SuperAdmin - Direction (CEO/DSI/DAF)"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(
        name: "id",
        in: "path",
        required: true,
        description: "ID du profil à supprimer",
        schema: new OA\Schema(type: "integer", example: 1)
    )]
    #[OA\Response(
        response: 200,
        description: "Suppression réussie",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "status", type: "string", example: "success"),
                new OA\Property(property: "message", type: "string", example: "Profil et compte utilisateur supprimés avec succès.")
            ]
        )
    )]
    #[OA\Response(response: 404, description: "Profil introuvable")]
    #[OA\Response(
        response: 500,
        description: "Erreur interne du serveur",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "status", type: "string", example: "error"),
                new OA\Property(property: "message", type: "string", example: "Erreur lors de la suppression."),
                new OA\Property(property: "error", type: "string")
            ]
        )
    )]
    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $profile = ProfileCeo::findOrFail($id);
            $userId = $profile->user_id;

            // Puisque la migration profile_ceos indique `onDelete('cascade')` sur le `user_id`,
            // la suppression directe de l'utilisateur supprimera automatiquement le profil.
            User::destroy($userId);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Profil et compte utilisateur supprimés avec succès.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors de la suppression.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}