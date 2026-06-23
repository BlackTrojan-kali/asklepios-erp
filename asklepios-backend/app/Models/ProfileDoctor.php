<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfileDoctor extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'center_id',
        'hospital_id',
        'department_id',
        'speciality',
        'specifications',
    ];

    /**
     * Les informations du compte utilisateur
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Le centre médical auquel il est rattaché
     */
    public function center(): BelongsTo
    {
        return $this->belongsTo(Center::class);
    }

    /**
     * L'hôpital global
     */
    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }

    /**
     * Le département spécifique (Optionnel)
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}