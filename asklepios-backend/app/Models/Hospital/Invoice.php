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
     * On ajoute les parts patient et assurance, ainsi que le type,
     * pour qu'ils soient automatiquement calculés et envoyés au frontend React.
     */
    protected $appends = ['total_paid', 'remaining_debt', 'type', 'patient_part', 'insurance_part'];

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

    public function consultations(): HasMany {
        return $this->hasMany(Consultation::class);
    }

    public function performedMedicalActs(): HasMany {
        return $this->hasMany(PerformedMedicalAct::class);
    }

    public function admissions(): HasMany {
        return $this->hasMany(Admission::class);
    }
    
    public function labRequests(): HasMany {
        return $this->hasMany(LabRequest::class);
    }

    /**
     * NOUVELLE RELATION : Les divisions de paiement de cette facture (Tiers Payant)
     */
    public function splits(): HasMany {
        return $this->hasMany(InvoiceSplit::class);
    }

    /**
     * Alias de la relation pour maintenir la compatibilité avec le reste de l'application
     */
    public function invoiceSplits(): HasMany {
        return $this->hasMany(InvoiceSplit::class);
    }

    // ==========================================
    // ATTRIBUTS VIRTUELS (ACCESSEURS)
    // ==========================================

    /**
     * Détermine le type de la facture (LABORATORY ou CONSULTATION)
     */
    public function getTypeAttribute()
    {
        if ($this->relationLoaded('labRequests')) {
            return $this->labRequests->count() > 0 ? 'LABORATORY' : 'CONSULTATION';
        }
        return LabRequest::where('invoice_id', $this->id)->exists() ? 'LABORATORY' : 'CONSULTATION';
    }

    /**
     * Calcule la somme totale des paiements déjà effectués pour cette facture.
     * Accessible en PHP via : $invoice->total_paid
     */
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