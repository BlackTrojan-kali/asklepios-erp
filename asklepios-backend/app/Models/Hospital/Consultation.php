<?php

namespace App\Models\Hospital;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Consultation extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_visit_id',
        'profile_doctor_id',
        'chief_complaint', // Corrigé ici
        'clinical_data',
        'consultation_price',
    ];

    protected $casts = [
        'clinical_data'      => 'array', // Transforme le JSON en array automatiquement
        'consultation_price' => 'float',
    ];

    public function patientVisit(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Hospital\PatientVisit::class);
    }

    public function profileDoctor(): BelongsTo
    {
        return $this->belongsTo(\App\Models\ProfileDoctor::class); // Ajuste le namespace si besoin
    }

    public function examRequests(): HasMany
    {
        return $this->hasMany(\App\Models\Hospital\ExamRequest::class);
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(\App\Models\Hospital\Prescription::class);
    }
}