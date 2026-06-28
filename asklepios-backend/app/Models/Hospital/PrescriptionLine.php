<?php

namespace App\Models\Hospital;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrescriptionLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'prescription_id',
        'article_id',
        'custom_medication_name',
        'dosage',
    ];

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Hospital\Prescription::class);
    }

    public function article(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Pharmacy\Article::class); // Ajuste le namespace selon ton module pharmacie
    }
}