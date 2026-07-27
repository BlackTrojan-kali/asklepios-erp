<?php

namespace App\Http\Services;

use App\Models\Hospital\Invoice;
use App\Models\Hospital\InvoiceSplit;
use App\Models\Hospital\Consultation;
use App\Models\Hospital\Admission;
use App\Models\Hospital\PerformedMedicalAct;
use App\Models\Hospital\PatientVisit;
use App\Models\Laboratory\LabRequest;
use App\Models\Patient;
use App\Models\PatientCoverage;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Exception;

class InvoiceService
{
    /**
     * Lie automatiquement les soins (Hors Labo) à une facture globale.
     */
    public function linkUnbilledItemsToInvoice(Invoice $invoice, float $consultationPrice = 0.0)
    {
        $patientId = $invoice->patient_id;

        $unbilledConsultations = Consultation::whereHas('patientVisit', fn($q) => $q->where('patient_id', $patientId))
            ->where('is_billed', false)->whereNull('invoice_id')->get();
        
        foreach ($unbilledConsultations as $index => $consultation) {
            // 👉 Seule la PREMIÈRE consultation prend le prix pour correspondre au total affiché par votre frontend
            $appliedPrice = ($index === 0 && $consultationPrice > 0) ? (float)$consultationPrice : (float)($consultation->consultation_price ?? 0.0);
            
            // 👉 CORRECTION MAJEURE : On assigne les valeurs manuellement pour contourner le blocage du `$fillable`
            $consultation->is_billed = true;
            $consultation->invoice_id = $invoice->id;
            $consultation->consultation_price = $appliedPrice;
            $consultation->save();
        }

        $unbilledActs = PerformedMedicalAct::whereHas('patientVisit', fn($q) => $q->where('patient_id', $patientId))
            ->where('is_billed', false)->whereNull('invoice_id')->get();
        PerformedMedicalAct::whereIn('id', $unbilledActs->pluck('id'))->update(['is_billed' => true, 'invoice_id' => $invoice->id]);

        $unbilledAdmissions = Admission::where('patient_id', $patientId)
            ->where('is_billed', false)->whereNull('invoice_id')->get();
        Admission::whereIn('id', $unbilledAdmissions->pluck('id'))->update(['is_billed' => true, 'invoice_id' => $invoice->id]);
    }

    /**
     * Même chose mais restreint à une seule visite (Hors Labo).
     */
    public function linkUnbilledItemsToInvoiceForVisit(Invoice $invoice, int $visitId, float $consultationPrice = 0.0)
    {
        $unbilledConsultations = Consultation::where('patient_visit_id', $visitId)
            ->where('is_billed', false)->whereNull('invoice_id')->get();
        
        foreach ($unbilledConsultations as $index => $consultation) {
            $appliedPrice = ($index === 0 && $consultationPrice > 0) ? (float)$consultationPrice : (float)($consultation->consultation_price ?? 0.0);
            
            $consultation->is_billed = true;
            $consultation->invoice_id = $invoice->id;
            $consultation->consultation_price = $appliedPrice;
            $consultation->save();
        }

        $unbilledActs = PerformedMedicalAct::where('patient_visit_id', $visitId)
            ->where('is_billed', false)->whereNull('invoice_id')->get();
        PerformedMedicalAct::whereIn('id', $unbilledActs->pluck('id'))->update(['is_billed' => true, 'invoice_id' => $invoice->id]);

        $unbilledAdmissions = Admission::where('patient_visit_id', $visitId)
            ->where('is_billed', false)->whereNull('invoice_id')->get();
        Admission::whereIn('id', $unbilledAdmissions->pluck('id'))->update(['is_billed' => true, 'invoice_id' => $invoice->id]);
    }

    public function recalculateSplits(int $invoiceId)
    {
        $invoice = Invoice::with([
            'consultations', 
            'performedMedicalActs', 
            'admissions.bed.facilityRoom.category', 
            'labRequests.lines.test' 
        ])->findOrFail($invoiceId);

        InvoiceSplit::where('invoice_id', $invoice->id)->delete();

        $sumConsultations = $invoice->consultations->sum('consultation_price');
        $sumActs = $invoice->performedMedicalActs->sum('applied_price');
        
        $sumAdmissions = 0.0;
        foreach ($invoice->admissions as $admission) {
            $nightPrice = $admission->bed->facilityRoom->category->price_per_night ?? 0;
            $startDate = Carbon::parse($admission->admission_date);
            $endDate = $admission->actual_discharge_date ? Carbon::parse($admission->actual_discharge_date) : now();
            $nights = max(1, $startDate->diffInDays($endDate));
            $sumAdmissions += ($nightPrice * $nights);
        }

        $sumLabs = 0;
        foreach ($invoice->labRequests as $labReq) {
            foreach ($labReq->lines as $line) {
                $sumLabs += $line->test->price ?? 0;
            }
        }

        $totalLinked = $sumConsultations + $sumActs + $sumAdmissions + $sumLabs;
        
        $unlinkedAmount = max(0, $invoice->total_amount - $totalLinked);

        $this->applyCoverageAndCreateSplits($invoice, $invoice->patient_id, [
            'consultation' => $sumConsultations + $unlinkedAmount, 
            'act'          => $sumActs,
            'admission'    => $sumAdmissions,
            'lab'          => $sumLabs,
        ]);
        
        if ($invoice->total_amount == 0 && $totalLinked > 0) {
            $invoice->update(['total_amount' => $totalLinked]);
        }

        Consultation::where('invoice_id', $invoice->id)->update(['is_billed' => true]);
        PerformedMedicalAct::where('invoice_id', $invoice->id)->update(['is_billed' => true]);
        Admission::where('invoice_id', $invoice->id)->update(['is_billed' => true]);
        LabRequest::where('invoice_id', $invoice->id)->update(['is_billed' => true]);
    }

