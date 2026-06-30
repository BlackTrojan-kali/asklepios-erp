<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\Hospital\Admission;
use App\Models\Hospital\Bed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;
use Exception;

#[OA\Tag(name: "Hospitalisations", description: "Gestion des admissions, des lits et des sorties des patients")]
class AdmissionController extends Controller
{
    #[OA\Get(
        path: "/api/shared/admissions",
        summary: "Lister l'historique des hospitalisations",
        description: "Permet à l'administrateur et aux médecins de voir les admissions en cours ou passées.",
        security: [["sanctum" => []]],
        tags: ["Hospitalisations"]
    )]
    #[OA\Response(response: 200, description: "Liste récupérée avec succès")]
    public function index(Request $request)
    {
        $query = Admission::with([
            'patient.medicalBackground', 
            'bed.facilityRoom', // Pour avoir la salle (et la catégorie) liée au lit
            'doctor.user'
        ]);

        // Filtre : Uniquement les patients actuellement hospitalisés
        if ($request->query('status') === 'ADMITTED') {
            $query->where('status', 'ADMITTED');
        }

        // Filtre : Historique d'un patient spécifique
        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        $query->orderBy('admission_date', 'desc');

        return response()->json($query->paginate($request->query('per_page', 15)));
    }

 #[OA\Post(
        path: "/api/shared/admissions",
        summary: "Admettre un patient (Hospitalisation)",
        description: "Assigne un lit à un patient et marque le lit comme OCCUPIED.",
        security: [["sanctum" => []]],
        tags: ["Hospitalisations"]
    )]
    #[OA\Response(response: 201, description: "Patient admis avec succès")]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id'              => 'required|exists:patients,id',
            'patient_visit_id'        => 'nullable|exists:patient_visits,id',
            'profile_doctor_id'       => 'nullable|exists:profile_doctors,id',
            'bed_id'                  => 'required|exists:beds,id',
            'reason_for_admission'    => 'required|string',
            'expected_discharge_date' => 'nullable|date|after:now',
        ]);

        // 1. Vérifier si le patient est DÉJÀ hospitalisé ailleurs
        $alreadyAdmitted = Admission::where('patient_id', $validated['patient_id'])
                                    ->where('status', 'ADMITTED')
                                    ->exists();
        
        if ($alreadyAdmitted) {
            return response()->json(['message' => 'Ce patient est déjà actuellement hospitalisé.'], 422);
        }

        // 2. Vérifier si le lit est disponible
        $bed = Bed::findOrFail($validated['bed_id']);
        if ($bed->state !== 'AVAILABLE') {
            return response()->json(['message' => 'Ce lit n\'est pas disponible (Statut actuel : ' . $bed->state . ').'], 422);
        }

        try {
            // Transaction pour s'assurer que l'admission et le changement d'état du lit se fassent en même temps
            $admission = DB::transaction(function () use ($validated, $bed) {
                
                $validated['admission_date'] = now();
                $validated['status'] = 'ADMITTED';
                
                $newAdmission = Admission::create($validated);

                // Mettre à jour l'état du lit
                $bed->update(['state' => 'OCCUPIED']);

                // On charge les relations nécessaires pour la réponse ET pour la notification
                return $newAdmission->load(['patient', 'bed.facilityRoom', 'doctor.user']);
            });

            // 3. ENVOI DE LA NOTIFICATION AU DOCTEUR
            // On vérifie que l'admission est bien rattachée à un docteur et que ce docteur a un compte utilisateur
            if ($admission->doctor && $admission->doctor->user) {
                $admission->doctor->user->notify(new PatientAdmittedNotification($admission));
            }

            return response()->json([
                'message' => 'Patient admis avec succès dans le lit ' . $bed->bed_number,
                'data' => $admission
            ], 201);

        } catch (Exception $e) {
            return response()->json(['message' => 'Erreur lors de l\'admission.', 'error' => $e->getMessage()], 500);
        }
    }

    #[OA\Patch(
        path: "/api/shared/admissions/{id}/discharge",
        summary: "Autoriser la sortie d'un patient",
        description: "Clôture l'hospitalisation et libère le lit (le passe en statut CLEANING).",
        security: [["sanctum" => []]],
        tags: ["Hospitalisations"]
    )]
    #[OA\Response(response: 200, description: "Sortie enregistrée avec succès")]
    public function discharge(Request $request, $id)
    {
        $validated = $request->validate([
            'discharge_notes' => 'nullable|string',
        ]);

        $admission = Admission::with('bed')->findOrFail($id);

        if ($admission->status === 'DISCHARGED') {
            return response()->json(['message' => 'Ce patient est déjà sorti.'], 422);
        }

        try {
            DB::transaction(function () use ($admission, $validated) {
                
                // 1. Mettre à jour l'admission
                $admission->update([
                    'status' => 'DISCHARGED',
                    'actual_discharge_date' => now(),
                    'discharge_notes' => $validated['discharge_notes'] ?? null,
                ]);

                // 2. Libérer le lit : En milieu hospitalier, un lit libéré passe en nettoyage avant d'être AVAILABLE
                if ($admission->bed) {
                    $admission->bed->update(['state' => 'CLEANING']);
                }
            });

            return response()->json([
                'message' => 'Le patient a été autorisé à sortir. Le lit a été mis en attente de nettoyage.',
                'data' => $admission
            ], 200);

        } catch (Exception $e) {
            return response()->json(['message' => 'Erreur lors de la sortie du patient.', 'error' => $e->getMessage()], 500);
        }
    }
}