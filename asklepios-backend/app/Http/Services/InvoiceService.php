<?php

namespace App\Http\Services;

use App\Models\Hospital\Invoice;
use App\Models\Hospital\InvoiceSplit;
use App\Models\Hospital\Consultation;
use App\Models\Hospital\Admission;
use App\Models\Hospital\PerformedMedicalAct;
use App\Models\Hospital\PatientVisit;
use App\Models\Patient;
use App\Models\PatientCoverage;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Exception;

class InvoiceService
{
    /**
     * Génère une facture (UNPAID) regroupant tous les actes non facturés d'un patient.
     * 
     * @param int $patientId L'ID du patient
     * @param float|null $consultationPrice Le prix appliqué à la consultation
     * @param int|null $centerId L'ID du centre
     * @return Invoice
     */
    public function generateInvoiceForPatient(int $patientId, ?float $consultationPrice = 0.0, ?int $centerId = null)
    {
        $patient = Patient::findOrFail($patientId);
        $consultationPrice = $consultationPrice ?? 0.0;

        return DB::transaction(function () use ($patient, $consultationPrice, $centerId) {
            
            // 1. Récupérer les éléments non facturés
            $unbilledConsultations = Consultation::where(function($query) use ($patient) {
                $query->whereHas('patientVisit', function($q) use ($patient) {
                    $q->where('patient_id', $patient->id);
                })->orWhereHas('admission', function($q) use ($patient) {
                    $q->where('patient_id', $patient->id);
                });
            })->where('is_billed', false)->whereNull('invoice_id')->get();

            $unbilledActs = PerformedMedicalAct::where(function($query) use ($patient) {
                $query->whereHas('patientVisit', function($q) use ($patient) {
                    $q->where('patient_id', $patient->id);
                })->orWhereHas('admission', function($q) use ($patient) {
                    $q->where('patient_id', $patient->id);
                });
            })->where('is_billed', false)->whereNull('invoice_id')->get();

            $unbilledAdmissions = Admission::with('bed.facilityRoom.category')
                ->where('patient_id', $patient->id)
                ->where('is_billed', false)
                ->whereNull('invoice_id')
                ->get();

            if ($unbilledConsultations->isEmpty() && $unbilledActs->isEmpty() && $unbilledAdmissions->isEmpty()) {
                throw new Exception("Ce patient n'a aucun soin en attente de facturation.");
            }

            // 2. Calcul des sous-totaux par périmètre
            $sumConsultations = 0.0;

            // --- A. Calcul des consultations
            foreach ($unbilledConsultations as $index => $consultation) {
                if ($consultationPrice !== null && (float)$consultationPrice > 0) {
                    // Si la réceptionniste applique un tarif de consultation, il s'applique à la 1ère consultation
                    $appliedPrice = ($index === 0) ? (float)$consultationPrice : 0.0;
                } else {
                    $appliedPrice = $consultation->consultation_price ?? 0.0;
                }
                $consultation->consultation_price = $appliedPrice;
                $consultation->save();
                
                $sumConsultations += $appliedPrice;
            }

            $sumActs = 0.0;
            foreach ($unbilledActs as $act) { 
                $sumActs += $act->applied_price; 
            }

            $sumAdmissions = 0.0;
            foreach ($unbilledAdmissions as $admission) {
                $room = $admission->bed->facilityRoom ?? null;
                $nightPrice = $room && $room->category ? $room->category->price_per_night : 0;
                
                $startDate = Carbon::parse($admission->admission_date);
                $endDate = $admission->actual_discharge_date ? Carbon::parse($admission->actual_discharge_date) : now();
                
                $nights = max(1, $startDate->diffInDays($endDate));
                $sumAdmissions += ($nightPrice * $nights);
            }

            // 3. Calcul du montant total
            $totalAmount = $sumConsultations + $sumActs + $sumAdmissions;

            // On utilise le centre spécifié (ex: centre de la réceptionniste) ou à défaut celui de la dernière visite
            $lastVisit = PatientVisit::where('patient_id', $patient->id)->latest('id')->first();
            $assignedCenterId = $centerId ?? ($lastVisit ? $lastVisit->center_id : null);
            
            // 4. Création de la facture principale
            $invoice = Invoice::create([
                'patient_id'       => $patient->id,
                'center_id'        => $assignedCenterId,
                'patient_visit_id' => $lastVisit ? $lastVisit->id : null,
                'total_amount'     => $totalAmount,
                'status'           => 'UNPAID',
            ]);

            // 5. Mise à jour de tous les éléments liés
            Consultation::whereIn('id', $unbilledConsultations->pluck('id'))->update(['is_billed' => true, 'invoice_id' => $invoice->id]);
            PerformedMedicalAct::whereIn('id', $unbilledActs->pluck('id'))->update(['is_billed' => true, 'invoice_id' => $invoice->id]);
            Admission::whereIn('id', $unbilledAdmissions->pluck('id'))->update(['is_billed' => true, 'invoice_id' => $invoice->id]);

            // 6. Génération des divisions (Tiers Payant vs Patient)
            $this->applyCoverageAndCreateSplits($invoice, $patient->id, [
                'consultation' => $sumConsultations,
                'act'          => $sumActs,
                'admission'    => $sumAdmissions,
            ]);

            return $invoice;
        });
    }

