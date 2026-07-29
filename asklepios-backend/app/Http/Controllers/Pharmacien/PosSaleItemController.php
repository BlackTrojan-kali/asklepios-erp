<?php

namespace App\Http\Controllers\Pharmacien;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy\PosSaleItem;
use App\Http\Services\Security\ScopeResolver; // 🟢 IMPORT DU SERVICE
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Ventes POS (Pharmacy)", description: "Gestion des ventes directes en caisse et des factures PDF")]
class PosSaleItemController extends Controller
{
    /**
     * Lister les éléments d'une vente spécifique
     */
    #[OA\Get(
        path: "/api/pharmacy/pos-sale-items",
        operationId: "getPosSaleItems",
        summary: "Lister les éléments d'une vente spécifique",
        security: [["bearerAuth" => []]],
        tags: ["Ventes POS (Pharmacy)"]
    )]
    #[OA\Parameter(name: "pos_sale_id", in: "query", required: true, description: "ID de la vente POS", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste des éléments de la vente récupérée avec succès")]
    #[OA\Response(response: 400, description: "L'identifiant de la vente est requis")]
    #[OA\Response(response: 403, description: "Accès refusé")]
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $saleId = $request->query('pos_sale_id');
        if (!$saleId) {
            return response()->json(['message' => 'L\'identifiant de la vente est requis.'], 400);
        }

        $query = PosSaleItem::where('pos_sale_id', $saleId)->with(['article', 'batch']);

        // 🟢 SÉCURITÉ : On vérifie les droits sur la vente parente (pos_sales)
        $query->whereHas('sale', function ($q) use ($user) {
            if ($user->profile_admin) {
                // Vérification de l'hôpital de l'admin
                $q->whereHas('branch', function ($q2) use ($user) {
                    $q2->where('hospital_id', $user->profile_admin->hospital_id);
                });
                
                // Application du Scope sur la table pos_sales
                ScopeResolver::applyPharmacyScope($q, 'pharmacy_branch_id');
                
            } elseif ($user->profile_pharm) {
                // Vérification stricte pour le pharmacien
                if (!$user->profile_pharm->branch_id) {
                    abort(403, "Accès refusé. Vous n'êtes affecté à aucune succursale.");
                }
                $q->where('pharmacy_branch_id', $user->profile_pharm->branch_id);
            } else {
                abort(403, "Accès refusé.");
            }
        });

        $items = $query->get();

        return response()->json($items, 200);
    }
}