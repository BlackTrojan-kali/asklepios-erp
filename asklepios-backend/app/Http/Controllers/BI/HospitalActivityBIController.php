<?php

namespace App\Http\Controllers\BI;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;
use Carbon\Carbon;

#[OA\Tag(name: "BI - Dashboard Activités (CEO)", description: "Indicateurs consolidés sur le flux des patients et l'activité clinique")]
class HospitalActivityBIController extends Controller
{
    /**
     * Applique les filtres globaux (Centre, Hôpital, Période) de manière dynamique.
     */
    private function applyGlobalFilters($query, Request $request, $dateColumn = 'created_at', $centerColumn = 'center_id')
    {
        if ($request->filled('center_id')) {
            $query->where($centerColumn, $request->center_id);
        }

        if ($request->filled('hospital_id')) {
            // Jointure pour récupérer l'hôpital via le centre
            $query->join('centers as filter_centers', clone $query->raw($centerColumn), '=', 'filter_centers.id')
                  ->where('filter_centers.hospital_id', $request->hospital_id);
        }

        if ($dateColumn && $request->filled('start_date')) {
            $query->where($dateColumn, '>=', $request->start_date . ' 00:00:00');
        }

        if ($dateColumn && $request->filled('end_date')) {
            $query->where($dateColumn, '<=', $request->end_date . ' 23:59:59');
        }

        return $query;
    }

    #[OA\Get(path: "/api/bi/hospital/kpis", summary: "KPIs globaux de l'activité médicale", security: [["sanctum" => []]])]
    public function getKPIs(Request $request)
    {
        // 1. Total des visites patients
        $visitsQuery = DB::table('patient_visits');
        $visitsQuery = $this->applyGlobalFilters($visitsQuery, $request, 'patient_visits.arrival_time', 'patient_visits.center_id');
        $totalVisits = (clone $visitsQuery)->count();

        // 2. Total des visites d'urgence
        $emergencyVisits = (clone $visitsQuery)->where('visit_type', 'EMERGENCY')->count();

        // 3. Consultations complétées
        $consultationsQuery = DB::table('consultations')
            ->join('patient_visits', 'consultations.patient_visit_id', '=', 'patient_visits.id');
        $consultationsQuery = $this->applyGlobalFilters($consultationsQuery, $request, 'consultations.created_at', 'patient_visits.center_id');
        $totalConsultations = $consultationsQuery->count();

        // 4. Actes médicaux réalisés
        $actsQuery = DB::table('performed_medical_acts')
            ->join('patient_visits', 'performed_medical_acts.patient_visit_id', '=', 'patient_visits.id');
        $actsQuery = $this->applyGlobalFilters($actsQuery, $request, 'performed_medical_acts.created_at', 'patient_visits.center_id');
        $totalMedicalActs = $actsQuery->count();

        // 5. Admissions générées
        $admissionsQuery = DB::table('admissions')
            ->join('patient_visits', 'admissions.patient_visit_id', '=', 'patient_visits.id');
        $admissionsQuery = $this->applyGlobalFilters($admissionsQuery, $request, 'admissions.admission_date', 'patient_visits.center_id');
        $totalAdmissions = $admissionsQuery->count();

        return response()->json([
            'total_visits' => $totalVisits,
            'emergency_visits' => $emergencyVisits,
            'total_consultations' => $totalConsultations,
            'total_medical_acts' => $totalMedicalActs,
            'total_admissions' => $totalAdmissions,
            'admission_rate' => $totalVisits > 0 ? round(($totalAdmissions / $totalVisits) * 100, 2) : 0,
        ]);
    }

    #[OA\Get(path: "/api/bi/hospital/visit-trends", summary: "Tendance des flux de patients par type", security: [["sanctum" => []]])]
    public function getVisitTrends(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $query = DB::table('patient_visits');
        $query = $this->applyGlobalFilters($query, $request, 'patient_visits.arrival_time', 'patient_visits.center_id');

        $data = $query->select(
                DB::raw('DATE(arrival_time) as date'),
                'visit_type',
                DB::raw('COUNT(id) as total_visits')
            )
            ->whereNotNull('arrival_time')
            ->groupBy(DB::raw('DATE(arrival_time)'), 'visit_type')
            ->orderBy('date', 'asc')
            ->get();

        // Formatage pour un graphique de type "Stack Area" ou "Bar"
        $formattedData = [];
        foreach ($data as $row) {
            $date = $row->date;
            if (!isset($formattedData[$date])) {
                $formattedData[$date] = [
                    'date' => $date, 
                    'ROUTINE' => 0, 
                    'EMERGENCY' => 0, 
                    'FOLLOW_UP' => 0
                ];
            }
            $formattedData[$date][$row->visit_type] = $row->total_visits;
        }

        return response()->json(array_values($formattedData));
    }

