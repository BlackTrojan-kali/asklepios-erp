<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProfileReception;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Réceptionnistes (Admin)", description: "Gestion des réceptionnistes de l'hôpital")]
class ReceptionistController extends Controller
{
    /**
     * Récupère l'ID de l'hôpital de l'administrateur connecté
     */
    private function getHospitalId()
    {
        $user = auth()->user();
        if ($user->profile_admin) {
            return $user->profile_admin->hospital_id;
        }
        abort(403, "Action refusée. Seul un administrateur peut gérer les réceptionnistes.");
    }

    /**
     * Lister et filtrer les réceptionnistes (Paginé)
     */
    #[OA\Get(
        path: "/api/admin/receptionists",
        operationId: "getReceptionists",
        summary: "Lister les réceptionnistes de l'hôpital",
        security: [["bearerAuth" => []]],
        tags: ["Réceptionnistes (Admin)"]
    )]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Recherche par nom, email, ou téléphone", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "center_id", in: "query", required: false, description: "Filtrer par centre", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "per_page", in: "query", required: false, schema: new OA\Schema(type: "integer", default: 15))]
    #[OA\Response(response: 200, description: "Liste récupérée avec succès")]
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        $perPage = $request->query('per_page', 15);

        $query = ProfileReception::with(['user', 'center'])
            ->where('hospital_id', $hospitalId);

        // Filtre par recherche texte (Nom, prénom, email, téléphone du User ou nom du bureau)
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('desk_name', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        // Filtre par centre
        if ($request->filled('center_id')) {
            $query->where('center_id', $request->query('center_id'));
        }

        return response()->json($query->latest()->paginate($perPage), 200);
    }

    /**
     * Créer un nouveau réceptionniste
     */
    #[OA\Post(
        path: "/api/admin/receptionists",
        operationId: "storeReceptionist",
        summary: "Créer un réceptionniste",
        security: [["bearerAuth" => []]],
        tags: ["Réceptionnistes (Admin)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["first_name", "phone", "email", "password", "center_id", "desk_name"],
            properties: [
                new OA\Property(property: "first_name", type: "string", example: "Jeanne"),
                new OA\Property(property: "last_name", type: "string", example: "Dupont"),
                new OA\Property(property: "phone", type: "integer", example: 690000000),
                new OA\Property(property: "email", type: "string", example: "jeanne@asklepios.com"),
                new OA\Property(property: "password", type: "string", example: "password123"),
                new OA\Property(property: "center_id", type: "integer", example: 1),
                new OA\Property(property: "desk_name", type: "string", example: "Accueil Principal"),
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Réceptionniste créé avec succès")]
    public function store(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name'  => 'nullable|string|max:255',
            'phone'      => 'required|numeric',
            'email'      => 'required|email|unique:users,email',
            'password'   => 'required|string|min:6',
            'desk_name'  => 'required|string|max:255',
            'center_id'  => [
                'required',
                Rule::exists('centers', 'id')->where(function ($query) use ($hospitalId) {
                    return $query->where('hospital_id', $hospitalId);
                }),
            ],
        ]);

        $role = Role::where("name","=","reception")->first();
        // Utilisation d'une transaction pour créer l'User + le Profile en toute sécurité
        $profile = DB::transaction(function () use ($role, $validated, $hospitalId) {
            $user = User::create([
                'first_name' => $validated['first_name'],
                'last_name'  => $validated['last_name'] ?? null,
                'phone'      => $validated['phone'],
                'email'      => $validated['email'],
                'password'   => Hash::make($validated['password']),
                "role_id" => $role->id,
            ]);

            return ProfileReception::create([
                'user_id'     => $user->id,
                'hospital_id' => $hospitalId,
                'center_id'   => $validated['center_id'],
                'desk_name'   => $validated['desk_name'],
            ]);
        });

        return response()->json([
            'message' => 'Réceptionniste créé avec succès.',
            'data'    => $profile->load(['user', 'center'])
        ], 201);
    }

    /**
     * Obtenir les détails d'un réceptionniste
     */
    #[OA\Get(
        path: "/api/admin/receptionists/{id}",
        operationId: "showReceptionist",
        summary: "Détails d'un réceptionniste",
        security: [["bearerAuth" => []]],
        tags: ["Réceptionnistes (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Détails trouvés")]
    public function show($id)
    {
        $hospitalId = $this->getHospitalId();
        $profile = ProfileReception::with(['user', 'center'])
            ->where('hospital_id', $hospitalId)
            ->findOrFail($id);

        return response()->json($profile, 200);
    }

    /**
     * Modifier un réceptionniste
     */
    #[OA\Put(
        path: "/api/admin/receptionists/{id}",
        operationId: "updateReceptionist",
        summary: "Modifier un réceptionniste",
        security: [["bearerAuth" => []]],
        tags: ["Réceptionnistes (Admin)"]
    )]
    #[OA\Response(response: 200, description: "Réceptionniste mis à jour")]
    public function update(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();
        
        $profile = ProfileReception::with('user')
            ->where('hospital_id', $hospitalId)
            ->findOrFail($id);

        $user = $profile->user;

        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'last_name'  => 'nullable|string|max:255',
            'phone'      => 'sometimes|required|numeric',
            'email'      => 'sometimes|required|email|unique:users,email,' . $user->id,
            'password'   => 'nullable|string|min:6',
            'desk_name'  => 'sometimes|required|string|max:255',
            'center_id'  => [
                'sometimes', 'required',
                Rule::exists('centers', 'id')->where(function ($query) use ($hospitalId) {
                    return $query->where('hospital_id', $hospitalId);
                }),
            ],
        ]);

        DB::transaction(function () use ($validated, $profile, $user) {
            // Mise à jour de l'utilisateur
            $userData = [];
            if (isset($validated['first_name'])) $userData['first_name'] = $validated['first_name'];
            if (array_key_exists('last_name', $validated)) $userData['last_name'] = $validated['last_name'];
            if (isset($validated['phone'])) $userData['phone'] = $validated['phone'];
            if (isset($validated['email'])) $userData['email'] = $validated['email'];
            if (!empty($validated['password'])) $userData['password'] = Hash::make($validated['password']);

            if (!empty($userData)) {
                $user->update($userData);
            }

            // Mise à jour du profil de réception
            $profileData = [];
            if (isset($validated['center_id'])) $profileData['center_id'] = $validated['center_id'];
            if (isset($validated['desk_name'])) $profileData['desk_name'] = $validated['desk_name'];

            if (!empty($profileData)) {
                $profile->update($profileData);
            }
        });

        return response()->json([
            'message' => 'Réceptionniste mis à jour avec succès.',
            'data'    => $profile->fresh(['user', 'center'])
        ], 200);
    }

    /**
     * Supprimer un réceptionniste
     */
    #[OA\Delete(
        path: "/api/admin/receptionists/{id}",
        operationId: "deleteReceptionist",
        summary: "Supprimer un réceptionniste",
        security: [["bearerAuth" => []]],
        tags: ["Réceptionnistes (Admin)"]
    )]
    #[OA\Response(response: 200, description: "Réceptionniste supprimé")]
    public function destroy($id)
    {
        $hospitalId = $this->getHospitalId();
        
        $profile = ProfileReception::where('hospital_id', $hospitalId)->findOrFail($id);
        
        // Comme défini dans ta migration (onDelete cascade), 
        // supprimer l'utilisateur supprimera automatiquement le ProfileReception
        $user = User::findOrFail($profile->user_id);
        $user->delete();

        return response()->json([
            'message' => 'Réceptionniste supprimé avec succès.'
        ], 200);
    }
}