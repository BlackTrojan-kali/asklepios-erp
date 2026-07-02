<?php

namespace App\Models\Hospital;

use App\Models\Center;
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
     * Le patient à qui appartient la facture.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Le centre (clinique/succursale) qui a émis la facture.
     */
    public function center(): BelongsTo
    {
        return $this->belongsTo(Center::class);
    }

    /**
     * La visite rattachée à cette facture (optionnel).
     */
    public function patientVisit(): BelongsTo
    {
        return $this->belongsTo(PatientVisit::class);
    }

    /**
     * Les lignes de la facture (détails des frais).
     */
    public function lines(): HasMany
    {
        return $this->hasMany(InvoiceLine::class);
    }

    /**
     * Les paiements effectués pour cette facture.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(PaymentInvoice::class);
    }
    public function consultations(){
        return $this->hasMany(Consultation::class);
    }
    public function performedMedicalActs(){
        return $this->hasMany(PerformedMedicalAct::class);
    }
    public function admissions(){
        return $this->hasMany(Admission::class);
    }
}