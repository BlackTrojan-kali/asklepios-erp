<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Laboratory\LabRequest;
use App\Models\Laboratory\LabSample;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class LabRequestController extends Controller
{
    /**
     * Obtenir la liste des requêtes de laboratoire.
     * On peut filtrer par status.
     */
    public function index(Request $request)
    {
        $status = $request->query('status'); // ex: 'PAID', 'SAMPLED'

        $user = auth()->user();
        $centerId = 1; // Default fallback for MVP

        $centerId = $user?->profile_admin?->hospital?->centers?->first()?->id ?? 1;

        $query = LabRequest::with([
            'patient',
            'lines.test.category',
            'lines.test.parameters',
            'lines.results',
            'samples',
            'profileDoctor.user'
        ])
        ->where('center_id', $centerId);

        if ($status) {
            $query->where('status', $status);
        }

        $requests = $query->orderBy('created_at', 'desc')->get();

        return response()->json($requests);
    }

    /**
     * Voir une requête spécifique.
     */
    public function show($id)
    {
        $labRequest = LabRequest::with([
            'patient',
            'lines.test.category',
            'lines.test.parameters',
            'lines.results',
            'samples',
            'profileDoctor.user'
        ])->findOrFail($id);

        return response()->json($labRequest);
    }

    /**
     * Générer les prélèvements (tubes) pour une requête et la passer au statut 'SAMPLED'.
     */
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