    /**
     * Génère une facture spécifique pour une visite unique donnée.
     */
    public function generateInvoiceForVisit(int $visitId, ?float $consultationPrice = 0.0)
    {
        $visit = PatientVisit::findOrFail($visitId);
        $consultationPrice = $consultationPrice ?? 0.0;

        return DB::transaction(function () use ($visit, $consultationPrice) {
            
            $unbilledConsultations = Consultation::where('patient_visit_id', $visit->id)
                                                 ->where('is_billed', false)->get();
            
            $unbilledActs = PerformedMedicalAct::where('patient_visit_id', $visit->id)
                                               ->where('is_billed', false)->get();
            
            // Chargement de la chambre et son prix (category)
            $unbilledAdmissions = Admission::with('bed.facilityRoom.category')
                                           ->where('patient_visit_id', $visit->id)
                                           ->where('is_billed', false)->get();

            if ($unbilledConsultations->isEmpty() && $unbilledActs->isEmpty() && $unbilledAdmissions->isEmpty()) {
                throw new Exception("Aucun élément non facturé trouvé pour cette visite.");
            }

            // 1. Calcul des sous-totaux
            $sumConsultations = 0.0;

            // 1.a Calculer les consultations
            foreach ($unbilledConsultations as $index => $consultation) {
                if ($consultationPrice !== null && (float)$consultationPrice > 0) {
                    $appliedPrice = ($index === 0) ? (float)$consultationPrice : 0.0;
                } else {
                    $appliedPrice = $consultation->consultation_price ?? 0.0;
                }
                $consultation->consultation_price = $appliedPrice;
                $consultation->save();
                
                $sumConsultations += $appliedPrice;
            }

            $sumActs = 0.0;
            foreach ($unbilledActs as $act) {
                $sumActs += $act->applied_price;
            }

            $sumAdmissions = 0.0;
            foreach ($unbilledAdmissions as $admission) {
                $room = $admission->bed->facilityRoom ?? null;
                $nightPrice = $room && $room->category ? $room->category->price_per_night : 0;
                
                $startDate = Carbon::parse($admission->admission_date);
                $endDate = $admission->actual_discharge_date ? Carbon::parse($admission->actual_discharge_date) : now();
                            
                $nights = max(1, $startDate->diffInDays($endDate));
                $sumAdmissions += ($nightPrice * $nights);
            }

            // 2. Calcul du montant total
            $totalAmount = $sumConsultations + $sumActs + $sumAdmissions;

            $invoice = Invoice::create([
                'patient_id'       => $visit->patient_id,
                'center_id'        => $visit->center_id,
                'patient_visit_id' => $visit->id,
                'total_amount'     => $totalAmount,
                'status'           => 'UNPAID',
            ]);

            Consultation::whereIn('id', $unbilledConsultations->pluck('id'))->update(['is_billed' => true, 'invoice_id' => $invoice->id]);
            PerformedMedicalAct::whereIn('id', $unbilledActs->pluck('id'))->update(['is_billed' => true, 'invoice_id' => $invoice->id]);
            Admission::whereIn('id', $unbilledAdmissions->pluck('id'))->update(['is_billed' => true, 'invoice_id' => $invoice->id]);

            // Génération des divisions (Tiers Payant vs Patient)
            $this->applyCoverageAndCreateSplits($invoice, $visit->patient_id, [
                'consultation' => $sumConsultations,
                'act'          => $sumActs,
                'admission'    => $sumAdmissions,
            ]);

            return $invoice;
        });
    }

