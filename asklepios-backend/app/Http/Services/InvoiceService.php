<?php

namespace App\Http\Services;

use App\Models\Hospital\Invoice;
use App\Models\Hospital\Consultation;
use App\Models\Hospital\Admission;
use App\Models\Hospital\PerformedMedicalAct;
use App\Models\Hospital\PatientVisit;
use App\Models\Patient;
use Illuminate\Support\Facades\DB;
use Exception;

class InvoiceService
{
    /**
     * Génère une facture (UNPAID) regroupant tous les actes non facturés d'un patient.
     * 
     * @param int $patientId L'ID du patient
     * @param float|null $consultationPrice Le prix appliqué à la consultation
     * @return Invoice
     */
    public function generateInvoiceForPatient(int $patientId, ?float $consultationPrice = 0.0, ?int $centerId)
    {
        $patient = Patient::findOrFail($patientId);

        return DB::transaction(function () use ($patient, $consultationPrice, $centerId) {
            
            // 1. Récupérer les consultations non facturées (liées à une Visite OU à une Admission)
            $unbilledConsultations = Consultation::where(function($query) use ($patient) {
                $query->whereHas('patientVisit', function($q) use ($patient) {
                    $q->where('patient_id', $patient->id);
                })->orWhereHas('admission', function($q) use ($patient) {
                    $q->where('patient_id', $patient->id);
                });
            })->where('is_billed', false)->get();

            // 2. Récupérer les actes non facturés (liés à une Visite OU à une Admission)
            $unbilledActs = PerformedMedicalAct::where(function($query) use ($patient) {
                $query->whereHas('patientVisit', function($q) use ($patient) {
                    $q->where('patient_id', $patient->id);
                })->orWhereHas('admission', function($q) use ($patient) {
                    $q->where('patient_id', $patient->id);
                });
            })->where('is_billed', false)->get();

            // 3. Récupérer les séjours (hospitalisations) non facturés
            $unbilledAdmissions = Admission::with('bed.facilityRoom.category')
                ->where('patient_id', $patient->id)
                ->where('is_billed', false)
                ->get();

            // S'il n'y a absolument rien à facturer
            if ($unbilledConsultations->isEmpty() && $unbilledActs->isEmpty() && $unbilledAdmissions->isEmpty()) {
                throw new Exception("Ce patient n'a aucun soin en attente de facturation.");
            }

            $totalAmount = 0.0;

            // --- A. Calcul des consultations
            foreach ($unbilledConsultations as $consultation) {
                $consultation->consultation_price = $consultationPrice;
                $consultation->save();
                $totalAmount += $consultationPrice;
            }

            // --- B. Calcul des actes médicaux
            foreach ($unbilledActs as $act) { 
                $totalAmount += $act->applied_price; 
            }

            // --- C. Calcul des frais de séjour (Hospitalisations)
            foreach ($unbilledAdmissions as $admission) {
                $room = $admission->bed->facilityRoom ?? null;
                $nightPrice = $room && $room->category ? $room->category->price_per_night : 0;
                
                $startDate = \Carbon\Carbon::parse($admission->admission_date);
                $endDate = $admission->actual_discharge_date ? \Carbon\Carbon::parse($admission->actual_discharge_date) : now();
                
                $nights = max(1, $startDate->diffInDays($endDate));
                $totalAmount += ($nightPrice * $nights);
            }

            // On utilise la dernière visite trouvée pour attacher la facture à un centre
            $lastVisit = PatientVisit::where('patient_id', $patient->id)->latest('id')->first();
            
            // Création de la facture
            $invoice = Invoice::create([
                'patient_id'       => $patient->id,
                'center_id'        => $lastVisit ? $lastVisit->center_id : $centerId,
                'patient_visit_id' => $lastVisit ? $lastVisit->id : null,
                'total_amount'     => $totalAmount,
                'status'           => 'UNPAID',
            ]);

            // Mise à jour de tous les éléments liés (is_billed = true)
            Consultation::whereIn('id', $unbilledConsultations->pluck('id'))->update(['is_billed' => true, 'invoice_id' => $invoice->id]);
            PerformedMedicalAct::whereIn('id', $unbilledActs->pluck('id'))->update(['is_billed' => true, 'invoice_id' => $invoice->id]);
            Admission::whereIn('id', $unbilledAdmissions->pluck('id'))->update(['is_billed' => true, 'invoice_id' => $invoice->id]);

            return $invoice;
        });
    }

