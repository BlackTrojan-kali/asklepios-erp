<?php

namespace App\Models\Hospital;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformedMedicalAct extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_visit_id',
        'medical_act_catalog_id',
        'equipment_id',
        'applied_price',
    ];

    protected $casts = [
        'applied_price' => 'float',
    ];

    public function patientVisit(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Hospital\PatientVisit::class);
    }

    public function medicalActCatalog(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Hospital\MedicalActCatalog::class);
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Hospital\Equipment::class);
    }
}