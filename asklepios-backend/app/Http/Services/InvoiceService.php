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
     * Génère une facture (UNPAID) regroupant tous les actes non facturés d'une visite.
     * * @param int $visitId L'ID de la visite du patient
     * @param float|null $consultationPrice Le prix appliqué à la consultation
     * @return Invoice
     */

    public function generateInvoiceForPatient(int $patientId, ?float $consultationPrice = 0.0)
    {
        $patient = Patient::findOrFail($patientId);

        return DB::transaction(function () use ($patient, $consultationPrice) {
            
            $unbilledConsultations = Consultation::whereHas('patientVisit', fn($q) => $q->where('patient_id', $patient->id))->where('is_billed', false)->get();
            $unbilledActs = PerformedMedicalAct::whereHas('visit', fn($q) => $q->where('patient_id', $patient->id))->where('is_billed', false)->get();
            $unbilledAdmissions = Admission::where('patient_id', $patient->id)->where('is_billed', false)->get();
            if ($unbilledConsultations->isEmpty() && $unbilledActs->isEmpty() && $unbilledAdmissions->isEmpty()) {
                throw new Exception("Ce patient n'a aucun soin en attente de facturation.");
            }

            $totalAmount = 0.0;

            foreach ($unbilledConsultations as $consultation) {
                $consultation->consultation_price = $consultationPrice;
                $consultation->save();
                $totalAmount += $consultationPrice;
            }

            foreach ($unbilledActs as $act) { $totalAmount += $act->applied_price; }

           // Calculer les frais de séjour (Hospitalisations)
            foreach ($unbilledAdmissions as $admission) {
                $room = $admission->bed->facilityRoom;
                
                // 👉 CORRECTION ICI : price_per_night au lieu de base_price
                $nightPrice = $room && $room->category ? $room->category->price_per_night : 0;
                
                $startDate = \Carbon\Carbon::parse($admission->admission_date);
                $endDate = $admission->actual_discharge_date ? \Carbon\Carbon::parse($admission->actual_discharge_date) : now();
                
                $nights = max(1, $startDate->diffInDays($endDate));
                $totalAmount += ($nightPrice * $nights);
            }

            // On utilise le premier centre trouvé dans les visites du patient (ou celui de l'admin)
            $lastVisit = PatientVisit::where('patient_id', $patient->id)->latest('id')->first();
            $invoice = Invoice::create([
                'patient_id'       => $patient->id,
                'center_id'        => $lastVisit ? $lastVisit->center_id : auth()->user()->profile_admin->hospital_id,
                'patient_visit_id' => $lastVisit ? $lastVisit->id : null,
                'total_amount'     => $totalAmount,
                'status'           => 'UNPAID',
            ]);

            Consultation::whereIn('id', $unbilledConsultations->pluck('id'))->update(['is_billed' => true, 'invoice_id' => $invoice->id]);
            PerformedMedicalAct::whereIn('id', $unbilledActs->pluck('id'))->update(['is_billed' => true, 'invoice_id' => $invoice->id]);
            Admission::whereIn('id', $unbilledAdmissions->pluck('id'))->update(['is_billed' => true, 'invoice_id' => $invoice->id]);

            return $invoice;
        });
    }
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

            // 3.a Calculer les consultations (avec le prix fourni par le docteur)
            foreach ($unbilledConsultations as $consultation) {
                // On met à jour le prix de la consultation en base avec celui saisi
                $consultation->consultation_price = $consultationPrice;
                $consultation->save();
                $totalAmount += $consultationPrice;
            }

            // 3.b Calculer les actes médicaux
            foreach ($unbilledActs as $act) {
                $totalAmount += $act->applied_price;
            }

            // 3.c Calculer les admissions (Ex: Nuits d'hospitalisation)
            foreach ($unbilledAdmissions as $admission) {
                // On utilise le prix de base de la catégorie de la chambre
                $room = $admission->bed->facilityRoom;
                $nightPrice = $room && $room->category ? $room->category->base_price : 0;
                
                // Calcul du nombre de nuits (Minimum 1)
                $startDate = \Carbon\Carbon::parse($admission->admission_date);
                $endDate = $admission->actual_discharge_date 
                            ? \Carbon\Carbon::parse($admission->actual_discharge_date) 
                            : now();
                            
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
            Consultation::whereIn('id', $unbilledConsultations->pluck('id'))
                        ->update(['is_billed' => true, 'invoice_id' => $invoice->id]);

            PerformedMedicalAct::whereIn('id', $unbilledActs->pluck('id'))
                               ->update(['is_billed' => true, 'invoice_id' => $invoice->id]);

            Admission::whereIn('id', $unbilledAdmissions->pluck('id'))
                     ->update(['is_billed' => true, 'invoice_id' => $invoice->id]);

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