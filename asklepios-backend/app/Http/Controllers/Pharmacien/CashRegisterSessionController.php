<?php

namespace App\Http\Controllers\Pharmacien;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Pharmacy\CashRegister;
use App\Models\Pharmacy\CashRegisterSession;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class CashRegisterSessionController extends Controller
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
     * Ouvrir une session de caisse (Pharmacien caissier uniquement)
     */
    public function openSession(Request $request, $id)
    {
        if (Auth::user()->role->name !== 'pharmacy') {
            return response()->json(['message' => 'Seul un pharmacien caissier peut gérer les sessions de caisse.'], 403);
        }

        $hospitalId = $this->getHospitalId();

        $register = CashRegister::whereHas('branch', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        if ($register->status !== 'active') {
            return response()->json(['message' => 'Cette caisse est inactive.'], 400);
        }

        // Vérifier si la caisse a déjà une session ouverte
        if ($register->activeSession()->exists()) {
            return response()->json(['message' => 'Cette caisse a déjà une session active ouverte.'], 400);
        }

        // Vérifier si l'utilisateur connecté a déjà une session active dans n'importe quelle caisse
        $userId = Auth::id();
        $userActiveSession = CashRegisterSession::where('user_id', $userId)
            ->whereNull('closed_at')
            ->first();

        if ($userActiveSession) {
            return response()->json([
                'message' => 'Vous avez déjà une session active ouverte sur la caisse : ' . $userActiveSession->register->name
            ], 400);
        }

        $validated = $request->validate([
            'opening_balance' => 'required|numeric|min:0',
        ]);

        $session = CashRegisterSession::create([
            'cash_register_id' => $register->id,
            'user_id' => $userId,
            'opened_at' => now(),
            'opening_balance' => $validated['opening_balance'],
        ]);

        return response()->json($session->load('user'), 201);
    }

    /**
     * Fermer une session de caisse (Pharmacien caissier uniquement)
     */
    public function closeSession(Request $request, $sessionId)
    {
        if (Auth::user()->role->name !== 'pharmacy') {
            return response()->json(['message' => 'Seul un pharmacien caissier peut gérer les sessions de caisse.'], 403);
        }

        $hospitalId = $this->getHospitalId();

        $session = CashRegisterSession::whereHas('register.branch', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($sessionId);

        if ($session->closed_at !== null) {
            return response()->json(['message' => 'Cette session est déjà fermée.'], 400);
        }

        // Vérifier que la session appartient bien à l'utilisateur connecté
        if ($session->user_id !== Auth::id()) {
            return response()->json(['message' => 'Vous ne pouvez pas fermer une session qui ne vous appartient pas.'], 403);
        }

        $validated = $request->validate([
            'closing_balance' => 'required|numeric|min:0',
            'password' => 'required|string',
        ]);

        // Vérifier le mot de passe de l'utilisateur
        if (!Hash::check($validated['password'], Auth::user()->password)) {
            return response()->json(['message' => 'Le mot de passe fourni est incorrect.'], 422);
        }

        $session->update([
            'closed_at' => now(),
            'closing_balance' => $validated['closing_balance'],
        ]);

        return response()->json($session->load('user'), 200);
    }

    /**
     * Récupérer la session active de l'utilisateur connecté
     */
    public function myActiveSession()
    {
        if (Auth::user()->role->name !== 'pharmacy') {
            return response()->json(null, 200);
        }

        $userId = Auth::id();
        $session = CashRegisterSession::where('user_id', $userId)
            ->whereNull('closed_at')
            ->with(['register.branch', 'user'])
            ->first();

        if ($session) {
            $salesQuery = \App\Models\Pharmacy\PosSale::where('cash_register_session_id', $session->id);
            
            $cash = (float)$salesQuery->clone()->where('payment_method', 'CASH')->sum('total_amount');
            $mobileMoney = (float)$salesQuery->clone()->where('payment_method', 'MOBILE_MONEY')->sum('total_amount');
            $card = (float)$salesQuery->clone()->where('payment_method', 'CARD')->sum('total_amount');

            $session->sales_totals = [
                'cash' => $cash,
                'mobile_money' => $mobileMoney,
                'card' => $card,
            ];
            
            $session->current_balance = (float)$session->opening_balance + $cash;
        }

        return response()->json($session, 200);
    }
}
