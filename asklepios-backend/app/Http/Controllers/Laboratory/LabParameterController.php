<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabParameter;
use Illuminate\Http\Request;

class LabParameterController extends Controller
{
    public function index(Request $request)
    {
        $query = LabParameter::with('test');
        if ($request->has('lab_test_id')) {
            $query->where('lab_test_id', $request->lab_test_id);
        }
        
        $parameters = $query->latest()->get();
        return response()->json($parameters, 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'lab_test_id' => 'required|exists:lab_tests,id',
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'reference_min_male' => 'nullable|numeric',
            'reference_max_male' => 'nullable|numeric',
            'reference_min_female' => 'nullable|numeric',
            'reference_max_female' => 'nullable|numeric',
            'reference_text' => 'nullable|string|max:255',
        ]);

        $parameter = LabParameter::create($validated);

        return response()->json([
            'message' => 'Paramètre créé avec succès',
            'data' => $parameter
        ], 201);
    }

    public function show($id)
    {
        $parameter = LabParameter::with('test')->findOrFail($id);
        return response()->json($parameter, 200);
    }

    public function update(Request $request, $id)
    {
        $parameter = LabParameter::findOrFail($id);

        $validated = $request->validate([
            'lab_test_id' => 'sometimes|required|exists:lab_tests,id',
            'name' => 'sometimes|required|string|max:255',
            'unit' => 'sometimes|required|string|max:50',
            'reference_min_male' => 'nullable|numeric',
            'reference_max_male' => 'nullable|numeric',
            'reference_min_female' => 'nullable|numeric',
            'reference_max_female' => 'nullable|numeric',
            'reference_text' => 'nullable|string|max:255',
        ]);

        $parameter->update($validated);

        return response()->json([
            'message' => 'Paramètre mis à jour',
            'data' => $parameter
        ], 200);
    }

    public function destroy($id)
    {
        $parameter = LabParameter::findOrFail($id);
        $parameter->delete();

        return response()->json(['message' => 'Paramètre supprimé'], 200);
    }
}
