<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Laboratory\LabRequest;
use App\Models\Laboratory\LabResult;
use App\Models\Laboratory\LabParameter;
use App\Models\Laboratory\LabRequestLine;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Résultats Laboratoire", description: "Saisie et validation des résultats d'analyses")]
class LabResultController extends Controller
{
    /**
     * Enregistrer les résultats de laboratoire
     */
    #[OA\Post(path: "/api/lab/results/{id}", summary: "Enregistrer les résultats d'une requête", security: [["bearerAuth" => []]], tags: ["Résultats Laboratoire"])]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la requête", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(
                    property: "results",
                    type: "array",
                    items: new OA\Items(
                        properties: [
                            new OA\Property(property: "lab_request_line_id", type: "integer"),
                            new OA\Property(property: "lab_parameter_id", type: "integer"),
                            new OA\Property(property: "value_numeric", type: "number", nullable: true),
                            new OA\Property(property: "value_string", type: "string", nullable: true)
                        ]
                    )
                )
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Résultats enregistrés avec succès")]
    #[OA\Response(response: 500, description: "Erreur lors de l'enregistrement")]
    public function saveResults(Request $request, $id)
    {
        $validated = $request->validate([
            'results' => 'required|array',
            'results.*.lab_request_line_id' => 'required|exists:lab_request_lines,id',
            'results.*.lab_parameter_id' => 'required|exists:lab_parameters,id',
            'results.*.value_numeric' => 'nullable|numeric',
            'results.*.value_string' => 'nullable|string',
        ]);

        $labRequest = LabRequest::with('patient', 'lines.test.parameters')->findOrFail($id);
        $patient = $labRequest->patient;
        $technicianId = auth()->id();

        DB::beginTransaction();
        try {
            foreach ($validated['results'] as $resData) {
                $parameter = LabParameter::find($resData['lab_parameter_id']);
                $isAbnormal = false;
                
                if ($parameter && isset($resData['value_numeric'])) {
                    $val = (float)$resData['value_numeric'];
                    $min = null;
                    $max = null;
                    
                    if ($patient) {
                        $gender = strtolower(trim($patient->gender));
                        if (in_array($gender, ['m', 'homme', 'male'])) {
                            $min = $parameter->reference_min_male;
                            $max = $parameter->reference_max_male;
                        } elseif (in_array($gender, ['f', 'femme', 'female'])) {
                            $min = $parameter->reference_min_female;
                            $max = $parameter->reference_max_female;
                        }
                    }

                    if ($min !== null && $val < $min) $isAbnormal = true;
                    if ($max !== null && $val > $max) $isAbnormal = true;
                }

                // Trouver ou créer le résultat
                LabResult::updateOrCreate(
                    [
                        'lab_request_line_id' => $resData['lab_request_line_id'],
                        'lab_parameter_id' => $resData['lab_parameter_id'],
                    ],
                    [
                        'value_numeric' => $resData['value_numeric'] ?? null,
                        'value_string' => $resData['value_string'] ?? null,
                        'is_abnormal' => $isAbnormal,
                        'status' => 'DRAFT',
                        'technician_id' => $technicianId,
                    ]
                );
            }

            // Vérifier si toutes les lignes ont tous leurs paramètres remplis
            $totalExpectedParams = 0;
            foreach ($labRequest->lines as $line) {
                $totalExpectedParams += $line->test->parameters->count();
            }

            $totalFilledParams = LabResult::whereIn('lab_request_line_id', $labRequest->lines->pluck('id'))->count();

            if ($totalFilledParams >= $totalExpectedParams && $totalExpectedParams > 0) {
                $labRequest->status = 'COMPLETED';
            } else {
                $labRequest->status = 'PARTIAL';
            }
            $labRequest->save();

            DB::commit();

            return response()->json([
                'message' => 'Résultats enregistrés avec succès',
                'request_status' => $labRequest->status
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de l\'enregistrement', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Valider les résultats (Biologiste)
     */
    #[OA\Post(path: "/api/lab/results/{id}/validate", summary: "Valider les résultats d'une requête", security: [["bearerAuth" => []]], tags: ["Résultats Laboratoire"])]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la requête", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Dossier validé avec succès")]
    #[OA\Response(response: 500, description: "Erreur lors de la validation")]
    public function validateResults(Request $request, $id)
    {
        $labRequest = LabRequest::with('lines.results')->findOrFail($id);

        DB::beginTransaction();
        try {
            // Update all results for this request
            foreach ($labRequest->lines as $line) {
                LabResult::where('lab_request_line_id', $line->id)
                    ->update([
                        'status' => 'VALIDATED',
                        'validator_id' => auth()->id(),
                        'validated_at' => now(),
                    ]);
            }

            $labRequest->status = 'VALIDATED';
            $labRequest->save();

            DB::commit();

            return response()->json([
                'message' => 'Dossier validé avec succès',
                'request_status' => $labRequest->status
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Validation Error: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json(['message' => 'Erreur lors de la validation', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Générer le PDF des résultats validés
     */
    #[OA\Get(path: "/api/lab/results/{id}/pdf", summary: "Générer le PDF des résultats validés", security: [["bearerAuth" => []]], tags: ["Résultats Laboratoire"])]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la requête", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Fichier PDF des résultats")]
    #[OA\Response(response: 400, description: "Le dossier n'est pas encore validé")]
    public function generatePdf($id)
    {
        $labRequest = LabRequest::with([
            'patient',
            'lines.test.category',
            'lines.test.parameters',
            'lines.results',
            'profileDoctor.user'
        ])->findOrFail($id);

        if ($labRequest->status !== 'VALIDATED') {
            return response()->json(['message' => 'Le dossier n\'est pas encore validé'], 400);
        }

        // Récupérer le valideur du premier résultat
        $firstResult = LabResult::whereIn('lab_request_line_id', $labRequest->lines->pluck('id'))->first();
        $validator = $firstResult && $firstResult->validator_id ? \App\Models\User::find($firstResult->validator_id) : null;

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.lab_results', [
            'request' => $labRequest,
            'validator' => $validator
        ]);

        return $pdf->download("resultats_labo_REQ-{$labRequest->id}.pdf");
    }
}
