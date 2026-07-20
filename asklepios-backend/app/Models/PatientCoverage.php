<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PatientCoverage extends Model
{
    use HasFactory;

    protected $table = 'patient_coverages';

    protected $fillable = [
        'patient_id',
        'insurance_company_id',
        'valid_until',
        'is_active',
        'policy_number',
        'coverage_rate',
        'priority_order', // <-- NOUVEAU CHAMP
    ];

    protected $casts = [
        'valid_until' => 'date',
        'is_active' => 'boolean',
        'coverage_rate' => 'float',
        'priority_order' => 'integer', // <-- NOUVEAU CHAMP
    ];

    /**
     * Relation avec le patient
     */
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Relation avec la compagnie d'assurance
     */
    public function insuranceCompany()
    {
        return $this->belongsTo(InsuranceCompany::class);
    }
}