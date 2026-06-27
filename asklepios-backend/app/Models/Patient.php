<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Les attributs qui peuvent être assignés en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'hospital_id',
        'patient_code',
        'first_name',
        'last_name',
        'bith_date', // Typo conservée pour correspondre à la migration
        'contact_phone',
        'birth_place',
        'address',
        'emergency_contact_name',
        'emergency_contact_number',
        'gender',
    ];

    /**
     * Les attributs qui doivent être castés.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'bith_date' => 'date',
    ];

    /**
     * Obtenir l'hôpital auquel appartient le patient.
     */
    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }
}