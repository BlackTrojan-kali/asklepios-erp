<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\Hospital\BloodTransfusion;
use App\Http\Services\Security\ScopeResolver;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Banque de Sang", description: "Gestion des donneurs, poches de sang, réfrigérateurs et transfusions")]
class BloodTrackingController extends Controller
{
    /**
     * Helper privé pour appliquer les filtres communs (API et PDF)
     */
    private function buildTrackingQuery(Request $request)
    {
        $user = auth()->user();
        
        // On charge toutes les relations nécessaires pour savoir qui a prescrit et à qui
        $query = BloodTransfusion::with([
            'bloodBag',
            'center',
            'consultation.patientVisit.patient',
            'consultation.admission.patient',
            'consultation.profileDoctor.user'
        ]);

        // 👉 APPLICATION DU SCOPE RESOLVER (Crucial pour le rôle Admin)
        $query = ScopeResolver::applyCenterScope($query, 'center_id');

        // Restriction supplémentaire par centre pour les autres profils spécifiques
        if ($user->profile_reception && $user->profile_reception->center_id) {
            $query->where('center_id', $user->profile_reception->center_id);
        } elseif ($user->profile_doctor && $user->profile_doctor->center_id) {
            $query->where('center_id', $user->profile_doctor->center_id);
        }

        // Filtre : Statut de la transfusion
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filtre : Période (Date de début et Date de fin)
        if ($request->filled('start_date')) {
            $query->whereDate('start_time', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('start_time', '<=', $request->end_date);
        }

        // Filtre : Groupe Sanguin (via la table blood_bags)
        if ($request->filled('blood_type')) {
            $query->whereHas('bloodBag', function ($q) use ($request) {
                $q->where('blood_type', $request->blood_type);
            });
        }

        return $query->orderBy('start_time', 'desc');
    }

    #[OA\Get(
        path: "/api/hospital/blood-tracking", 
        summary: "Lister le suivi des transfusions", 
        security: [["sanctum" => []]], 
        tags: ["Banque de Sang"]
    )]
    #[OA\Parameter(name: "page", in: "query", description: "Numéro de la page", required: false, schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "per_page", in: "query", description: "Nombre d'éléments par page", required: false, schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "status", in: "query", description: "Filtrer par statut (ON_GOING, FINISHED)", required: false, schema: new OA\Schema(type: "string", enum: ["ON_GOING", "FINISHED"]))]
    #[OA\Parameter(name: "blood_type", in: "query", description: "Filtrer par groupe sanguin (ex: A+, O-)", required: false, schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "start_date", in: "query", description: "Filtrer à partir de cette date (Y-m-d)", required: false, schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Parameter(name: "end_date", in: "query", description: "Filtrer jusqu'à cette date (Y-m-d)", required: false, schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Response(response: 200, description: "Liste paginée récupérée avec succès")]
    public function index(Request $request)
    {
        $query = $this->buildTrackingQuery($request);
        $perPage = $request->query('per_page', 15);
        
        return response()->json($query->paginate($perPage));
    }

    #[OA\Get(
        path: "/api/hospital/blood-tracking/export-pdf", 
        summary: "Exporter le rapport des transfusions (PDF)", 
        security: [["sanctum" => []]], 
        tags: ["Banque de Sang"]
    )]
    #[OA\Parameter(name: "action", in: "query", description: "Action à effectuer (stream pour voir, download pour télécharger)", required: false, schema: new OA\Schema(type: "string", enum: ["stream", "download"]))]
    #[OA\Parameter(name: "status", in: "query", description: "Filtrer par statut", required: false, schema: new OA\Schema(type: "string", enum: ["ON_GOING", "FINISHED"]))]
    #[OA\Parameter(name: "blood_type", in: "query", description: "Filtrer par groupe sanguin", required: false, schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "start_date", in: "query", description: "Filtrer à partir de cette date", required: false, schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Parameter(name: "end_date", in: "query", description: "Filtrer jusqu'à cette date", required: false, schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Response(response: 200, description: "Fichier PDF généré avec succès")]
    public function exportPdf(Request $request)
    {
        // Pour le PDF, on limite les résultats pour éviter de surcharger la mémoire
        // Si aucun filtre de date n'est fourni, on prend les 30 derniers jours par défaut
        if (!$request->filled('start_date') && !$request->filled('end_date')) {
            $request->merge(['start_date' => Carbon::now()->subDays(30)->toDateString()]);
        }

        $query = $this->buildTrackingQuery($request);
        $transfusions = $query->limit(500)->get(); // Limite sécuritaire

        $data = [
            'transfusions' => $transfusions,
            'filters' => [
                'start_date' => $request->start_date ? Carbon::parse($request->start_date)->format('d/m/Y') : 'Début',
                'end_date'   => $request->end_date ? Carbon::parse($request->end_date)->format('d/m/Y') : 'Aujourd\'hui',
                'status'     => $request->status ?? 'Tous',
                'blood_type' => $request->blood_type ?? 'Tous'
            ],
            'generated_at' => now()->format('d/m/Y H:i'),
            'generated_by' => auth()->user()->first_name . ' ' . auth()->user()->last_name,
        ];

        // Charger le logo si nécessaire (comme pour la facture)
        $asklepiosLogoPath = public_path('images/asklepios_logo.png');
        if (file_exists($asklepiosLogoPath)) {
            $data['asklepiosLogoBase64'] = 'data:image/png;base64,' . base64_encode(file_get_contents($asklepiosLogoPath));
        } else {
            $data['asklepiosLogoBase64'] = null;
        }

        $pdf = Pdf::loadView('pdf.blood_tracking', $data)->setPaper('a4', 'landscape'); // Format paysage pour plus de place

        $action = $request->query('action', 'stream');
        $fileName = 'Suivi_Transfusions_' . now()->format('Ymd_Hi') . '.pdf';

        return $action === 'download' ? $pdf->download($fileName) : $pdf->stream($fileName);
    }
}