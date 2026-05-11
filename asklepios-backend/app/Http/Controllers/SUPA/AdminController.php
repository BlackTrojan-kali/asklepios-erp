<?php

namespace App\Http\Controllers\SUPA;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\ProfileAdmin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Administrateurs (SUPA)", description: "Gestion des administrateurs d'hôpitaux par le Super Admin")]
class AdminController extends Controller
{
    /**
     * Liste paginée et recherche des administrateurs
     */
    #[OA\Get(
        path: "/api/supa/admins",
        operationId: "getAdmins",
        summary: "Lister les administrateurs",
        security: [["bearerAuth" => []]],
        tags: ["Administrateurs (SUPA)"]
    )]
    #[OA\Parameter(name: "search", in: "query", required: false, schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Liste des administrateurs récupérée avec succès")]
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 10);
        $search = $request->query('search');

        $adminRole = Role::where('name', 'admin')->firstOrFail();

        $query = User::where('role_id', $adminRole->id)
                     ->with('profile_admin.hospital');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $admins = $query->latest()->paginate($perPage);

        return response()->json($admins, 200);
    }

    /**
     * Créer un nouvel administrateur et son profil
     */
    #[OA\Post(
        path: "/api/supa/admins",
        operationId: "storeAdmin",
        summary: "Créer un administrateur",
        security: [["bearerAuth" => []]],
        tags: ["Administrateurs (SUPA)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["first_name", "phone", "email", "password", "hospital_id"],
            properties: [
                new OA\Property(property: "first_name", type: "string"),
                new OA\Property(property: "last_name", type: "string"),
                new OA\Property(property: "phone", type: "integer"),
                new OA\Property(property: "email", type: "string"),
                new OA\Property(property: "password", type: "string"),
                new OA\Property(property: "hospital_id", type: "integer")
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Administrateur créé avec succès")]
    #[OA\Response(response: 422, description: "Erreur de validation")]
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'required|numeric',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'hospital_id' => 'required|exists:hospitals,id',
        ]);

        $adminRole = Role::where('name', 'admin')->firstOrFail();

        $user = DB::transaction(function () use ($validatedData, $adminRole) {
            
            $user = User::create([
                'first_name' => $validatedData['first_name'],
                'last_name' => $validatedData['last_name'] ?? null,
                'phone' => $validatedData['phone'],
                'email' => $validatedData['email'],
                'password' => Hash::make($validatedData['password']),
                'role_id' => $adminRole->id,
            ]);

            ProfileAdmin::create([
                'user_id' => $user->id,
                'hospital_id' => $validatedData['hospital_id'],
            ]);

            return $user;
        });

        $user->load('profile_admin.hospital');

        return response()->json([
            'message' => 'Administrateur créé avec succès',
            'data' => $user
        ], 201);
    }

    /**
     * Lire un administrateur spécifique
     */
    #[OA\Get(
        path: "/api/supa/admins/{id}",
        operationId: "showAdmin",
        summary: "Détails d'un administrateur",
        security: [["bearerAuth" => []]],
        tags: ["Administrateurs (SUPA)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Détails récupérés avec succès")]
    #[OA\Response(response: 404, description: "Administrateur non trouvé")]
    public function show($id)
    {
        $adminRole = Role::where('name', 'admin')->firstOrFail();
        
        $admin = User::where('role_id', $adminRole->id)
                     ->with('profile_admin.hospital')
                     ->findOrFail($id);

        return response()->json($admin, 200);
    }

    /**
     * Modifier les informations d'un administrateur
     */
    #[OA\Put(
        path: "/api/supa/admins/{id}",
        operationId: "updateAdmin",
        summary: "Modifier un administrateur",
        security: [["bearerAuth" => []]],
        tags: ["Administrateurs (SUPA)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "first_name", type: "string"),
                new OA\Property(property: "last_name", type: "string"),
                new OA\Property(property: "phone", type: "integer"),
                new OA\Property(property: "email", type: "string"),
                new OA\Property(property: "hospital_id", type: "integer")
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Administrateur modifié avec succès")]
    #[OA\Response(response: 404, description: "Administrateur non trouvé")]
    public function update(Request $request, $id)
    {
        $adminRole = Role::where('name', 'admin')->firstOrFail();
        $user = User::where('role_id', $adminRole->id)->findOrFail($id);

        $validatedData = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'sometimes|required|numeric',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'hospital_id' => 'sometimes|required|exists:hospitals,id',
        ]);

        DB::transaction(function () use ($validatedData, $user) {
            $user->update($validatedData);

            if (isset($validatedData['hospital_id'])) {
                $user->profile_admin()->update([
                    'hospital_id' => $validatedData['hospital_id']
                ]);
            }
        });

        $user->load('profile_admin.hospital');

        return response()->json([
            'message' => 'Administrateur mis à jour avec succès',
            'data' => $user
        ], 200);
    }

    /**
     * Mettre à jour uniquement le mot de passe
     */
    #[OA\Patch(
        path: "/api/supa/admins/{id}/password",
        operationId: "updateAdminPassword",
        summary: "Modifier le mot de passe d'un administrateur",
        security: [["bearerAuth" => []]],
        tags: ["Administrateurs (SUPA)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["password"],
            properties: [
                new OA\Property(property: "password", type: "string", minLength: 8, description: "Nouveau mot de passe")
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Mot de passe modifié avec succès")]
    public function updatePassword(Request $request, $id)
    {
        $adminRole = Role::where('name', 'admin')->firstOrFail();
        $user = User::where('role_id', $adminRole->id)->findOrFail($id);

        $request->validate([
            'password' => 'required|string|min:8',
        ]);

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json([
            'message' => 'Mot de passe mis à jour avec succès'
        ], 200);
    }

    /**
     * Supprimer un administrateur
     */
    #[OA\Delete(
        path: "/api/supa/admins/{id}",
        operationId: "deleteAdmin",
        summary: "Supprimer un administrateur",
        security: [["bearerAuth" => []]],
        tags: ["Administrateurs (SUPA)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Administrateur supprimé avec succès")]
    public function destroy($id)
    {
        $adminRole = Role::where('name', 'admin')->firstOrFail();
        $user = User::where('role_id', $adminRole->id)->findOrFail($id);

        $user->delete();

        return response()->json([
            'message' => 'Administrateur supprimé avec succès'
        ], 200);
    }
}