    /**
     * Génère une facture spécifique pour une visite unique donnée.
     */
    public function generateInvoiceForVisit(int $visitId, ?float $consultationPrice = 0.0)
    {
        $visit = PatientVisit::findOrFail($visitId);

        return DB::transaction(function () use ($visit, $consultationPrice) {
            
            // 1. Récupérer les éléments NON FACTURÉS rattachés à cette visite
            $unbilledConsultations = Consultation::where('patient_visit_id', $visit->id)
                                                 ->where('is_billed', false)->get();
                                                 
            $unbilledActs = PerformedMedicalAct::where('patient_visit_id', $visit->id)
                                               ->where('is_billed', false)->get();
                                               
            $unbilledAdmissions = Admission::where('patient_visit_id', $visit->id)
                                           ->where('is_billed', false)->get();

            // 2. Si rien à facturer, on arrête
            if ($unbilledConsultations->isEmpty() && $unbilledActs->isEmpty() && $unbilledAdmissions->isEmpty()) {
                throw new Exception("Aucun élément non facturé trouvé pour cette visite.");
            }

            // 3. Calcul du montant total
            $totalAmount = 0.0;

            // 3.a Calculer les consultations
            foreach ($unbilledConsultations as $consultation) {
                $consultation->consultation_price = $consultationPrice;
                $consultation->save();
                $totalAmount += $consultationPrice;
            }

            // 3.b Calculer les actes médicaux
            foreach ($unbilledActs as $act) {
                $totalAmount += $act->applied_price;
            }

            // 3.c Calculer les admissions
            foreach ($unbilledAdmissions as $admission) {
                $room = $admission->bed->facilityRoom ?? null;
                $nightPrice = $room && $room->category ? $room->category->price_per_night : 0;
                
                $startDate = \Carbon\Carbon::parse($admission->admission_date);
                $endDate = $admission->actual_discharge_date ? \Carbon\Carbon::parse($admission->actual_discharge_date) : now();
                            
                $nights = max(1, $startDate->diffInDays($endDate));
                $totalAmount += ($nightPrice * $nights);
            }

            // 4. Création de la facture
            $invoice = Invoice::create([
                'patient_id'       => $visit->patient_id,
                'center_id'        => $visit->center_id,
                'patient_visit_id' => $visit->id,
                'total_amount'     => $totalAmount,
                'status'           => 'UNPAID', // En attente de paiement à la caisse
            ]);

            // 5. Attacher l'ID de la facture et marquer tout comme FACTURÉ (is_billed = true)
            Consultation::whereIn('id', $unbilledConsultations->pluck('id'))->update(['is_billed' => true, 'invoice_id' => $invoice->id]);
            PerformedMedicalAct::whereIn('id', $unbilledActs->pluck('id'))->update(['is_billed' => true, 'invoice_id' => $invoice->id]);
            Admission::whereIn('id', $unbilledAdmissions->pluck('id'))->update(['is_billed' => true, 'invoice_id' => $invoice->id]);

            return $invoice;
        });
    }

    /**
     * Annule une facture non payée et libère toutes les ressources associées.
     *
     * @param int $invoiceId
     * @return bool
     * @throws Exception
     */
    public function cancelInvoice(int $invoiceId)
    {
        $invoice = Invoice::findOrFail($invoiceId);

        // Sécurité critique : On n'annule jamais une facture déjà encaissée
        if ($invoice->status !== 'UNPAID') {
            throw new Exception("Sécurité comptable : Impossible d'annuler une facture qui a déjà été payée.");
        }

        return DB::transaction(function () use ($invoice) {
            
            // 1. Libérer les consultations rattachées à cette facture
            Consultation::where('invoice_id', $invoice->id)
                        ->update([
                            'is_billed' => false, 
                            'invoice_id' => null
                        ]);

            // 2. Libérer les actes médicaux pratiqués rattachés
            PerformedMedicalAct::where('invoice_id', $invoice->id)
                               ->update([
                                   'is_billed' => false, 
                                   'invoice_id' => null
                               ]);

            // 3. Libérer les séjours d'hospitalisation rattachés
            Admission::where('invoice_id', $invoice->id)
                     ->update([
                         'is_billed' => false, 
                         'invoice_id' => null
                     ]);

            // 4. Supprimer définitivement l'enregistrement de la facture proforma
            return $invoice->delete();
        });
    }
}