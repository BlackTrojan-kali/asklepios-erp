<?php

namespace App\Http\Controllers\Pharmacien;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy\PosSaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PosSaleItemController extends Controller
{
    /**
     * Lister les éléments d'une vente spécifique
     */
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
