<?php

namespace App\Http\Controllers\Pharmacien;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Pharmacy\Article;
use Illuminate\Support\Facades\Auth;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Articles Caissier (Pharmacy)", description: "Gestion et consultation des articles par le caissier")]
class CashierController extends Controller
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
     * Récupérer tous les articles de l'hôpital du caissier connecté
     */
    #[OA\Get(
        path: "/api/pharmacy/cashier/articles",
        operationId: "getCashierArticles",
        summary: "Récupérer tous les articles de l'hôpital du caissier connecté",
        security: [["bearerAuth" => []]],
        tags: ["Articles Caissier (Pharmacy)"]
    )]
    #[OA\Response(response: 200, description: "Liste des articles récupérée avec succès")]
    #[OA\Response(response: 403, description: "Accès refusé")]
    public function getAllArticles()
    {
        $hospitalId = $this->getHospitalId();
        $articles = Article::where('hospital_id', $hospitalId)
            ->with(['branchArticles.defaultStorageLocation'])
            ->get();
        return response()->json($articles, 200);
    }
}
