<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Http\Services\BloodTransfusionService;
use App\Models\Hospital\BloodTransfusion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use OpenApi\Attributes as OA;

class BloodTransfusionController extends Controller
{
    protected $transfusionService;

    public function __construct(BloodTransfusionService $transfusionService)
    {
        $this->transfusionService = $transfusionService;
    }

    #[OA\Get(path: "/api/doctor/transfusions", summary: "Lister les transfusions")]
    public function index(Request $request)
    {
        $query = BloodTransfusion::with(['bloodBag', 'consultation.patient']); // Ajustez selon vos relations
        
        if ($request->filled('consultation_id')) {
            $query->where('consultation_id', $request->consultation_id);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    #[OA\Post(path: "/api/doctor/transfusions", summary: "Initier une transfusion à un patient")]
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'consultation_id' => 'required|exists:consultations,id',
            'center_id' => 'required|exists:centers,id',
            'blood_bag_id' => 'required|exists:blood_bags,id',
            'start_time' => 'nullable|date'
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        try {
            $transfusion = $this->transfusionService->initiateTransfusion($validator->validated());
            return response()->json([
                'message' => 'Transfusion initiée avec succès, la poche a été facturée et retirée du stock.',
                'data' => $transfusion
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    #[OA\Put(path: "/api/doctor/transfusions/{id}/finish", summary: "Terminer une transfusion")]
    public function finish($id)
    {
        try {
            $transfusion = $this->transfusionService->finishTransfusion($id);
            return response()->json([
                'message' => 'Transfusion marquée comme terminée.',
                'data' => $transfusion
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}