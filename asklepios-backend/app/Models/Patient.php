<?php

namespace App\Models;

use App\Models\Hospital\MedicalBackground;
use App\Models\Hospital\PatientVisit;
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
        // À ajouter dans app/Models/Patient.php
    public function medicalBackground()
    {
        return $this->hasOne(MedicalBackground::class);
    }
    public function patientVisits(){
        return $this->hasMany(PatientVisit::class);
    }
    public function admissions()
{
    return $this->hasMany(\App\Models\Hospital\Admission::class);
}

public function currentAdmission()
{
    // Permet de récupérer rapidement l'hospitalisation en cours du patient
    return $this->hasOne(\App\Models\Hospital\Admission::class)->where('status', 'ADMITTED');
}
}