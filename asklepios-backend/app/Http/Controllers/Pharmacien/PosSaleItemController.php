<?php

namespace App\Http\Controllers\Pharmacien;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy\PosSaleItem;
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
        $profile = Auth::user()->profile_pharm;
        if (!$profile || !$profile->branch_id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $saleId = $request->query('pos_sale_id');
        if (!$saleId) {
            return response()->json(['message' => 'L\'identifiant de la vente est requis.'], 400);
        }

        // S'assurer que la vente appartient à la succursale du pharmacien
        $items = PosSaleItem::whereHas('sale', function ($q) use ($profile) {
                $q->where('pharmacy_branch_id', $profile->branch_id);
            })
            ->where('pos_sale_id', $saleId)
            ->with(['article', 'batch'])
            ->get();

        return response()->json($items, 200);
    }
}
