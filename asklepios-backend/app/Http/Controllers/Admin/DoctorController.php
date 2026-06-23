<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProfileDoctor;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Médecins (Admin)", description: "Gestion du personnel médical de l'hôpital")]
class DoctorController extends Controller
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
        abort(403, "Action refusée. Seul un administrateur peut gérer le personnel médical.");
    }

    /**
     * Lister et filtrer les médecins
     */
    #[OA\Get(
        path: "/api/admin/doctors",
        operationId: "getDoctors",
        summary: "Lister les médecins de l'hôpital",
        security: [["bearerAuth" => []]],
        tags: ["Médecins (Admin)"]
    )]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Recherche par nom, email, téléphone ou spécialité", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "center_id", in: "query", required: false, description: "Filtrer par centre", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "department_id", in: "query", required: false, description: "Filtrer par département", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "paginated", in: "query", required: false, description: "true/false", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Liste récupérée avec succès")]
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        $query = ProfileDoctor::with(['user', 'center', 'department'])
            ->where('hospital_id', $hospitalId);

        // Recherche par mot-clé
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('speciality', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        // Filtres exacts
        if ($request->filled('center_id')) {
            $query->where('center_id', $request->query('center_id'));
        }
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->query('department_id'));
        }

        $query->latest();

        // Mode liste plate pour les React-Select
        if ($request->query('paginated') === 'false') {
            return response()->json($query->get(), 200);
        }

        // Mode paginé (défaut)
        $perPage = $request->query('per_page', 15);
        return response()->json($query->paginate($perPage), 200);
    }

    /**
     * Créer un médecin
     */
    #[OA\Post(
        path: "/api/admin/doctors",
        operationId: "storeDoctor",
        summary: "Créer un profil médecin",
        security: [["bearerAuth" => []]],
        tags: ["Médecins (Admin)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["first_name", "phone", "email", "password", "speciality", "center_id"],
            properties: [
                new OA\Property(property: "first_name", type: "string", example: "Paul"),
                new OA\Property(property: "last_name", type: "string", nullable: true, example: "Durand"),
                new OA\Property(property: "phone", type: "integer", example: 655443322),
                new OA\Property(property: "email", type: "string", example: "paul.durand@hopital.com"),
                new OA\Property(property: "password", type: "string", example: "motdepasse123"),
                new OA\Property(property: "speciality", type: "string", example: "Cardiologue"),
                new OA\Property(property: "specifications", type: "string", nullable: true, example: "Pédiatrique"),
                new OA\Property(property: "center_id", type: "integer", example: 1),
                new OA\Property(property: "department_id", type: "integer", nullable: true, example: 2),
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Médecin créé avec succès")]
    public function store(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $validated = $request->validate([
            'first_name'     => 'required|string|max:255',
            'last_name'      => 'nullable|string|max:255',
            'phone'          => 'required|numeric',
            'email'          => 'required|email|unique:users,email',
            'password'       => 'required|string|min:6',
            'speciality'     => 'required|string|max:255',
            'specifications' => 'nullable|string',
            'center_id'      => [
                'required',
                Rule::exists('centers', 'id')->where('hospital_id', $hospitalId),
            ],
            'department_id'  => 'nullable|exists:departments,id',
        ]);
        $role = Role::where("name","doctor")->first();
        $profile = DB::transaction(function () use ($role, $validated, $hospitalId) {
            $user = User::create([
                'first_name' => $validated['first_name'],
                'last_name'  => $validated['last_name'] ?? null,
                'phone'      => $validated['phone'],
                'email'      => $validated['email'],
                'password'   => Hash::make($validated['password']),
                "role_id"=> $role->id
            ]);

            return ProfileDoctor::create([
                'user_id'        => $user->id,
                'hospital_id'    => $hospitalId,
                'center_id'      => $validated['center_id'],
                'department_id'  => $validated['department_id'] ?? null,
                'speciality'     => $validated['speciality'],
                'specifications' => $validated['specifications'] ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Médecin créé avec succès.',
            'data'    => $profile->load(['user', 'center', 'department'])
        ], 201);
    }

    /**
     * Obtenir les détails d'un médecin
     */
    #[OA\Get(
        path: "/api/admin/doctors/{id}",
        operationId: "showDoctor",
        summary: "Détails d'un médecin",
        security: [["bearerAuth" => []]],
        tags: ["Médecins (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Médecin trouvé avec succès")]
    public function show($id)
    {
        $hospitalId = $this->getHospitalId();
        $profile = ProfileDoctor::with(['user', 'center', 'department'])
            ->where('hospital_id', $hospitalId)
            ->findOrFail($id);

        return response()->json($profile, 200);
    }

    /**
     * Modifier un médecin
     */
    #[OA\Put(
        path: "/api/admin/doctors/{id}",
        operationId: "updateDoctor",
        summary: "Modifier un médecin",
        security: [["bearerAuth" => []]],
        tags: ["Médecins (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Profil médecin mis à jour avec succès")]
    public function update(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();
        
        $profile = ProfileDoctor::with('user')
            ->where('hospital_id', $hospitalId)
            ->findOrFail($id);

        $user = $profile->user;

        $validated = $request->validate([
            'first_name'     => 'sometimes|required|string|max:255',
            'last_name'      => 'nullable|string|max:255',
            'phone'          => 'sometimes|required|numeric',
            'email'          => 'sometimes|required|email|unique:users,email,' . $user->id,
            'password'       => 'nullable|string|min:6',
            'speciality'     => 'sometimes|required|string|max:255',
            'specifications' => 'nullable|string',
            'center_id'      => [
                'sometimes', 'required',
                Rule::exists('centers', 'id')->where('hospital_id', $hospitalId),
            ],
            'department_id'  => 'nullable|exists:departments,id',
        ]);

        DB::transaction(function () use ($validated, $profile, $user) {
            // User Data
            $userData = [];
            if (isset($validated['first_name'])) $userData['first_name'] = $validated['first_name'];
            if (array_key_exists('last_name', $validated)) $userData['last_name'] = $validated['last_name'];
            if (isset($validated['phone'])) $userData['phone'] = $validated['phone'];
            if (isset($validated['email'])) $userData['email'] = $validated['email'];
            if (!empty($validated['password'])) $userData['password'] = Hash::make($validated['password']);

            if (!empty($userData)) $user->update($userData);

            // Profile Data
            $profileData = [];
            if (isset($validated['center_id'])) $profileData['center_id'] = $validated['center_id'];
            if (array_key_exists('department_id', $validated)) $profileData['department_id'] = $validated['department_id'];
            if (isset($validated['speciality'])) $profileData['speciality'] = $validated['speciality'];
            if (array_key_exists('specifications', $validated)) $profileData['specifications'] = $validated['specifications'];

            if (!empty($profileData)) $profile->update($profileData);
        });

        return response()->json([
            'message' => 'Profil médecin mis à jour avec succès.',
            'data'    => $profile->fresh(['user', 'center', 'department'])
        ], 200);
    }

    /**
     * Supprimer un médecin
     */
    #[OA\Delete(
        path: "/api/admin/doctors/{id}",
        operationId: "deleteDoctor",
        summary: "Supprimer un médecin",
        security: [["bearerAuth" => []]],
        tags: ["Médecins (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Médecin supprimé avec succès.")]
    public function destroy($id)
    {
        $hospitalId = $this->getHospitalId();
        
        $profile = ProfileDoctor::where('hospital_id', $hospitalId)->findOrFail($id);
        
        // Supprimer l'utilisateur supprimera automatiquement le ProfileDoctor (onDelete cascade)
        $user = User::findOrFail($profile->user_id);
        $user->delete();

        return response()->json([
            'message' => 'Médecin supprimé avec succès.'
        ], 200);
    }
}