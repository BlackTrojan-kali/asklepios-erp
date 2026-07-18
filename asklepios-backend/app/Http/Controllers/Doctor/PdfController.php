<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Hospital\Consultation;
use Barryvdh\DomPDF\Facade\Pdf;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "PDF", description: "Génération de documents PDF pour les consultations médicales.")]
class PdfController extends Controller
{

    #[OA\Get(
        path: "/api/doctor/consultations/{id}/prescription-pdf",
        summary: "Télécharger l'ordonnance en PDF",
        security: [["sanctum" => []]],
        tags: ["Consultations Médicales"]
    )]
    #[OA\Response(response: 200, description: "Succès : Retourne le fichier PDF")]
    #[OA\Response(response: 404, description: "Non trouvé : Aucune ordonnance")]
    #[OA\Response(response: 401, description: "Non autorisé")]
    public function downloadPrescriptionPdf($id)
    {
        $user = auth()->user();
        
        $consultation = Consultation::with([
            'patientVisit.patient',
            'patientVisit.center',
            'profileDoctor.user',
            'prescriptions.prescriptionLines'
        ])
        ->where('profile_doctor_id', $user->profile_doctor->id ?? 0)
        ->findOrFail($id);

        if ($consultation->prescriptions->isEmpty()) {
            return response()->json(['message' => 'Aucune ordonnance pour cette consultation.'], 404);
        }

        $prescription = $consultation->prescriptions->first(); // On suppose une seule ordonnance par consultation pour simplifier
        
        $pdf = Pdf::loadView('pdf.prescription', [
            'consultation' => $consultation,
            'prescription' => $prescription,
            'doctor' => $consultation->profileDoctor,
            'patient' => $consultation->patientVisit->patient,
            'center' => $consultation->patientVisit->center,
        ]);

        return $pdf->download('ordonnance_' . $consultation->id . '.pdf');
    }


    #[OA\Get(
        path: "/api/doctor/consultations/{id}/exam-request-pdf",
        summary: "Télécharger la demande d'examens en PDF",
        security: [["sanctum" => []]],
        tags: ["Consultations Médicales"]
    )]   
    #[OA\Response(response: 200, description: "Succès : Retourne le fichier PDF")]
    #[OA\Response(response: 404, description: "Non trouvé : Aucune demande")]
    #[OA\Response(response: 401, description: "Non autorisé")] 
    public function downloadExamRequestPdf($id)
    {
        $user = auth()->user();
        
        $consultation = Consultation::with([
            'patientVisit.patient',
            'patientVisit.center',
            'profileDoctor.user',
            'examRequests.examRequestLines'
        ])
        ->where('profile_doctor_id', $user->profile_doctor->id ?? 0)
        ->findOrFail($id);

        if ($consultation->examRequests->isEmpty()) {
            return response()->json(['message' => 'Aucune demande d\'examens pour cette consultation.'], 404);
        }

        $examRequest = $consultation->examRequests->first(); 
        
        $pdf = Pdf::loadView('pdf.exam-request', [
            'consultation' => $consultation,
            'examRequest' => $examRequest,
            'doctor' => $consultation->profileDoctor,
            'patient' => $consultation->patientVisit->patient,
            'center' => $consultation->patientVisit->center,
        ]);

        return $pdf->download('demande_examens_' . $consultation->id . '.pdf');
    }
}