    /**
     * Annule une facture non payée et libère toutes les ressources associées.
     */
    public function cancelInvoice(int $invoiceId)
    {
        $invoice = Invoice::findOrFail($invoiceId);

        if ($invoice->status !== 'UNPAID') {
            throw new Exception("Sécurité comptable : Impossible d'annuler une facture qui a déjà été payée.");
        }

        return DB::transaction(function () use ($invoice) {
            
            // 1. Libérer les consultations rattachées à cette facture et réinitialiser le prix temporaire
            Consultation::where('invoice_id', $invoice->id)
                        ->update([
                            'is_billed' => false, 
                            'invoice_id' => null,
                            'consultation_price' => 0.0
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
            // La suppression de l'invoice supprimera automatiquement les InvoiceSplits 
            // grâce au 'onDelete("cascade")' configuré dans votre migration.
            return $invoice->delete();
        });
    }

    /**
     * =========================================================================
     * MÉTHODES PRIVÉES (LOGIQUE MÉTIER INTERNE)
     * =========================================================================
     */

    /**
     * Répartit le montant de la facture entre le patient et ses assurances.
     * Prend en compte la validité, l'activation, l'ordre de priorité et le périmètre.
     */
    private function applyCoverageAndCreateSplits(Invoice $invoice, int $patientId, array $totalsByScope)
    {
        // 1. Récupérer les assurances actives et valides du patient
        $coverages = PatientCoverage::where('patient_id', $patientId)
            ->where('is_active', true)
            ->whereDate('valid_until', '>=', now())
            ->orderBy('priority_order', 'asc')
            ->get();

        $patientPart = array_sum($totalsByScope); // Au départ, le patient paie tout

        // Mapping des catégories de facture vers les périmètres de l'assurance
        // Tout ce qui est "consultation", "act", ou "admission" est couvert par le périmètre "consultation" (Bloc Hôpital)
        $scopeMapping = [
            'consultation' => 'consultation',
            'act'          => 'consultation',
            'admission'    => 'consultation',
            'lab'          => 'lab',
            'pharmacy'     => 'pharmacy',
        ];

        // 2. Calculer la part de chaque assurance
        foreach ($coverages as $coverage) {
            $scopes = $coverage->coverage_scope ?? [];
            $insuranceAmount = 0.0;

            foreach ($totalsByScope as $billingCategory => $amount) {
                // On identifie de quel périmètre d'assurance relève cette catégorie de facturation
                $requiredScope = $scopeMapping[$billingCategory] ?? $billingCategory;

                // Si l'assurance couvre ce périmètre général et qu'il reste un montant à couvrir
                if ($amount > 0 && in_array($requiredScope, $scopes)) {
                    // Calcul du montant pris en charge
                    $coveredAmount = $amount * ($coverage->coverage_rate / 100);
                    $insuranceAmount += $coveredAmount;
                    
                    // On réduit le reste à charge pour les éventuelles assurances secondaires
                    $totalsByScope[$billingCategory] -= $coveredAmount;
                }
            }

            // S'il y a un montant pris en charge, on crée le Split ASSURANCE
            if ($insuranceAmount > 0) {
                $patientPart -= $insuranceAmount; // On déduit ce montant de la part patient
                
                InvoiceSplit::create([
                    'invoice_id' => $invoice->id,
                    'type' => 'INSURANCE',
                    'amount_to_pay' => round($insuranceAmount, 2),
                    'status' => 'UNPAID',
                ]);
            }
        }

        // 3. Créer le Split PATIENT (Le Reste à charge final)
        InvoiceSplit::create([
            'invoice_id' => $invoice->id,
            'type' => 'PATIENT',
            'amount_to_pay' => max(0, round($patientPart, 2)),
            'status' => 'UNPAID',
        ]);
    }
}