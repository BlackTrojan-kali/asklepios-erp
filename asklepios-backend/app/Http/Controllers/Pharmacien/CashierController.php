<?php

namespace App\Http\Controllers\Pharmacien;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CashierController extends Controller
{
    // recuperer les articles de l'hopital concerner
    public function getAllArticles(){
        $articles = Article::with(['branches' => function($query) {
            $query->where('hospital_id', auth()->user()->profile_admin->hospital_id);
        }])->get();
        return response()->json($articles, 200);
    }

    // 
    
}
