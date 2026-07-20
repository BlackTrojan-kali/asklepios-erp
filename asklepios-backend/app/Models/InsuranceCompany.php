<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InsuranceCompany extends Model
{
    use HasFactory;

    protected $table = 'insurance_companies';

    protected $fillable = [
        'hospital_id',
        'name',
        'email',
        'contact',
    ];

    /**
     * Relation avec l'hôpital
     */
    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }
    /**
     * Les couvertures de patients liées à cette assurance
     */
    public function patientCoverages()
    {
        return $this->hasMany(PatientCoverage::class);
    }
}