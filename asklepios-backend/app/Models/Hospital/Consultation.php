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
        'admission_id', // 👉 AJOUT ICI
        'profile_doctor_id',
        'chief_complaint',
        'clinical_data',
        'consultation_price',
    ];

    protected $casts = [
        'clinical_data'      => 'array',
        'consultation_price' => 'float',
    ];

    public function patientVisit(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Hospital\PatientVisit::class);
    }

    // 👉 NOUVELLE RELATION
    public function admission(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Hospital\Admission::class);
    }

    public function profileDoctor(): BelongsTo
    {
        return $this->belongsTo(\App\Models\ProfileDoctor::class);
    }

    public function examRequests(): HasMany
    {
        return $this->hasMany(\App\Models\Hospital\ExamRequest::class);
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(\App\Models\Hospital\Prescription::class);
    }
    public function doctor(){
        return $this->belongsTo(\App\Models\ProfileDoctor::class,"profile_doctor_id");
    
    }
    public function bloodTransfusions(){
        return $this->hasMany(BloodTransfusion::class);
    }
}