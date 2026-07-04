<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy\PaymentAccount;
use App\Models\Pharmacy\PharmacyBranch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Comptes de Trésorerie (Admin)", description: "Gestion des comptes de paiement, banques et caisses de la pharmacie")]
class PaymentAccountController extends Controller
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
     * Lister les comptes de trésorerie de l'hôpital
     */
    #[OA\Get(
        path: "/api/admin/payment-accounts",
        operationId: "getAdminPaymentAccounts",
        summary: "Lister les comptes de trésorerie de l'hôpital",
        security: [["bearerAuth" => []]],
        tags: ["Comptes de Trésorerie (Admin)"]
    )]
    #[OA\Parameter(name: "pharmacy_branch_id", in: "query", required: false, description: "ID de la succursale", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "type", in: "query", required: false, description: "Type de compte", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Liste des comptes récupérée avec succès")]
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        
        $query = PaymentAccount::whereHas('branch', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->with('branch');

        if ($request->filled('pharmacy_branch_id')) {
            $query->where('pharmacy_branch_id', $request->query('pharmacy_branch_id'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        return response()->json($query->latest()->get(), 200);
    }

    /**
     * Détails d'un compte de trésorerie
     */
    #[OA\Get(
        path: "/api/admin/payment-accounts/{id}",
        operationId: "getAdminPaymentAccountDetails",
        summary: "Détails d'un compte de trésorerie",
        security: [["bearerAuth" => []]],
        tags: ["Comptes de Trésorerie (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID du compte", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Détails du compte récupérés avec succès")]
    public function show($id)
    {
        $hospitalId = $this->getHospitalId();
        
        $account = PaymentAccount::whereHas('branch', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->with('branch')->findOrFail($id);

        return response()->json($account, 200);
    }

    /**
     * Créer un nouveau compte de trésorerie (Admin uniquement)
     */
    #[OA\Post(
        path: "/api/admin/payment-accounts",
        operationId: "storeAdminPaymentAccount",
        summary: "Créer un nouveau compte de trésorerie (Admin uniquement)",
        security: [["bearerAuth" => []]],
        tags: ["Comptes de Trésorerie (Admin)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["name", "type", "pharmacy_branch_id"],
            properties: [
                new OA\Property(property: "name", type: "string", example: "Afriland Bank"),
                new OA\Property(property: "type", type: "string", enum: ["bank", "mobile_money", "safe", "cash_register", "owner"], example: "bank"),
                new OA\Property(property: "pharmacy_branch_id", type: "integer", example: 1),
                new OA\Property(property: "account_number", type: "string", example: "1234567890", nullable: true),
                new OA\Property(property: "balance", type: "number", format: "float", example: 0.0),
                new OA\Property(property: "status", type: "string", enum: ["active", "inactive"], example: "active")
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Compte créé avec succès")]
    public function store(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => ['required', Rule::in(['bank', 'mobile_money', 'safe', 'cash_register', 'owner'])],
            'pharmacy_branch_id' => 'required|integer',
            'account_number' => 'nullable|string|max:255',
            'balance' => 'nullable|numeric',
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        // Vérifier que la branche appartient bien à l'hôpital
        $branch = PharmacyBranch::where('hospital_id', $hospitalId)->findOrFail($validated['pharmacy_branch_id']);

        $account = PaymentAccount::create([
            'pharmacy_branch_id' => $branch->id,
            'name' => $validated['name'],
            'type' => $validated['type'],
            'account_number' => $validated['account_number'] ?? null,
            'balance' => $validated['balance'] ?? 0.0,
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json($account->load('branch'), 201);
    }

    /**
     * Mettre à jour un compte de trésorerie (Admin uniquement)
     */
    #[OA\Put(
        path: "/api/admin/payment-accounts/{id}",
        operationId: "updateAdminPaymentAccount",
        summary: "Mettre à jour un compte de trésorerie (Admin uniquement)",
        security: [["bearerAuth" => []]],
        tags: ["Comptes de Trésorerie (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID du compte", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "name", type: "string", example: "Afriland Bank Bis"),
                new OA\Property(property: "type", type: "string", enum: ["bank", "mobile_money", "safe", "cash_register", "owner"], example: "bank"),
                new OA\Property(property: "account_number", type: "string", example: "0987654321", nullable: true),
                new OA\Property(property: "status", type: "string", enum: ["active", "inactive"], example: "active")
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Compte mis à jour avec succès")]
    public function update(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();

        $account = PaymentAccount::whereHas('branch', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'type' => ['sometimes', 'required', Rule::in(['bank', 'mobile_money', 'safe', 'cash_register', 'owner'])],
            'account_number' => 'nullable|string|max:255',
            'status' => ['sometimes', 'required', Rule::in(['active', 'inactive'])],
        ]);

        $account->update($validated);

        return response()->json($account->load('branch'), 200);
    }

    /**
     * Supprimer un compte de trésorerie (Admin uniquement)
     */
    #[OA\Delete(
        path: "/api/admin/payment-accounts/{id}",
        operationId: "deleteAdminPaymentAccount",
        summary: "Supprimer un compte de trésorerie (Admin uniquement)",
        security: [["bearerAuth" => []]],
        tags: ["Comptes de Trésorerie (Admin)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID du compte", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Compte supprimé avec succès")]
    #[OA\Response(response: 400, description: "Impossible de supprimer un compte ayant des transactions liées")]
    public function destroy($id)
    {
        $hospitalId = $this->getHospitalId();

        $account = PaymentAccount::whereHas('branch', function ($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId);
        })->findOrFail($id);

        // Vérifier s'il y a des transactions liées
        if ($account->outgoingTransactions()->exists() || $account->incomingTransactions()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer ce compte car des transactions financières y sont associées.'
            ], 400);
        }

        $account->delete();

        return response()->json(['message' => 'Compte supprimé avec succès.'], 200);
    }
}
