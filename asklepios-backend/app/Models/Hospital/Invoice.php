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
     * Cette ligne force Laravel à toujours inclure ces deux champs virtuels
     * dans tes réponses JSON (API) envoyées à ton frontend React.
     */
    protected $appends = ['total_paid', 'remaining_debt'];

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
    public function labRequests(){
        return $this->hasMany(LabRequest::class);
    }
    // ==========================================
    // ATTRIBUTS VIRTUELS (ACCESSEURS)
    // ==========================================

    /**
     * Calcule la somme totale des paiements déjà effectués pour cette facture.
     * Accessible en PHP via : $invoice->total_paid
     */
    public function getTotalPaidAttribute()
    {
        // On appelle $this->payments (sans les parenthèses) pour utiliser la collection. 
        // Cela évite de refaire une requête SQL (N+1) si la relation 'payments' a déjà été chargée via un `with('payments')`.
        return $this->payments->sum('amount');
    }

    /**
     * Calcule la dette restante (le reste à payer).
     * Accessible en PHP via : $invoice->remaining_debt
     */
    public function getRemainingDebtAttribute()
    {
        // On utilise la valeur totale moins la somme des paiements.
        // Le max(0, ...) permet de s'assurer qu'on n'a pas une dette négative en cas de trop-perçu.
        return max(0, $this->total_amount - $this->total_paid);
    }
}