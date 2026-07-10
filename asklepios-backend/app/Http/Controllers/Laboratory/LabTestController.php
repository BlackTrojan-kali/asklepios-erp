<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabTest;
use Illuminate\Http\Request;

class LabTestController extends Controller
{
    public function index(Request $request)
    {
        $query = LabTest::with('category');
        if ($request->has('lab_category_id')) {
            $query->where('lab_category_id', $request->lab_category_id);
        }
        
        $tests = $query->latest()->get();
        return response()->json($tests, 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'lab_category_id' => 'required|exists:lab_categories,id',
            'code' => 'required|string|max:50',
            'name' => 'required|string|max:255',
            'sample_type_required' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $test = LabTest::create($validated);

        return response()->json([
            'message' => 'Examen créé avec succès',
            'data' => $test
        ], 201);
    }

    public function show($id)
    {
        $test = LabTest::with(['category', 'parameters'])->findOrFail($id);
        return response()->json($test, 200);
    }

    public function update(Request $request, $id)
    {
        $test = LabTest::findOrFail($id);

        $validated = $request->validate([
            'lab_category_id' => 'sometimes|required|exists:lab_categories,id',
            'code' => 'sometimes|required|string|max:50',
            'name' => 'sometimes|required|string|max:255',
            'sample_type_required' => 'sometimes|required|string|max:100',
            'price' => 'sometimes|required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $test->update($validated);

        return response()->json([
            'message' => 'Examen mis à jour',
            'data' => $test
        ], 200);
    }

    public function destroy($id)
    {
        $test = LabTest::findOrFail($id);
        $test->delete();

        return response()->json(['message' => 'Examen supprimé'], 200);
    }
}
