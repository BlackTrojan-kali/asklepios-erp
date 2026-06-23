<?php

namespace App\Http\Controllers\Receptionist;

use App\Http\Controllers\Controller;
use App\Http\Services\PatientCodeService;
use App\Models\Patient;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Patients (Réception)", description: "Gestion des dossiers patients par le personnel d'accueil")]
class PatientController extends Controller
{
    protected PatientCodeService  $codeService;

    /**
     * Injection du service de génération de code unique
     */
    public function __construct(PatientCodeService $codeService)
    {
        $this->codeService = $codeService;
    }

    /**
     * Récupère l'ID de l'hôpital depuis le profil réceptionniste connecté
     */
    private function getHospitalId()
    {
        $user = auth()->user();
        
        if ($user->profile_reception) {
            return $user->profile_reception->hospital_id;
        }
        
        abort(403, "Profil non autorisé. Seul un réceptionniste peut interagir avec les dossiers patients.");
    }

    /**
     * Lister les patients (Paginé + Filtres OU Liste brute pour React-Select)
     */
    #[OA\Get(
        path: "/api/receptionist/patients",
        operationId: "getReceptionistPatients",
        summary: "Lister et filtrer les patients",
        security: [["bearerAuth" => []]],
        tags: ["Patients (Réception)"]
    )]
    #[OA\Parameter(name: "search", in: "query", required: false, description: "Recherche par code, nom, prénom ou téléphone", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "paginated", in: "query", required: false, description: "true pour paginer, false pour tout récupérer (React-Select)", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "per_page", in: "query", required: false, schema: new OA\Schema(type: "integer", default: 15))]
    #[OA\Response(response: 200, description: "Liste récupérée avec succès")]
    public function index(Request $request)
    {
        $hospitalId = $this->getHospitalId();
        $query = Patient::where('hospital_id', $hospitalId);
        // Filtre de recherche (Code, Nom, Prénom, Téléphone)
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('patient_code', 'like', "%{$search}%")
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('contact_phone', 'like', "%{$search}%");
            });
        }

        $query->latest();

        // Gestion de la liste à plat pour les sélecteurs dynamiques (React-Select)
        if ($request->query('paginated') === 'false') {
            return response()->json($query->get(), 200);
        }

        $perPage = $request->query('per_page', 15);
        return response()->json($query->paginate($perPage), 200);
    }

    /**
     * Créer un dossier patient avec génération automatique de code
     */
    #[OA\Post(
        path: "/api/receptionist/patients",
        operationId: "storeReceptionistPatient",
        summary: "Enregistrer un nouveau patient",
        security: [["bearerAuth" => []]],
        tags: ["Patients (Réception)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["first_name", "bith_date", "contact_phone"],
            properties: [
                new OA\Property(property: "first_name", type: "string", example: "John"),
                new OA\Property(property: "last_name", type: "string", nullable: true, example: "Doe"),
                new OA\Property(property: "bith_date", type: "string", format: "date", example: "1995-05-15"),
                new OA\Property(property: "contact_phone", type: "string", example: "677123456")
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Patient enregistré avec succès")]
    public function store(Request $request)
    {
        $hospitalId = $this->getHospitalId();

        $validatedData = $request->validate([
            'first_name'    => 'required|string|max:255',
            'last_name'     => 'nullable|string|max:255',
            'bith_date'     => 'required|date|before:tomorrow',
            'contact_phone' => 'required|string|max:50',
        ]);

        // Génération du code unique à l'aide du service injecté
        $validatedData['patient_code'] = $this->codeService->generateUniqueCode($hospitalId);
        $validatedData['hospital_id'] = $hospitalId;

        $patient = Patient::create($validatedData);

        return response()->json([
            'message' => 'Dossier patient créé avec succès',
            'data'    => $patient
        ], 201);
    }

    /**
     * Afficher les détails d'un patient
     */
    #[OA\Get(
        path: "/api/receptionist/patients/{id}",
        operationId: "showReceptionistPatient",
        summary: "Détails d'un dossier patient",
        security: [["bearerAuth" => []]],
        tags: ["Patients (Réception)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Détails récupérés avec succès")]
    public function show($id)
    {
        $hospitalId = $this->getHospitalId();
        $patient = Patient::where('hospital_id', $hospitalId)->findOrFail($id);

        return response()->json($patient, 200);
    }

    /**
     * Modifier un dossier patient existant
     */
    #[OA\Put(
        path: "/api/receptionist/patients/{id}",
        operationId: "updateReceptionistPatient",
        summary: "Modifier un dossier patient",
        security: [["bearerAuth" => []]],
        tags: ["Patients (Réception)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Dossier patient mis à jour avec succès")]
    public function update(Request $request, $id)
    {
        $hospitalId = $this->getHospitalId();
        $patient = Patient::where('hospital_id', $hospitalId)->findOrFail($id);

        $validatedData = $request->validate([
            'first_name'    => 'sometimes|required|string|max:255',
            'last_name'     => 'nullable|string|max:255',
            'bith_date'     => 'sometimes|required|date|before:tomorrow',
            'contact_phone' => 'sometimes|required|string|max:50',
        ]);

        $patient->update($validatedData);

        return response()->json([
            'message' => 'Dossier patient mis à jour avec succès',
            'data'    => $patient
        ], 200);
    }

    /**
     * Supprimer un patient (Soft Delete)
     */
    #[OA\Delete(
        path: "/api/receptionist/patients/{id}",
        operationId: "deleteReceptionistPatient",
        summary: "Supprimer un dossier patient (Soft Delete)",
        security: [["bearerAuth" => []]],
        tags: ["Patients (Réception)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Patient archivé avec succès")]
    public function destroy($id)
    {
        $hospitalId = $this->getHospitalId();
        $patient = Patient::where('hospital_id', $hospitalId)->findOrFail($id);
        
        $patient->delete();

        return response()->json([
            'message' => 'Dossier patient archivé avec succès'
        ], 200);
    }
}