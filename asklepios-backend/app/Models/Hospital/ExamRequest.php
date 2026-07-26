<?php

namespace App\Models\Hospital;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamRequest extends Model
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
    /**
     * Obtient toutes les lignes (les examens individuels) de cette demande.
     */
    public function examRequestLines(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(\App\Models\Hospital\ExamRequestLine::class);
    }
}