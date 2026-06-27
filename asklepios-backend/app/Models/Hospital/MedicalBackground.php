<?php

namespace App\Models\Hospital;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicalBackground extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'patient_id',
        'blood_type',
        'allergies',
        'chronic_conditions',
        'past_surgeries',
        'current_medications',
        'immunizations',
        'family_history',
        'lifestyle_habits',
        'general_notes',
    ];

    /**
     * Les attributs qui doivent être castés (convertis).
     * Les champs JSON sont automatiquement gérés comme des tableaux PHP.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'allergies'           => 'array',
        'chronic_conditions'  => 'array',
        'past_surgeries'      => 'array',
        'current_medications' => 'array',
        'immunizations'       => 'array',
    ];

    // ======================================================
    // RELATIONS
    // ======================================================

    /**
     * Obtient le patient à qui appartient ce dossier médical.
     */
    public function patient(): BelongsTo
    {
        // Ajuste le namespace si ton modèle Patient est rangé ailleurs
        return $this->belongsTo(\App\Models\Patient::class);
    }
}