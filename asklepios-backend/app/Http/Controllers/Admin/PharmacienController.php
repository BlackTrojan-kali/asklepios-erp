<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ProfilePharm;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Pharmaciens (Admin)", description: "Gestion du personnel de la pharmacie (Création compte + Affectation)")]
class PharmacienController extends Controller
{
    /**
     * Obtenir l'ID de l'hôpital de l'administrateur connecté
     */
    private function getHospitalId()
    {
        return auth()->user()->profile_admin->hospital_id;
    }

    /**
     * Lister et filtrer les pharmaciens (Sans pagination)
     */
    #[OA\Get(
        path: "/api/admin/pharmaciens",
        operationId: "getAdminPharmaciens",
        summary: "Lister les pharmaciens",
        security: [["bearerAuth" => []]],
        tags: ["Pharmaciens (Admin)"]
    )]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Nom, email ou téléphone", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "position", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["magasin", "vente"]))]
    #[OA\Parameter(name: "branch_id", in: "query", required: false, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste récupérée avec succès")]
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $query = ProfilePharm::with(['user', 'branch'])
            ->where('hospital_id', $hospitalId);

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('position')) {
            $query->where('position', $request->query('position'));
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->query('branch_id'));
        }

        return response()->json($query->latest()->get(), 200);
    }

    /**
     * Lister et filtrer les pharmaciens (AVEC pagination)
     */
    #[OA\Get(
        path: "/api/admin/pharmaciens/paginated",
        operationId: "getAdminPharmaciensPaginated",
        summary: "Lister les pharmaciens avec pagination",
        security: [["bearerAuth" => []]],
        tags: ["Pharmaciens (Admin)"]
    )]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Nom, email ou téléphone", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "position", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["magasin", "vente"]))]
    #[OA\Parameter(name: "branch_id", in: "query", required: false, schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "per_page", in: "query", required: false, description: "Nombre d'éléments par page (défaut: 15)", schema: new OA\Schema(type: "integer", default: 15))]
    #[OA\Response(response: 200, description: "Liste paginée récupérée avec succès")]
    public function indexPaginated(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $query = ProfilePharm::with(['user', 'branch'])
            ->where('hospital_id', $hospitalId);

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('position')) {
            $query->where('position', $request->query('position'));
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->query('branch_id'));
        }

        // Récupère le paramètre per_page, ou utilise 15 par défaut
        $perPage = $request->query('per_page', 15);

        return response()->json($query->latest()->paginate($perPage), 200);
    }

    /**
     * Créer un pharmacien (Compte User + Profil)
     */
    #[OA\Post(
        path: "/api/admin/pharmaciens",
        operationId: "storeAdminPharmacien",
        summary: "Créer un pharmacien",
        security: [["bearerAuth" => []]],
        tags: ["Pharmaciens (Admin)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["first_name", "phone", "email", "password", "position", "branch_id"],
            properties: [
                new OA\Property(property: "first_name", type: "string"),
                new OA\Property(property: "last_name", type: "string", nullable: true),
                new OA\Property(property: "phone", type: "integer"),
                new OA\Property(property: "email", type: "string", format: "email"),
                new OA\Property(property: "password", type: "string", format: "password"),
                new OA\Property(property: "position", type: "string", enum: ["magasin", "vente"]),
                new OA\Property(property: "branch_id", type: "integer")
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Pharmacien créé avec succès")]
    public function store(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $validated = $request->validate([
            // Validation User
            'first_name' => 'required|string|max:255',
            'last_name'  => 'nullable|string|max:255',
            'phone'      => 'required|numeric',
            'email'      => 'required|string|email|max:255|unique:users',
            'password'   => 'required|string|min:6',
            
            // Validation ProfilePharm
            'position'   => 'required|in:magasin,vente',
            'branch_id'  => [
                'required',
                Rule::exists('pharmacy_branches', 'id')->where('hospital_id', $hospitalId),
            ],
        ]);
        
        $rolePharm = Role::where("name","pharmacy")->first();
        
        // Transaction DB pour garantir la création couplée
        $profile = DB::transaction(function () use ( $rolePharm, $validated, $hospitalId) {
            
            // 1. Création de l'utilisateur
            $user = User::create([
                'first_name' => $validated['first_name'],
                'last_name'  => $validated['last_name'],
                'phone'      => $validated['phone'],
                'email'      => $validated['email'],
                'password'   => Hash::make($validated['password']),
                "role_id"    => $rolePharm->id
            ]);

            // 2. Création du profil pharmacien
            $profilePharm = ProfilePharm::create([
                'user_id'     => $user->id,
                'hospital_id' => $hospitalId,
                'branch_id'   => $validated['branch_id'],
                'position'    => $validated['position'],
            ]);

            return $profilePharm->load(['user', 'branch']);
        });

        return response()->json([
            'message' => 'Pharmacien enregistré avec succès',
            'data'    => $profile
        ], 201);
    }

    /**
     * Modifier un pharmacien
     */
    #[OA\Put(
        path: "/api/admin/pharmaciens/{id}",
        operationId: "updateAdminPharmacien",
        summary: "Modifier un pharmacien",
        security: [["bearerAuth" => []]],
        tags: ["Pharmaciens (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "first_name", type: "string"),
                new OA\Property(property: "last_name", type: "string", nullable: true),
                new OA\Property(property: "phone", type: "integer"),
                new OA\Property(property: "email", type: "string", format: "email"),
                new OA\Property(property: "password", type: "string", format: "password"),
                new OA\Property(property: "position", type: "string", enum: ["magasin", "vente"]),
                new OA\Property(property: "branch_id", type: "integer")
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Pharmacien modifié avec succès")]
    public function update(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();

        // Récupérer le profil et l'utilisateur lié
        $profile = ProfilePharm::where('hospital_id', $hospitalId)->findOrFail($id);
        $user = $profile->user;

        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'last_name'  => 'nullable|string|max:255',
            'phone'      => 'sometimes|required|numeric',
            'email'      => [
                'sometimes', 'required', 'string', 'email', 'max:255',
                Rule::unique('users')->ignore($user->id), // Ignorer l'email actuel
            ],
            'password'   => 'nullable|string|min:6',
            
            'position'   => 'sometimes|required|in:magasin,vente',
            'branch_id'  => [
                'sometimes', 'required',
                Rule::exists('pharmacy_branches', 'id')->where('hospital_id', $hospitalId),
            ],
        ]);

        DB::transaction(function () use ($validated, $user, $profile) {
            
            // 1. Mise à jour du User
            $userData = [];
            if (isset($validated['first_name'])) $userData['first_name'] = $validated['first_name'];
            if (isset($validated['last_name'])) $userData['last_name'] = $validated['last_name'];
            if (isset($validated['phone'])) $userData['phone'] = $validated['phone'];
            if (isset($validated['email'])) $userData['email'] = $validated['email'];
            if (!empty($validated['password'])) {
                $userData['password'] = Hash::make($validated['password']);
            }
            
            if(!empty($userData)) {
                $user->update($userData);
            }

            // 2. Mise à jour du Profil
            $profileData = [];
            if (isset($validated['position'])) $profileData['position'] = $validated['position'];
            if (isset($validated['branch_id'])) $profileData['branch_id'] = $validated['branch_id'];

            if(!empty($profileData)) {
                $profile->update($profileData);
            }
        });

        return response()->json([
            'message' => 'Pharmacien mis à jour avec succès',
            'data'    => $profile->fresh(['user', 'branch'])
        ], 200);
    }

    /**
     * Supprimer un pharmacien
     */
    #[OA\Delete(
        path: "/api/admin/pharmaciens/{id}",
        operationId: "deleteAdminPharmacien",
        summary: "Supprimer un pharmacien",
        security: [["bearerAuth" => []]],
        tags: ["Pharmaciens (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Pharmacien supprimé avec succès")]
    public function destroy($id)
    {
        $hospitalId = $this->getHospitalId();

        $profile = ProfilePharm::where('hospital_id', $hospitalId)->findOrFail($id);
        
        // En supprimant l'utilisateur, la contrainte 'onDelete("cascade")' 
        // supprimera automatiquement la ligne dans 'profile_pharms'
        $profile->user->delete();

        return response()->json([
            'message' => 'Pharmacien supprimé du système avec succès'
        ], 200);
    }
}