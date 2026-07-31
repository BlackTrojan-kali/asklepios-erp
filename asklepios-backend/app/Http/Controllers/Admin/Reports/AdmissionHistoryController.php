<?php

namespace App\Http\Controllers\Admin\Reports;

use App\Http\Controllers\Controller;
use App\Models\Hospital\Admission; // Ajustez le namespace selon votre architecture
use App\Http\Services\Security\ScopeResolver;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Rapports des Hospitalisations", description: "Historique, filtrage et export PDF des admissions")]
class AdmissionHistoryController extends Controller
{
    /**
     * Construit la requête de base avec les relations et les filtres de sécurité.
     */
    private function getScopedAndFilteredQuery(Request $request)
    {
        $user = Auth::user();

        // 1. Relations de base nécessaires pour l'affichage
        // Assumons que Bed appartient à FacilityRoom (room), qui appartient à Department, qui appartient à Center
        $query = Admission::with([
            'patient',
            'bed.room.department.center', 
            'doctor.user' // Médecin responsable
        ]);

        // 2. Application du Scope de sécurité Multi-Sites
        // On filtre via la relation du lit (bed -> room -> department) pour accéder au center_id
        $query->whereHas('bed.room.department', function ($q) use ($user) {
            if ($user->profile_admin) {
                ScopeResolver::applyCenterScope($q, 'center_id');
            }
        });

        // 3. Restriction si c'est un médecin connecté
        if ($user->profile_doctor) {
            $query->where('profile_doctor_id', $user->profile_doctor->id);
        }

        // 4. APPLICATION DES FILTRES DYNAMIQUES
        
        // Filtre : Hôpital (via le centre du département du lit)
        if ($request->filled('hospital_id')) {
            $query->whereHas('bed.room.department.center', function ($q) use ($request) {
                $q->where('hospital_id', $request->hospital_id);
            });
        }

        // Filtre : Centre
        if ($request->filled('center_id')) {
            $query->whereHas('bed.room.department', function ($q) use ($request) {
                $q->where('center_id', $request->center_id);
            });
        }

        // Filtre : Département
        if ($request->filled('department_id')) {
            $query->whereHas('bed.room', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        // Filtre : Salle / Chambre
        if ($request->filled('facility_room_id')) {
            $query->whereHas('bed', function ($q) use ($request) {
                $q->where('facility_room_id', $request->facility_room_id);
            });
        }

        // Filtre : Médecin responsable
        if ($request->filled('profile_doctor_id') && !$user->profile_doctor) {
            $query->where('profile_doctor_id', $request->profile_doctor_id);
        }

        // Filtre : Patient
        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        // Filtre : Statut d'hospitalisation (ADMITTED / DISCHARGED)
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filtre : Statut de facturation
        if ($request->filled('is_billed')) {
            $query->where('is_billed', filter_var($request->is_billed, FILTER_VALIDATE_BOOLEAN));
        }

        // Filtres : Période d'admission
        if ($request->filled('start_date')) {
            $query->where('admission_date', '>=', $request->start_date . ' 00:00:00');
        }
        if ($request->filled('end_date')) {
            $query->where('admission_date', '<=', $request->end_date . ' 23:59:59');
        }

        return $query->orderBy('admission_date', 'desc');
    }

    #[OA\Get(
        path: "/api/reports/admissions",
        summary: "Historique des hospitalisations (filtrable)",
        security: [["bearerAuth" => []]],
        tags: ["Rapports des Hospitalisations"]
    )]
    #[OA\Parameter(name: "per_page", in: "query", required: false, description: "Nombre d'éléments par page", schema: new OA\Schema(type: "integer", default: 15))]
    #[OA\Parameter(name: "hospital_id", in: "query", required: false, description: "Filtrer par hôpital", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "center_id", in: "query", required: false, description: "Filtrer par centre", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "department_id", in: "query", required: false, description: "Filtrer par département", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "profile_doctor_id", in: "query", required: false, description: "Filtrer par médecin responsable", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "patient_id", in: "query", required: false, description: "Filtrer par patient", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "status", in: "query", required: false, description: "Statut: ADMITTED ou DISCHARGED", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "is_billed", in: "query", required: false, description: "Filtrer par facturation (true/false)", schema: new OA\Schema(type: "boolean"))]
    #[OA\Parameter(name: "start_date", in: "query", required: false, description: "Date de début d'admission", schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Parameter(name: "end_date", in: "query", required: false, description: "Date de fin d'admission", schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Response(response: 200, description: "Liste paginée des hospitalisations récupérée avec succès")]
    #[OA\Response(response: 401, description: "Non authentifié")]
    #[OA\Response(response: 403, description: "Accès refusé")]
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 15);
        $query = $this->getScopedAndFilteredQuery($request);
        
        return response()->json($query->paginate($perPage), 200);
    }

    #[OA\Get(
        path: "/api/reports/admissions/export/pdf",
        summary: "Exporter l'historique des hospitalisations en PDF",
        description: "Génère un fichier PDF contenant l'historique détaillé et les statistiques (Admis, Libérés, Facturés) selon les filtres fournis.",
        security: [["bearerAuth" => []]],
        tags: ["Rapports des Hospitalisations"]
    )]
    // ... Mêmes paramètres Swagger que pour index() ...
    #[OA\Response(response: 200, description: "Fichier PDF généré")]
    public function exportPdf(Request $request)
    {
        $query = $this->getScopedAndFilteredQuery($request);
        
        // Calcul des statistiques globales sur la requête filtrée
        $totalAdmissions = $query->count();
        
        // Clonage pour requêtes d'agrégation sans affecter la requête de base
        $totalAdmitted = (clone $query)->where('status', 'ADMITTED')->count();
        $totalDischarged = (clone $query)->where('status', 'DISCHARGED')->count();
        $totalBilled = (clone $query)->where('is_billed', true)->count();
        $totalUnbilled = $totalAdmissions - $totalBilled;

        $admissions = $query->get(); // Exécution finale de la requête
        
        $filters = $request->all();
        $user = Auth::user();

        // Génération du PDF
        $pdf = Pdf::loadView('exports.pdf.admission_history', compact(
            'admissions', 
            'filters', 
            'user',
            'totalAdmissions',
            'totalAdmitted',
            'totalDischarged',
            'totalBilled',
            'totalUnbilled'
        ))->setPaper('a4', 'landscape');

        return $pdf->download("rapport_hospitalisations_" . date('Ymd_His') . ".pdf");
    }
}