    #[OA\Get(path: "/api/bi/hospital/consultations-by-doctor", summary: "Charge de travail par Médecin", security: [["sanctum" => []]])]
    public function getConsultationsByDoctor(Request $request)
    {
        $query = DB::table('consultations')
            ->join('patient_visits', 'consultations.patient_visit_id', '=', 'patient_visits.id')
            ->join('profile_doctors', 'consultations.profile_doctor_id', '=', 'profile_doctors.id')
            ->join('users', 'profile_doctors.user_id', '=', 'users.id');

        $query = $this->applyGlobalFilters($query, $request, 'consultations.created_at', 'patient_visits.center_id');

        $data = $query->select(
                'users.first_name',
                'users.last_name',
                'profile_doctors.speciality',
                DB::raw('COUNT(consultations.id) as total_consultations')
            )
            ->groupBy('profile_doctors.id', 'users.first_name', 'users.last_name', 'profile_doctors.speciality')
            ->orderByDesc('total_consultations')
            ->limit(10)
            ->get();

        return response()->json($data);
    }

    #[OA\Get(path: "/api/bi/hospital/top-medical-acts", summary: "Actes médicaux les plus fréquents", security: [["sanctum" => []]])]
    public function getTopMedicalActs(Request $request)
    {
        $query = DB::table('performed_medical_acts')
            ->join('patient_visits', 'performed_medical_acts.patient_visit_id', '=', 'patient_visits.id')
            ->join('medical_act_catalogs', 'performed_medical_acts.medical_act_catalog_id', '=', 'medical_act_catalogs.id');

        $query = $this->applyGlobalFilters($query, $request, 'performed_medical_acts.created_at', 'patient_visits.center_id');

        $data = $query->select(
                'medical_act_catalogs.name as act_name',
                DB::raw('COUNT(performed_medical_acts.id) as total_performed')
            )
            ->groupBy('medical_act_catalogs.id', 'medical_act_catalogs.name')
            ->orderByDesc('total_performed')
            ->limit(10)
            ->get();

        return response()->json($data);
    }

    #[OA\Get(path: "/api/bi/hospital/active-admissions", summary: "Détail des patients actuellement hospitalisés", security: [["sanctum" => []]])]
    public function getActiveAdmissions(Request $request)
    {
        // Cette requête donne au CEO une vue temps réel (non filtrée par date de fin)
        $query = DB::table('admissions')
            ->join('patients', 'admissions.patient_id', '=', 'patients.id')
            ->leftJoin('patient_visits', 'admissions.patient_visit_id', '=', 'patient_visits.id')
            ->leftJoin('beds', 'admissions.bed_id', '=', 'beds.id')
            ->leftJoin('facility_rooms', 'beds.facility_room_id', '=', 'facility_rooms.id')
            ->where('admissions.status', 'ADMITTED'); // On ne prend que les actifs

        // Filtre géographique
        $query = $this->applyGlobalFilters($query, $request, null, 'patient_visits.center_id');

        $data = $query->select(
                'patients.first_name',
                'patients.last_name',
                'patients.patient_code',
                'admissions.admission_date',
                'admissions.reason_for_admission',
                'beds.bed_number',
                'facility_rooms.name as room_name'
            )
            ->orderBy('admissions.admission_date', 'desc')
            ->limit(100) // On limite pour l'affichage tableau
            ->get();

        // Calcul du nombre de jours d'hospitalisation à la volée
        $formattedData = $data->map(function ($admission) {
            $admissionDate = Carbon::parse($admission->admission_date);
            $admission->days_admitted = $admissionDate->diffInDays(Carbon::now());
            return $admission;
        });

        return response()->json($formattedData);
    }
}