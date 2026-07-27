<?php

namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Patient;
use App\Models\Center;
use App\Models\Hospital\Invoice;
use App\Models\Hospital\PatientVisit;
use App\Models\ProfileDoctor;

class LabRequest extends Model
{
    use HasFactory;

    protected $fillable = ['patient_id', 'laboratory_id', 'invoice_id', 'patient_visit_id', 'profile_doctor_id', 'external_prescriber_name', 'priority', 'status',"is_billed"];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function laboratory()
    {
        return $this->belongsTo(Laboratory::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function patientVisit()
    {
        return $this->belongsTo(PatientVisit::class);
    }

    public function profileDoctor()
    {
        return $this->belongsTo(ProfileDoctor::class);
    }

    public function lines()
    {
        return $this->hasMany(LabRequestLine::class);
    }

    public function samples()
    {
        return $this->hasMany(LabSample::class);
    }
}
