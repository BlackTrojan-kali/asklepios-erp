<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy\CashRegister;
use App\Models\Pharmacy\CashRegisterSession;
use App\Models\Pharmacy\PharmacyBranch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use OpenApi\Attributes as OA;

class CashRegisterController extends Controller
{
    private function getHospitalId()
    {
        $user = Auth::user();
        if ($user->profile_admin) {
            return $user->profile_admin->hospital_id;
        } else if ($user->profile_pharm) {
            return $user->profile_pharm->hospital_id ?? $user->profile_pharm->branch->hospital_id ?? null;
        }
        abort(403, "Profil non autorisé.");
    }

    /**
     * Lister les caisses de l'hôpital (filtre par branche optionnel)
     */
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        
        $query = CashRegister::whereHas('branch', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->with(['activeSession.user', 'branch']);

        if ($request->filled('pharmacy_branch_id')) {
            $query->where('pharmacy_branch_id', $request->query('pharmacy_branch_id'));
        }

        return response()->json($query->get(), 200);
    }

    /**
     * Détails d'une caisse
     */
    public function show($id)
    {
        $hospitalId = $this->getHospitalId();
        
        $register = CashRegister::whereHas('branch', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->with(['activeSession.user', 'branch'])->findOrFail($id);

        return response()->json($register, 200);
    }

    /**
     * Créer une nouvelle caisse (Admin uniquement)
     */
    public function store(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'pharmacy_branch_id' => 'required|integer|exists:pharmacy_branches,id',
            'status' => 'nullable|string|in:active,inactive',
        ]);

        // Vérifier que la branche appartient bien à l'hôpital
        $branch = PharmacyBranch::where('hospital_id', $hospitalId)->findOrFail($validated['pharmacy_branch_id']);

        $register = CashRegister::create([
            'name' => $validated['name'],
            'pharmacy_branch_id' => $validated['pharmacy_branch_id'],
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json($register->load(['activeSession.user', 'branch']), 201);
    }

    /**
     * Modifier une caisse (Admin uniquement)
     */
    public function update(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();

        $register = CashRegister::whereHas('branch', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'status' => 'sometimes|required|string|in:active,inactive',
        ]);

        $register->update($validated);

        return response()->json($register->load(['activeSession.user', 'branch']), 200);
    }

    /**
     * Supprimer une caisse (Admin uniquement)
     */
    public function destroy($id)
    {
        $hospitalId = $this->getHospitalId();

        $register = CashRegister::whereHas('branch', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        // Empêcher la suppression s'il y a une session active
        if ($register->activeSession()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer cette caisse car elle a une session active en cours.'
            ], 400);
        }

        $register->delete();

    }
}