    public function generateInvoiceForPatient(int $patientId, ?float $consultationPrice = 0.0, ?int $centerId = null)
    {
        $patient = Patient::findOrFail($patientId);
        $consultationPrice = $consultationPrice ?? 0.0;

        return DB::transaction(function () use ($patient, $consultationPrice, $centerId) {
            
            $invoice = Invoice::create([
                'patient_id'       => $patient->id,
                'center_id'        => $centerId,
                'total_amount'     => 0,
                'status'           => 'UNPAID',
            ]);

            $this->linkUnbilledItemsToInvoice($invoice, $consultationPrice);
            $this->recalculateSplits($invoice->id);

            return $invoice;
        });
    }

    public function generateInvoiceForVisit(int $visitId, ?float $consultationPrice = 0.0)
    {
        $visit = PatientVisit::findOrFail($visitId);
        $consultationPrice = $consultationPrice ?? 0.0;

        return DB::transaction(function () use ($visit, $consultationPrice) {
            $invoice = Invoice::create([
                'patient_id'       => $visit->patient_id,
                'center_id'        => $visit->center_id,
                'patient_visit_id' => $visit->id,
                'total_amount'     => 0,
                'status'           => 'UNPAID',
            ]);

            $this->linkUnbilledItemsToInvoiceForVisit($invoice, $visit->id, $consultationPrice);
            $this->recalculateSplits($invoice->id);

            return $invoice;
        });
    }

    public function cancelInvoice(int $invoiceId)
    {
        $invoice = Invoice::with(['splits', 'payments'])->findOrFail($invoiceId);

        if ($invoice->status === 'PAID') {
            throw new Exception("Sécurité comptable : Impossible d'annuler une facture qui a déjà été totalement payée.");
        }

        if ($invoice->payments && $invoice->payments->count() > 0) {
            throw new Exception("Sécurité comptable : Impossible d'annuler cette facture car elle contient déjà des encaissements. Veuillez annuler les paiements d'abord.");
        }

        if ($invoice->splits) {
            foreach ($invoice->splits as $split) {
                if ($split->status === 'PAID') {
                    throw new Exception("Sécurité comptable : Impossible d'annuler cette facture car la part " . ($split->type === 'INSURANCE' ? 'Assurance' : 'Patient') . " a déjà été réglée.");
                }
            }
        }

        return DB::transaction(function () use ($invoice) {
            // Requête SQL directe : elle n'est pas bloquée par le $fillable
            Consultation::where('invoice_id', $invoice->id)->update(['is_billed' => false, 'invoice_id' => null, 'consultation_price' => 0.0]);
            PerformedMedicalAct::where('invoice_id', $invoice->id)->update(['is_billed' => false, 'invoice_id' => null]);
            Admission::where('invoice_id', $invoice->id)->update(['is_billed' => false, 'invoice_id' => null]);
            
            LabRequest::where('invoice_id', $invoice->id)->update([
                'is_billed'  => false, 
                'invoice_id' => null, 
                'status'     => 'PENDING_PAYMENT'
            ]);

            return $invoice->delete();
        });
    }

    /**
     * =========================================================================
     * LOGIQUE DE TIERS PAYANT (RÉPARTITION ASSURANCE / PATIENT)
     * =========================================================================
     */
    private function applyCoverageAndCreateSplits(Invoice $invoice, int $patientId, array $totalsByScope)
    {
        $coverages = PatientCoverage::where('patient_id', $patientId)
            ->where('is_active', true)
            ->whereDate('valid_until', '>=', now())
            ->orderBy('priority_order', 'asc')
            ->get();

        $patientPart = array_sum($totalsByScope);

        $scopeMapping = [
            'consultation' => 'consultation',
            'act'          => 'consultation',
            'admission'    => 'consultation',
            'lab'          => 'lab',
            'pharmacy'     => 'pharmacy',
        ];

        foreach ($coverages as $coverage) {
            $rawScope = $coverage->coverage_scope;
            if (is_string($rawScope)) {
                $decoded = json_decode($rawScope, true);
                $scopes = is_string($decoded) ? json_decode($decoded, true) : $decoded;
            } else {
                $scopes = $rawScope;
            }
            $scopes = is_array($scopes) ? $scopes : [];
            $scopes = array_map('strtolower', array_map('trim', $scopes));

            $insuranceAmount = 0.0;

            foreach ($totalsByScope as $billingCategory => $amount) {
                $requiredScope = strtolower($scopeMapping[$billingCategory] ?? $billingCategory);

                if ($amount > 0 && in_array($requiredScope, $scopes)) {
                    $coveredAmount = $amount * ($coverage->coverage_rate / 100);
                    $insuranceAmount += $coveredAmount;
                    $totalsByScope[$billingCategory] -= $coveredAmount;
                }
            }

            if ($insuranceAmount > 0) {
                $patientPart -= $insuranceAmount;
                InvoiceSplit::create([
                    'invoice_id'    => $invoice->id,
                    'type'          => 'INSURANCE',
                    'amount_to_pay' => round($insuranceAmount, 2),
                    'status'        => 'UNPAID',
                ]);
            }
        }

        InvoiceSplit::create([
            'invoice_id'    => $invoice->id,
            'type'          => 'PATIENT',
            'amount_to_pay' => max(0, round($patientPart, 2)),
            'status'        => 'UNPAID',
        ]);
    }
}