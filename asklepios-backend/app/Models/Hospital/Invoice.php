<?php

namespace App\Models\Hospital;

use App\Models\Center;
use App\Models\Laboratory\LabRequest;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'center_id',
        'patient_visit_id',
        'total_amount',
        'status', // 'UNPAID', 'PAID'
    ];

    /**
     * 👉 AJOUT TRÈS UTILE : 
     * On ajoute les parts patient et assurance pour qu'elles soient
     * automatiquement calculées et envoyées au frontend React.
     */
    protected $appends = ['total_paid', 'remaining_debt', 'patient_part', 'insurance_part'];

    // ==========================================
    // RELATIONS
    // ==========================================

    public function patient(): BelongsTo {
        return $this->belongsTo(Patient::class);
    }

    public function center(): BelongsTo {
        return $this->belongsTo(Center::class);
    }

    public function patientVisit(): BelongsTo {
        return $this->belongsTo(PatientVisit::class);
    }

    public function lines(): HasMany {
        return $this->hasMany(InvoiceLine::class);
    }

    public function payments(): HasMany {
        return $this->hasMany(PaymentInvoice::class);
    }

    public function consultations() {
        return $this->hasMany(Consultation::class);
    }

    public function performedMedicalActs() {
        return $this->hasMany(PerformedMedicalAct::class);
    }

    public function admissions() {
        return $this->hasMany(Admission::class);
    }
    
    public function labRequests() {
        return $this->hasMany(LabRequest::class);
    }

    /**
     * NOUVELLE RELATION : Les divisions de paiement de cette facture
     */
    public function splits(): HasMany {
        return $this->hasMany(InvoiceSplit::class);
    }

    // ==========================================
    // ATTRIBUTS VIRTUELS (ACCESSEURS)
    // ==========================================

    public function getTotalPaidAttribute()
    {
        return $this->payments->sum('amount');
    }

    public function getRemainingDebtAttribute()
    {
        return max(0, $this->total_amount - $this->total_paid);
    }

    /**
     * Calcule la somme exacte que le patient doit payer de sa poche.
     * Accessible via : $invoice->patient_part
     */
    public function getPatientPartAttribute()
    {
        // Si aucune division n'existe, on suppose par défaut que le patient paie tout
        if ($this->splits->isEmpty()) {
            return (float) $this->total_amount;
        }

        return $this->splits->where('type', 'PATIENT')->sum('amount_to_pay');
    }

    /**
     * Calcule la somme prise en charge par la ou les assurance(s).
     * Accessible via : $invoice->insurance_part
     */
    public function getInsurancePartAttribute()
    {
        return $this->splits->where('type', 'INSURANCE')->sum('amount_to_pay');
    }
}