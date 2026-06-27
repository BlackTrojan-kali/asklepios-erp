<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Hospital\MedicalBackground;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Antécédents Médicaux", description: "API de gestion des dossiers d'antécédents médicaux (Profil médical de base) des patients.")]
class MedicalBackgroundController extends Controller
{
    #[OA\Get(
        path: "/api/shared/patients/{patientId}/medical-background",
        summary: "Récupérer les antécédents médicaux d'un patient",
        description: "Affiche le groupe sanguin, les allergies, maladies chroniques et l'historique chirurgical/familial du patient.",
        security: [["sanctum" => []]],
        tags: ["Antécédents Médicaux"]
    )]
    #[OA\Parameter(name: "patientId", in: "path", required: true, description: "ID du patient", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Données récupérées avec succès")]
    #[OA\Response(response: 404, description: "Patient ou dossier médical introuvable")]
    public function show($patientId)
    {
        $patient = Patient::findOrFail($patientId);
        
        // On récupère le background s'il existe, sinon on renvoie une 404 claire
        $background = MedicalBackground::where('patient_id', $patient->id)->firstOrFail();

        return response()->json($background);
    }

    #[OA\Post(
        path: "/api/shared/patients/{patientId}/medical-background",
        summary: "Créer le dossier d'antécédents d'un patient",
        description: "Initialise la fiche des antécédents. Échoue si le patient possède déjà une fiche (Relation 1:1).",
        security: [["sanctum" => []]],
        tags: ["Antécédents Médicaux"]
    )]
    #[OA\Parameter(name: "patientId", in: "path", required: true, description: "ID du patient", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "blood_type", type: "string", example: "O+", description: "A+, A-, B+, B-, AB+, AB-, O+, O-, UNKNOWN"),
                new OA\Property(property: "allergies", type: "array", items: new OA\Items(type: "string"), example: ["Pénicilline", "Iode"]),
                new OA\Property(property: "chronic_conditions", type: "array", items: new OA\Items(type: "string"), example: ["Diabète Type 1", "Asthme"]),
                new OA\Property(property: "past_surgeries", type: "array", items: new OA\Items(type: "string"), example: ["Appendicectomie (2018)"]),
                new OA\Property(property: "current_medications", type: "array", items: new OA\Items(type: "string"), example: ["Lantus 10 UI"]),
                new OA\Property(property: "immunizations", type: "array", items: new OA\Items(type: "string"), example: ["Hépatite B", "Tétanos"]),
                new OA\Property(property: "family_history", type: "string", example: "Père cardiaque, Mère hypertendue"),
                new OA\Property(property: "lifestyle_habits", type: "string", example: "Non-fumeur, consommation occasionnelle d'alcool"),
                new OA\Property(property: "general_notes", type: "string", example: "Patient très coopératif, suivi régulier requis")
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Dossier médical créé avec succès")]
    #[OA\Response(response: 422, description: "Erreur de validation (ex: la fiche existe déjà)")]
    public function store(Request $request, $patientId)
    {
        $patient = Patient::findOrFail($patientId);

        $validated = $request->validate([
            'blood_type'           => ['nullable', Rule::in(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'])],
            'allergies'            => 'nullable|array',
            'chronic_conditions'   => 'nullable|array',
            'past_surgeries'       => 'nullable|array',
            'current_medications'  => 'nullable|array',
            'immunizations'        => 'nullable|array',
            'family_history'       => 'nullable|string',
            'lifestyle_habits'     => 'nullable|string',
            'general_notes'        => 'nullable|string',
        ]);

        // Sécurité stricte 1:1 -> On s'assure que le patient_id reste unique dans la table
        if (MedicalBackground::where('patient_id', $patient->id)->exists()) {
            return response()->json([
                'message' => 'Ce patient possède déjà un dossier d\'antécédents médicaux. Utilisez la méthode de mise à jour (PUT).'
            ], 422);
        }

        $validated['patient_id'] = $patient->id;
        $background = MedicalBackground::create($validated);

        return response()->json([
            'message' => 'Antécédents médicaux initialisés avec succès.',
            'data' => $background
        ], 201);
    }

    #[OA\Put(
        path: "/api/shared/patients/{patientId}/medical-background",
        summary: "Mettre à jour les antécédents d'un patient",
        description: "Modifie les listes d'allergies, pathologies ou habitudes de vie.",
        security: [["sanctum" => []]],
        tags: ["Antécédents Médicaux"]
    )]
    #[OA\Parameter(name: "patientId", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "blood_type", type: "string", example: "AB-"),
                new OA\Property(property: "allergies", type: "array", items: new OA\Items(type: "string"), example: ["Pénicilline", "Arachides"]),
                new OA\Property(property: "general_notes", type: "string", example: "Mise à jour suite à une nouvelle allergie détectée")
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Dossier mis à jour avec succès")]
    #[OA\Response(response: 404, description: "Dossier introuvable")]
    public function update(Request $request, $patientId)
    {
        $background = MedicalBackground::where('patient_id', $patientId)->firstOrFail();

        $validated = $request->validate([
            'blood_type'           => ['nullable', Rule::in(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'])],
            'allergies'            => 'nullable|array',
            'chronic_conditions'   => 'nullable|array',
            'past_surgeries'       => 'nullable|array',
            'current_medications'  => 'nullable|array',
            'immunizations'        => 'nullable|array',
            'family_history'       => 'nullable|string',
            'lifestyle_habits'     => 'nullable|string',
            'general_notes'        => 'nullable|string',
        ]);

        $background->update($validated);

        return response()->json([
            'message' => 'Antécédents médicaux mis à jour avec succès.',
            'data' => $background
        ]);
    }

    #[OA\Delete(
        path: "/api/shared/patients/{patientId}/medical-background",
        summary: "Archiver le dossier d'antécédents",
        description: "Réalise un Soft Delete du dossier d'antécédents du patient.",
        security: [["sanctum" => []]],
        tags: ["Antécédents Médicaux"]
    )]
    #[OA\Parameter(name: "patientId", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Dossier archivé avec succès")]
    public function destroy($patientId)
    {
        $background = MedicalBackground::where('patient_id', $patientId)->firstOrFail();
        $background->delete();

        return response()->json([
            'message' => 'Dossier des antécédents médicaux archivé avec succès.'
        ]);
    }
}