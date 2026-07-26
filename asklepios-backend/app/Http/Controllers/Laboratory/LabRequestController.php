<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Laboratory\LabRequest;
use App\Models\Laboratory\LabSample;
use App\Models\Laboratory\LabTest;
use App\Models\Laboratory\LabRequestLine;
use App\Models\Laboratory\Laboratory;
use App\Models\Hospital\Invoice;
use App\Models\Center;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Requêtes Laboratoire", description: "Gestion des requêtes d'analyses (demandes)")]
class LabRequestController extends Controller
{
    /**
     * Obtenir la liste des requêtes de laboratoire.
     * On peut filtrer par status.
     */
    #[OA\Get(path: "/api/lab/requests", summary: "Lister les requêtes de laboratoire", security: [["bearerAuth" => []]], tags: ["Requêtes Laboratoire"])]
    #[OA\Parameter(name: "status", in: "query", required: false, description: "Filtrer par statut (ex: PAID, SAMPLED)", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Liste des requêtes récupérée")]
    public function index(Request $request)
    {
        $status = $request->query('status'); // ex: 'PAID', 'SAMPLED', 'PENDING_PAYMENT'
        $patientId = $request->query('patient_id');
        $patientCode = $request->query('patient_code');

        $user = auth()->user();
        $laboratoryId = $user?->profile_lab?->laboratory_id;

        $query = LabRequest::with([
            'patient',
            'lines.test.category',
            'lines.test.parameters',
            'lines.results',
            'samples',
            'profileDoctor.user',
            'invoice.payments'
        ]);

        if ($laboratoryId) {
            $query->where('laboratory_id', $laboratoryId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($patientId) {
            $query->where('patient_id', $patientId);
        }

        if ($patientCode) {
            $query->whereHas('patient', function ($q) use ($patientCode) {
                $q->where('patient_code', 'like', "%{$patientCode}%");
            });
        }

        $requests = $query->orderBy('created_at', 'desc')->get();

        // Garantir que toutes les demandes d'examens ont une facture rattachée pour le paiement
        foreach ($requests as $req) {
            if (!$req->invoice_id && $req->lines->count() > 0) {
                $totalAmount = $req->lines->reduce(function ($sum, $line) {
                    return $sum + ($line->test?->price ?? 0);
                }, 0);

                $centerId = $req->profileDoctor?->center_id ?? 1;

                $invoice = \App\Models\Hospital\Invoice::create([
                    'patient_id'       => $req->patient_id,
                    'center_id'        => $centerId,
                    'patient_visit_id' => $req->patient_visit_id,
                    'total_amount'     => $totalAmount,
                    'status'           => 'UNPAID'
                ]);

                $req->invoice_id = $invoice->id;
                $req->save();
                $req->load('invoice.payments');
            }

            // Calcul et synchronisation dynamique de is_paid sur les lignes
            if ($req->invoice) {
                $totalPaid = (float) $req->invoice->payments->sum('amount');
                $running = 0.0;
                foreach ($req->lines as $line) {
                    $price = (float) ($line->test?->price ?? 0.0);
                    $running += $price;
                    $line->is_paid = ($req->status === 'PAID' || ($totalPaid > 0 && $running <= $totalPaid + 0.01));
                }
            }
        }

        return response()->json($requests);
    }

    /**
     * Créer une nouvelle requête de laboratoire avec facturation.
     */
    #[OA\Post(path: "/api/lab/requests", summary: "Créer une demande d'examen", security: [["bearerAuth" => []]], tags: ["Requêtes Laboratoire"])]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["patient_id", "test_ids"],
            properties: [
                new OA\Property(property: "patient_id", type: "integer", example: 1),
                new OA\Property(property: "test_ids", type: "array", items: new OA\Items(type: "integer"), example: [1, 2]),
                new OA\Property(property: "external_prescriber_name", type: "string", example: "Dr. Dupont", nullable: true),
                new OA\Property(property: "profile_doctor_id", type: "integer", nullable: true),
                new OA\Property(property: "patient_visit_id", type: "integer", nullable: true),
                new OA\Property(property: "priority", type: "string", enum: ["ROUTINE", "URGENT"], default: "ROUTINE")
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Requête et facture créées avec succès")]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'test_ids' => 'required|array|min:1',
            'test_ids.*' => 'exists:lab_tests,id',
            'external_prescriber_name' => 'nullable|string',
            'profile_doctor_id' => 'nullable|exists:profile_doctors,id',
            'patient_visit_id' => 'nullable|exists:patient_visits,id',
            'priority' => 'nullable|in:ROUTINE,URGENT'
        ]);

        $user = auth()->user();
        $laboratoryId = $user?->profile_lab?->laboratory_id;
        
        if (!$laboratoryId) {
            return response()->json(['message' => 'Utilisateur non associé à un laboratoire'], 403);
        }

        try {
            DB::beginTransaction();

            $laboratory = Laboratory::findOrFail($laboratoryId);
            $hospitalId = $laboratory->hospital_id;
            $centerId = $laboratory->center_id;

            // Calcul du prix total
            $tests = LabTest::whereIn('id', $validated['test_ids'])->get();
            $totalAmount = $tests->sum('price');

            // 1. Création de la facture (Invoice)
            $invoice = Invoice::create([
                'patient_id' => $validated['patient_id'],
                'center_id' => $centerId,
                'patient_visit_id' => $validated['patient_visit_id'] ?? null,
                'total_amount' => $totalAmount,
                'status' => 'UNPAID',
            ]);

            // 2. Création de la requête labo (LabRequest) liée à la facture
            $labRequest = LabRequest::create([
                'patient_id' => $validated['patient_id'],
                'laboratory_id' => $laboratoryId,
                'invoice_id' => $invoice->id,
                'patient_visit_id' => $validated['patient_visit_id'] ?? null,
                'profile_doctor_id' => $validated['profile_doctor_id'] ?? null,
                'external_prescriber_name' => $validated['external_prescriber_name'] ?? null,
                'priority' => $validated['priority'] ?? 'ROUTINE',
                'status' => 'PENDING_PAYMENT',
            ]);

            // 3. Création des lignes de requête
            foreach ($tests as $test) {
                LabRequestLine::create([
                    'lab_request_id' => $labRequest->id,
                    'lab_test_id' => $test->id,
                ]);

                \App\Models\Hospital\InvoiceLine::create([
                    'invoice_id' => $invoice->id,
                    'lab_request_id' => $labRequest->id,
                    'unit_price' => $test->price,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Demande d\'examen créée avec succès',
                'lab_request' => $labRequest->load('lines.test'),
                'invoice' => $invoice
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erreur création LabRequest: " . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la création de la demande.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Voir une requête spécifique.
     */
    #[OA\Get(path: "/api/lab/requests/{id}", summary: "Voir une requête", security: [["bearerAuth" => []]], tags: ["Requêtes Laboratoire"])]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la requête", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Détails de la requête")]
    public function show($id)
    {
        $labRequest = LabRequest::with([
            'patient',
            'lines.test.category',
            'lines.test.parameters',
            'lines.results',
            'samples',
            'profileDoctor.user',
            'invoice.payments'
        ])->findOrFail($id);

        return response()->json($labRequest);
    }

    /**
     * Générer les prélèvements (tubes) pour une requête et la passer au statut 'SAMPLED'.
     */
    #[OA\Post(path: "/api/lab/requests/{id}/sample", summary: "Générer les prélèvements", security: [["bearerAuth" => []]], tags: ["Requêtes Laboratoire"])]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la requête", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Échantillons générés avec succès")]
    #[OA\Response(response: 400, description: "Cette requête n'est pas au statut PAID")]
    #[OA\Response(response: 500, description: "Erreur lors de la génération des prélèvements")]
    public function markAsSampled($id)
    {
        $labRequest = LabRequest::with('lines.test')->findOrFail($id);

        if ($labRequest->status !== 'PAID') {
            return response()->json(['message' => 'Cette requête n\'est pas au statut PAID.'], 400);
        }

        try {
            DB::beginTransaction();

            // Grouper les examens par type de tube (sample_type_required)
            $tubeTypes = [];
            foreach ($labRequest->lines as $line) {
                if ($line->test && $line->test->sample_type_required) {
                    $tubeType = $line->test->sample_type_required;
                    if (!in_array($tubeType, $tubeTypes)) {
                        $tubeTypes[] = $tubeType;
                    }
                }
            }

            // Si la requête n'a pas de tests nécessitant un tube, on crée quand même un échantillon "Générique"
            if (empty($tubeTypes)) {
                $tubeTypes[] = 'Standard / Indéfini';
            }

            $generatedSamples = [];
            $timestamp = Carbon::now()->format('ymdHis');

            // Créer un échantillon pour chaque type de tube nécessaire
            foreach ($tubeTypes as $index => $type) {
                // Générer un code barre unique: ex: SMP-ReqID-Timestamp-Index
                $barcode = "SMP-{$labRequest->id}-{$timestamp}-" . ($index + 1);

                $sample = LabSample::create([
                    'lab_request_id' => $labRequest->id,
                    'barcode' => $barcode,
                    'sample_type' => $type,
                    'collected_by' => auth()->id(),
                    'status' => 'COLLECTED'
                ]);

                $generatedSamples[] = $sample;
            }

            // Mettre à jour le statut de la requête
            $labRequest->status = 'SAMPLED';
            $labRequest->save();

            DB::commit();

            return response()->json([
                'message' => 'Échantillons générés avec succès.',
                'request_status' => $labRequest->status,
                'samples' => $generatedSamples
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erreur lors de la génération des échantillons: " . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la génération des prélèvements.'], 500);
        }
    }
}
