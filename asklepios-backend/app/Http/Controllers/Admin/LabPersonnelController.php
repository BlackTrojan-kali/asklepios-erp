<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Services\Security\ScopeResolver;
use App\Models\ProfileLab;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class LabPersonnelController extends Controller
{
    /**
     * Récupère l'ID de l'hôpital de l'administrateur connecté
     */
    private function getHospitalId()
    {
        $user = auth()->user();
        if ($user->profile_admin) {
            return $user->profile_admin->hospital_id;
        } else if ($user->profile_reception) {
            return $user->profile_reception->hospital_id;
        } else if ($user->profile_lab) {
            return $user->profile_lab->laboratory->hospital_id;
        }
        abort(403, "Action refusée. Vous n'avez pas l'autorisation de gérer le personnel de laboratoire.");
    }

    /**
     * Lister les techniciens de laboratoire
     */
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        
        $query = ProfileLab::with(['user', 'laboratory'])
            ->whereHas('laboratory', function ($q) use ($hospitalId) {
                $q->where('hospital_id', $hospitalId);
            });
        
        $query = ScopeResolver::applyLaboratoryScope($query,"laboratory_id");
        // Recherche
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

        if ($request->filled('laboratory_id')) {
            $query->where('laboratory_id', $request->query('laboratory_id'));
        }

        $query->latest();

        if ($request->query('paginated') === 'false') {
            return response()->json($query->get(), 200);
        }

        $perPage = $request->query('per_page', 15);
        return response()->json($query->paginate($perPage), 200);
    }

    /**
     * Créer un technicien de laboratoire
     */
    public function store(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $validated = $request->validate([
            'first_name'     => 'required|string|max:255',
            'last_name'      => 'nullable|string|max:255',
            'phone'          => 'required|numeric',
            'email'          => 'required|email|unique:users,email',
            'password'       => 'required|string|min:6',
            'speciality'     => 'nullable|string|max:255',
            'specifications' => 'nullable|string',
            'lab_roles'      => 'required|array|min:1',
            'lab_roles.*'    => 'string',
            'laboratory_id'  => [
                'required',
                Rule::exists('laboratories', 'id')->where('hospital_id', $hospitalId),
            ],
        ]);

        $role = Role::firstOrCreate(['name' => 'laboratory'], ['description' => 'Technicien de Laboratoire']);

        $profile = DB::transaction(function () use ($role, $validated, $hospitalId) {
            $user = User::create([
                'first_name' => $validated['first_name'],
                'last_name'  => $validated['last_name'] ?? null,
                'phone'      => $validated['phone'],
                'email'      => $validated['email'],
                'password'   => Hash::make($validated['password']),
                'role_id'    => $role->id
            ]);

            return ProfileLab::create([
                'user_id'        => $user->id,
                'hospital_id'    => $hospitalId,
                'laboratory_id'  => $validated['laboratory_id'],
                'speciality'     => $validated['speciality'] ?? '',
                'specifications' => $validated['specifications'] ?? null,
                'lab_roles'      => $validated['lab_roles'],
            ]);
        });

        return response()->json([
            'message' => 'Technicien de laboratoire créé avec succès.',
            'data'    => $profile->load(['user', 'laboratory'])
        ], 201);
    }

    /**
     * Obtenir les détails d'un technicien
     */
    public function show($id)
    {
        $hospitalId = $this->getHospitalId();
        
        $profile = ProfileLab::with(['user', 'laboratory'])
            ->whereHas('laboratory', function ($q) use ($hospitalId) {
                $q->where('hospital_id', $hospitalId);
            })
            ->findOrFail($id);

        return response()->json($profile, 200);
    }

    /**
     * Mettre à jour un technicien de laboratoire
     */
    public function update(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();

        $profile = ProfileLab::whereHas('laboratory', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);
        $user = $profile->user;

        $validated = $request->validate([
            'first_name'     => 'sometimes|required|string|max:255',
            'last_name'      => 'nullable|string|max:255',
            'phone'          => 'sometimes|required|numeric',
            'email'          => [
                'sometimes',
                'required',
                'email',
                Rule::unique('users')->ignore($user->id),
            ],
            'password'       => 'nullable|string|min:6',
            'speciality'     => 'sometimes|nullable|string|max:255',
            'specifications' => 'nullable|string',
            'lab_roles'      => 'sometimes|required|array|min:1',
            'lab_roles.*'    => 'string',
            'laboratory_id'  => [
                'sometimes',
                'required',
                Rule::exists('laboratories', 'id')->where('hospital_id', $hospitalId),
            ],
        ]);

        DB::transaction(function () use ($validated, $user, $profile) {
            $user->update([
                'first_name' => $validated['first_name'] ?? $user->first_name,
                'last_name'  => array_key_exists('last_name', $validated) ? $validated['last_name'] : $user->last_name,
                'phone'      => $validated['phone'] ?? $user->phone,
                'email'      => $validated['email'] ?? $user->email,
            ]);

            if (!empty($validated['password'])) {
                $user->update(['password' => Hash::make($validated['password'])]);
            }

            $profile->update([
                'laboratory_id'  => $validated['laboratory_id'] ?? $profile->laboratory_id,
                'speciality'     => array_key_exists('speciality', $validated) ? $validated['speciality'] : $profile->speciality,
                'specifications' => array_key_exists('specifications', $validated) ? $validated['specifications'] : $profile->specifications,
                'lab_roles'      => $validated['lab_roles'] ?? $profile->lab_roles,
            ]);
        });

        return response()->json([
            'message' => 'Technicien mis à jour avec succès.',
            'data'    => $profile->fresh(['user', 'laboratory'])
        ], 200);
    }

    /**
     * Supprimer un technicien
     */
    public function destroy($id)
    {
        $hospitalId = $this->getHospitalId();
        $profile = ProfileLab::whereHas('laboratory', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        DB::transaction(function () use ($profile) {
            $user = clone $profile->user;
            $profile->delete();
            if ($user) {
                $user->delete();
            }
        });

        return response()->json(['message' => 'Technicien supprimé avec succès.'], 200);
    }
}
