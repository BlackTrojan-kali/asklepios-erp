<?php

namespace App\Models\Hospital;

use App\Models\Patient;
use App\Models\ProfileDoctor;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Admission extends Model
{
    use HasFactory;

    protected $guarded = [];

    // Cast des dates et du booléen de facturation pour une manipulation propre avec Carbon
    protected $casts = [
        'admission_date'          => 'datetime',
        'expected_discharge_date' => 'datetime',
        'actual_discharge_date'   => 'datetime',
        'is_billed'               => 'boolean',
    ];

    /**
     * Relation avec le Patient hospitalisé
     */
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Relation avec la Visite médicale d'origine
     */
    public function patientVisit()
    {
        return $this->belongsTo(PatientVisit::class);
    }

    /**
     * Relation avec le Médecin responsable de l'hospitalisation
     */
    public function doctor()
    {
        return $this->belongsTo(ProfileDoctor::class, 'profile_doctor_id');
    }

    /**
     * Relation avec le Lit assigné
     */
    public function bed()
    {
        return $this->belongsTo(Bed::class);
    }
}