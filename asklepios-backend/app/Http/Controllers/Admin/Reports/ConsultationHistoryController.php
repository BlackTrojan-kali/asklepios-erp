<?php

namespace App\Http\Controllers\Admin\Reports;

use App\Http\Controllers\Controller;
use App\Http\Services\Security\ScopeResolver;
use App\Models\Hospital\Consultation;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Rapports des Consultations", description: "Historique, filtrage et export PDF des consultations")]
class ConsultationHistoryController extends Controller
{
    /**
     * Construit la requête de base avec les relations et les filtres de sécurité.
     */
    private function getScopedAndFilteredQuery(Request $request)
    {
        $user = Auth::user();

        // 1. Relations de base nécessaires pour l'affichage
        $query = Consultation::with([
            'patientVisit.patient',
            'patientVisit.center',
            'patientVisit.consultingRoom.department',
            'doctor.user' // Assumant que ProfileDoctor a une relation "user"
        ]);

        // 2. Application du Scope de sécurité Multi-Sites
        // On filtre via la relation patientVisit pour accéder au center_id
        $query->whereHas('patientVisit', function ($q) use ($user) {
            // Sécurité : l'admin ne voit que les centres auxquels il a accès
            if ($user->profile_admin) {
                ScopeResolver::applyCenterScope($q, 'center_id');
            }
        });

        // 3. Restriction si c'est un médecin connecté qui consulte son propre historique
        if ($user->profile_doctor) {
            $query->where('profile_doctor_id', $user->profile_doctor->id);
        }

        // 4. APPLICATION DES FILTRES DYNAMIQUES
        
        // Filtre : Hôpital (via le centre)
        if ($request->filled('hospital_id')) {
            $query->whereHas('patientVisit.center', function ($q) use ($request) {
                $q->where('hospital_id', $request->hospital_id);
            });
        }

        // Filtre : Centre
        if ($request->filled('center_id')) {
            $query->whereHas('patientVisit', function ($q) use ($request) {
                $q->where('center_id', $request->center_id);
            });
        }

        // Filtre : Département (via la salle de consultation)
        if ($request->filled('department_id')) {
            $query->whereHas('patientVisit.consultingRoom', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        // Filtre : Médecin
        if ($request->filled('profile_doctor_id') && !$user->profile_doctor) {
            $query->where('profile_doctor_id', $request->profile_doctor_id);
        }

        // Filtre : Patient
        if ($request->filled('patient_id')) {
            $query->whereHas('patientVisit', function ($q) use ($request) {
                $q->where('patient_id', $request->patient_id);
            });
        }

        // Filtre : Statut de facturation
        if ($request->filled('is_billed')) {
            $query->where('is_billed', filter_var($request->is_billed, FILTER_VALIDATE_BOOLEAN));
        }

        // Filtres : Période
        if ($request->filled('start_date')) {
            $query->where('created_at', '>=', $request->start_date . ' 00:00:00');
        }
        if ($request->filled('end_date')) {
            $query->where('created_at', '<=', $request->end_date . ' 23:59:59');
        }

        return $query->orderBy('created_at', 'desc');
    }

    #[OA\Get(
        path: "/api/reports/consultations",
        summary: "Historique des consultations (filtrable)",
        security: [["bearerAuth" => []]],
        tags: ["Rapports des Consultations"]
    )]
    #[OA\Parameter(name: "per_page", in: "query", required: false, description: "Nombre d'éléments par page", schema: new OA\Schema(type: "integer", default: 15))]
    #[OA\Parameter(name: "hospital_id", in: "query", required: false, description: "Filtrer par ID de l'hôpital", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "center_id", in: "query", required: false, description: "Filtrer par ID du centre", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "department_id", in: "query", required: false, description: "Filtrer par ID du département", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "profile_doctor_id", in: "query", required: false, description: "Filtrer par médecin traitant", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "patient_id", in: "query", required: false, description: "Filtrer par patient", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "is_billed", in: "query", required: false, description: "Filtrer par statut de facturation (true/false)", schema: new OA\Schema(type: "boolean"))]
    #[OA\Parameter(name: "start_date", in: "query", required: false, description: "Date de début (YYYY-MM-DD)", schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Parameter(name: "end_date", in: "query", required: false, description: "Date de fin (YYYY-MM-DD)", schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Response(response: 200, description: "Liste paginée des consultations récupérée avec succès")]
    #[OA\Response(response: 401, description: "Non authentifié")]
    #[OA\Response(response: 403, description: "Accès refusé")]
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 15);
        $query = $this->getScopedAndFilteredQuery($request);
        
        return response()->json($query->paginate($perPage), 200);
    }

    #[OA\Get(
        path: "/api/reports/consultations/export/pdf",
        summary: "Exporter l'historique des consultations en PDF",
        description: "Génère un fichier PDF contenant l'historique détaillé et les statistiques (Chiffre d'affaires, total facturé, etc.) selon les filtres fournis.",
        security: [["bearerAuth" => []]],
        tags: ["Rapports des Consultations"]
    )]
    #[OA\Parameter(name: "hospital_id", in: "query", required: false, description: "Filtrer par ID de l'hôpital", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "center_id", in: "query", required: false, description: "Filtrer par ID du centre", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "department_id", in: "query", required: false, description: "Filtrer par ID du département", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "profile_doctor_id", in: "query", required: false, description: "Filtrer par médecin traitant", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "patient_id", in: "query", required: false, description: "Filtrer par patient", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "is_billed", in: "query", required: false, description: "Filtrer par statut de facturation (true/false)", schema: new OA\Schema(type: "boolean"))]
    #[OA\Parameter(name: "start_date", in: "query", required: false, description: "Date de début (YYYY-MM-DD)", schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Parameter(name: "end_date", in: "query", required: false, description: "Date de fin (YYYY-MM-DD)", schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Response(response: 200, description: "Fichier PDF généré et prêt au téléchargement")]
    #[OA\Response(response: 401, description: "Non authentifié")]
    #[OA\Response(response: 403, description: "Accès refusé")]
    public function exportPdf(Request $request)
    {
        $query = $this->getScopedAndFilteredQuery($request);
        
        // Calcul des statistiques globales sur la requête filtrée
        $totalConsultations = $query->count();
        $totalRevenue = $query->sum('consultation_price');
        $totalBilled = $query->where('is_billed', true)->count();
        $totalUnbilled = $totalConsultations - $totalBilled;

        $consultations = $this->getScopedAndFilteredQuery($request)->get(); // On refait get() sans altérer la query précédente
        
        $filters = $request->all();
        $user = Auth::user();

        // Génération du PDF
        $pdf = Pdf::loadView('exports.pdf.consultation_history', compact(
            'consultations', 
            'filters', 
            'user',
            'totalConsultations',
            'totalRevenue',
            'totalBilled',
            'totalUnbilled'
        ))->setPaper('a4', 'landscape');

        return $pdf->download("rapport_consultations_" . date('Ymd_His') . ".pdf");
    }
}