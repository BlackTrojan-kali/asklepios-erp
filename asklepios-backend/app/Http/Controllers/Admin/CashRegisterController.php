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

#[OA\Tag(name: "Caisses (Admin)", description: "Configuration et administration des caisses physiques de la pharmacie")]
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
    #[OA\Get(
        path: "/api/admin/cash-registers",
        operationId: "getAdminCashRegisters",
        summary: "Lister les caisses de l'hôpital (filtre par branche optionnel)",
        security: [["bearerAuth" => []]],
        tags: ["Caisses (Admin)"]
    )]
    #[OA\Parameter(name: "pharmacy_branch_id", in: "query", required: false, description: "ID de la succursale", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste des caisses récupérée avec succès")]
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
    #[OA\Get(
        path: "/api/admin/cash-registers/{id}",
        operationId: "getAdminCashRegisterDetails",
        summary: "Détails d'une caisse",
        security: [["bearerAuth" => []]],
        tags: ["Caisses (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la caisse", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Détails de la caisse récupérés avec succès")]
    #[OA\Response(response: 404, description: "Caisse non trouvée")]
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
    #[OA\Post(
        path: "/api/admin/cash-registers",
        operationId: "storeAdminCashRegister",
        summary: "Créer une nouvelle caisse (Admin uniquement)",
        security: [["bearerAuth" => []]],
        tags: ["Caisses (Admin)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["name", "pharmacy_branch_id"],
            properties: [
                new OA\Property(property: "name", type: "string", example: "Caisse 1"),
                new OA\Property(property: "pharmacy_branch_id", type: "integer", example: 1),
                new OA\Property(property: "status", type: "string", enum: ["active", "inactive"], example: "active")
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Caisse créée avec succès")]
    #[OA\Response(response: 404, description: "Succursale non trouvée")]
    #[OA\Response(response: 422, description: "Erreur de validation")]
    public function store(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'pharmacy_branch_id' => 'required|integer|exists:pharmacy_branches,id',
            'status' => 'nullable|string|in:active,inactive',
            'merchant_code' => 'nullable|string|max:255',
        ]);

        // Vérifier que la branche appartient bien à l'hôpital
        $branch = PharmacyBranch::where('hospital_id', $hospitalId)->findOrFail($validated['pharmacy_branch_id']);

        $register = CashRegister::create([
            'name' => $validated['name'],
            'pharmacy_branch_id' => $validated['pharmacy_branch_id'],
            'status' => $validated['status'] ?? 'active',
            'merchant_code' => $validated['merchant_code'] ?? null,
        ]);

        return response()->json($register->load(['activeSession.user', 'branch']), 201);
    }

    /**
     * Modifier une caisse (Admin uniquement)
     */
    #[OA\Put(
        path: "/api/admin/cash-registers/{id}",
        operationId: "updateAdminCashRegister",
        summary: "Modifier une caisse (Admin uniquement)",
        security: [["bearerAuth" => []]],
        tags: ["Caisses (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la caisse", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "name", type: "string", example: "Caisse Principale"),
                new OA\Property(property: "status", type: "string", enum: ["active", "inactive"], example: "inactive")
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Caisse mise à jour avec succès")]
    #[OA\Response(response: 404, description: "Caisse non trouvée")]
    #[OA\Response(response: 422, description: "Erreur de validation")]
    public function update(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();

        $register = CashRegister::whereHas('branch', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'status' => 'sometimes|required|string|in:active,inactive',
            'merchant_code' => 'nullable|string|max:255',
        ]);

        $register->update($validated);

        return response()->json($register->load(['activeSession.user', 'branch']), 200);
    }

    /**
     * Supprimer une caisse (Admin uniquement)
     */
    #[OA\Delete(
        path: "/api/admin/cash-registers/{id}",
        operationId: "deleteAdminCashRegister",
        summary: "Supprimer une caisse (Admin uniquement)",
        security: [["bearerAuth" => []]],
        tags: ["Caisses (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la caisse", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Caisse supprimée avec succès")]
    #[OA\Response(response: 400, description: "Impossible de supprimer la caisse car elle a une session active")]
    #[OA\Response(response: 404, description: "Caisse non trouvée")]
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

        return response()->json(null, 204);
    }

    /**
     * Historique paginé de toutes les sessions de caisse (Admin)
     */
    #[OA\Get(
        path: "/api/admin/cash-registers/sessions/history",
        operationId: "getAdminCashRegisterSessionsHistory",
        summary: "Historique paginé de toutes les sessions de caisse de l'hôpital (Admin)",
        security: [["bearerAuth" => []]],
        tags: ["Caisses (Admin)"]
    )]
    #[OA\Parameter(name: "pharmacy_branch_id", in: "query", required: false, description: "ID de la succursale", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "cash_register_id", in: "query", required: false, description: "ID de la caisse", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "user_id", in: "query", required: false, description: "ID du caissier", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "status", in: "query", required: false, description: "Statut de la session (open, closed)", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "start_date", in: "query", required: false, description: "Date de début (YYYY-MM-DD)", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "end_date", in: "query", required: false, description: "Date de fin (YYYY-MM-DD)", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Recherche par caissier, caisse...", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "page", in: "query", required: false, description: "Numéro de page", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "per_page", in: "query", required: false, description: "Éléments par page", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste paginée des sessions de caisse récupérée avec succès")]
    #[OA\Response(response: 403, description: "Accès refusé")]
    public function sessions(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        
        $query = CashRegisterSession::whereHas('register.branch', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->with(['register.branch', 'user']);

        // Filtrer par succursale
        if ($request->filled('pharmacy_branch_id')) {
            $query->whereHas('register', function ($q) use ($request) {
                $q->where('pharmacy_branch_id', $request->query('pharmacy_branch_id'));
            });
        }

        // Filtrer par caisse
        if ($request->filled('cash_register_id')) {
            $query->where('cash_register_id', $request->query('cash_register_id'));
        }

        // Filtrer par caissier
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        // Filtrer par statut (open / closed)
        if ($request->filled('status')) {
            $status = $request->query('status');
            if ($status === 'open') {
                $query->whereNull('closed_at');
            } elseif ($status === 'closed') {
                $query->whereNotNull('closed_at');
            }
        }

        // Filtrer par date d'ouverture
        if ($request->filled('start_date')) {
            $query->whereDate('opened_at', '>=', $request->query('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('opened_at', '<=', $request->query('end_date'));
        }

        // Recherche rapide (caissier first_name, last_name, caisse name, ID)
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($qu) use ($search) {
                    $qu->where('first_name', 'like', "%{$search}%")
                       ->orWhere('last_name', 'like', "%{$search}%");
                })
                ->orWhereHas('register', function ($qr) use ($search) {
                    $qr->where('name', 'like', "%{$search}%");
                })
                ->orWhere('id', 'like', "%{$search}%");
            });
        }

        $perPage = (int)$request->query('per_page', 15);
        $sessions = $query->latest()->paginate($perPage);

        // Ajouter les totaux calculés pour chaque session
        foreach ($sessions->items() as $session) {
            $salesQuery = \App\Models\Pharmacy\PosSale::where('cash_register_session_id', $session->id);
            
            $cash = (float)$salesQuery->clone()->where('payment_method', 'CASH')->sum('total_amount');
            $mobileMoney = (float)$salesQuery->clone()->where('payment_method', 'MOBILE_MONEY')->sum('total_amount');
            $card = (float)$salesQuery->clone()->where('payment_method', 'CARD')->sum('total_amount');

            $session->sales_totals = [
                'cash' => $cash,
                'mobile_money' => $mobileMoney,
                'card' => $card,
            ];
            
            $treasury = $session->treasury_totals;
            $session->current_balance = (float)$session->opening_balance + $cash + (float)($treasury['cash']['net'] ?? 0);
        }

        return response()->json($sessions, 200);
    }
}
