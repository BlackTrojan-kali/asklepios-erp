<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Services\PatientCoverageService;
use App\Models\PatientCoverage;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Assurances & Couvertures Patients",
    description: "Gestion des prises en charge et couvertures d'assurances des patients"
)]
class PatientCoverageController extends Controller
{
    protected PatientCoverageService $coverageService;

    /**
     * Injection de dépendance via le constructeur
     */
    public function __construct(PatientCoverageService $coverageService)
    {
        $this->coverageService = $coverageService;
    }

    #[OA\Get(
        path: "/api/insurance-coverages/patient/{patient_id}",
        operationId: "getPatientCoverages",
        summary: "Lister les assurances d'un patient",
        description: "Récupère toutes les couvertures d'assurance d'un patient spécifique, triées par ordre de priorité.",
        tags: ["Assurances & Couvertures Patients"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(
        name: "patient_id",
        in: "path",
        required: true,
        description: "ID du patient",
        schema: new OA\Schema(type: "integer", example: 1)
    )]
    #[OA\Response(
        response: 200,
        description: "Liste récupérée avec succès",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "status", type: "string", example: "success"),
                new OA\Property(property: "data", type: "array", items: new OA\Items(
                    properties: [
                        new OA\Property(property: "id", type: "integer"),
                        new OA\Property(property: "insurance_company_id", type: "integer"),
                        new OA\Property(property: "policy_number", type: "string"),
                        new OA\Property(property: "coverage_rate", type: "number"),
                        new OA\Property(property: "priority_order", type: "integer"),
                        new OA\Property(property: "insurance_company", type: "object") 
                    ]
                ))
            ]
        )
    )]
    public function getPatientCoverages($patientId) // <-- CORRECTION : getPatientCoverages au lieu de getByPatient
    {
        $coverages = PatientCoverage::with('insuranceCompany')
            ->where('patient_id', $patientId)
            ->orderBy('priority_order', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $coverages
        ]);
    }

    #[OA\Post(
        path: "/api/insurance-coverages",
        operationId: "storePatientCoverage",
        summary: "Ajouter une couverture d'assurance à un patient",
        description: "Assigne une assurance à un patient avec un matricule et un taux de couverture.",
        tags: ["Assurances & Couvertures Patients"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["patient_id", "insurance_company_id", "valid_until", "policy_number", "coverage_rate"],
            properties: [
                new OA\Property(property: "patient_id", type: "integer", example: 1),
                new OA\Property(property: "insurance_company_id", type: "integer", example: 2),
                new OA\Property(property: "valid_until", type: "string", format: "date", example: "2027-12-31"),
                new OA\Property(property: "is_active", type: "boolean", example: true),
                new OA\Property(property: "policy_number", type: "string", example: "MAT-2026-X89"),
                new OA\Property(property: "coverage_rate", type: "number", format: "float", example: 80.5),
                new OA\Property(property: "priority_order", type: "integer", example: 1)
            ]
        )
    )]
    #[OA\Response(
        response: 201,
        description: "Couverture ajoutée avec succès",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "status", type: "string", example: "success"),
                new OA\Property(property: "message", type: "string", example: "Couverture patient enregistrée avec succès."),
                new OA\Property(property: "data", type: "object")
            ]
        )
    )]
    public function store(Request $request)
    {
      $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'insurance_company_id' => 'required|exists:insurance_companies,id',
            'valid_until' => 'required|date|after_or_equal:today',
            'is_active' => 'boolean',
            'policy_number' => 'required|string|max:255',
            'coverage_rate' => 'required|numeric|min:0|max:100',
            'priority_order' => 'nullable|integer|min:1',
            // NOUVELLES RÈGLES POUR LE TABLEAU :
            'coverage_scope' => 'required|array|min:1', 
            'coverage_scope.*' => 'required|string|in:consultation,pharmacy,lab',
        ]);
        
        $validated['priority_order'] = $validated['priority_order'] ?? 1;
        
        $coverage = $this->coverageService->createCoverage($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Couverture patient enregistrée avec succès.',
            'data' => $coverage
        ], 201);
    }

    #[OA\Put(
        path: "/api/insurance-coverages/{id}",
        operationId: "updatePatientCoverage",
        summary: "Mettre à jour la couverture d'un patient",
        description: "Modifie les détails d'une couverture d'assurance existante.",
        tags: ["Assurances & Couvertures Patients"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(
        name: "id",
        in: "path",
        required: true,
        description: "ID de la couverture",
        schema: new OA\Schema(type: "integer", example: 1)
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "valid_until", type: "string", format: "date", example: "2028-01-01"),
                new OA\Property(property: "is_active", type: "boolean", example: false),
                new OA\Property(property: "policy_number", type: "string", example: "MAT-NEW-123"),
                new OA\Property(property: "coverage_rate", type: "number", format: "float", example: 100),
                new OA\Property(property: "priority_order", type: "integer", example: 1)
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Mise à jour réussie")]
    public function update(Request $request, $id)
    {
      $validated = $request->validate([
            'valid_until' => 'sometimes|required|date',
            'is_active' => 'sometimes|boolean',
            'policy_number' => 'sometimes|required|string|max:255',
            'coverage_rate' => 'sometimes|required|numeric|min:0|max:100',
            'priority_order' => 'sometimes|integer|min:1', 
            // NOUVELLES RÈGLES POUR LE TABLEAU :
            'coverage_scope' => 'sometimes|required|array|min:1',
            'coverage_scope.*' => 'required|string|in:consultation,pharmacy,lab',
        ]);

        $coverage = $this->coverageService->updateCoverage($id, $validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Couverture mise à jour avec succès.',
            'data' => $coverage
        ]);
    }

    #[OA\Delete(
        path: "/api/insurance-coverages/{id}",
        operationId: "removePatientCoverage",
        summary: "Supprimer une couverture d'assurance",
        description: "Retire la couverture d'assurance d'un patient.",
        tags: ["Assurances & Couvertures Patients"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(
        name: "id",
        in: "path",
        required: true,
        description: "ID de la couverture à supprimer",
        schema: new OA\Schema(type: "integer", example: 1)
    )]
    #[OA\Response(response: 200, description: "Suppression réussie")]
    public function destroy($id)
    {
        $this->coverageService->deleteCoverage($id);

        return response()->json([
            'status' => 'success',
            'message' => 'Couverture d\'assurance retirée avec succès.'
        ]);
    }
}