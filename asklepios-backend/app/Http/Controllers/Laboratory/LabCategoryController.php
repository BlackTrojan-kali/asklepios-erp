<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabCategory;
use Illuminate\Http\Request;

class LabCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = LabCategory::query();
        if ($request->has('center_id')) {
            $query->where('center_id', $request->center_id);
        }
        
        $categories = $query->with('tests')->latest()->get();
        return response()->json($categories, 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'center_id' => 'nullable|exists:centers,id',
            'name' => 'required|string|max:255',
        ]);

        $category = LabCategory::create($validated);

        return response()->json([
            'message' => 'Catégorie créée avec succès',
            'data' => $category
        ], 201);
    }

    public function show($id)
    {
        $category = LabCategory::with('tests')->findOrFail($id);
        return response()->json($category, 200);
    }

    public function update(Request $request, $id)
    {
        $category = LabCategory::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
        ]);

        $category->update($validated);

        return response()->json([
            'message' => 'Catégorie mise à jour',
            'data' => $category
        ], 200);
    }

    public function destroy($id)
    {
        $category = LabCategory::findOrFail($id);
        $category->delete();

        return response()->json(['message' => 'Catégorie supprimée'], 200);
    }
}
