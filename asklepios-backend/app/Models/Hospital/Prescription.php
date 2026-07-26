<?php

namespace App\Models\Hospital;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prescription extends Model
{
    use HasFactory;

    protected $fillable = [
        'consultation_id',
        'status',
    ];

    public function consultation(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Hospital\Consultation::class);
    }

    public function prescriptionLines(): HasMany
    {
        return $this->hasMany(\App\Models\Hospital\PrescriptionLine::class);
    }
}