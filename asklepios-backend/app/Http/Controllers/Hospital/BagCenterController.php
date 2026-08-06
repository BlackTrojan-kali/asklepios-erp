<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\Hospital\BagCenter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use OpenApi\Attributes as OA;

class BagCenterController extends Controller
{
    #[OA\Get(path: "/api/admin/bag-pricings", summary: "Lister les tarifs des poches par centre")]
#[OA\Response(response: 200, description: "élément Recupere avec success")]
    public function index(Request $request)
    {
        $query = BagCenter::with('center');
        
        if ($request->filled('center_id')) {
            $query->where('center_id', $request->center_id);
        }

        return response()->json($query->get());
    }

    #[OA\Post(path: "/api/admin/bag-pricings", summary: "Configurer le prix d'un groupe sanguin pour un centre")]
#[OA\Response(response: 200, description: "élément Recupere avec success")]
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'center_id' => 'required|exists:centers,id',
            'blood_type' => 'required|string|max:10',
            'price' => 'required|numeric|min:0'
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        // UpdateOrCreate pour éviter les doublons (1 prix par groupe et par centre)
        $pricing = BagCenter::updateOrCreate(
            [
                'center_id' => $request->center_id,
                'blood_type' => $request->blood_type
            ],
            ['price' => $request->price]
        );

        return response()->json(['message' => 'Tarif enregistré', 'data' => $pricing], 201);
    }
}