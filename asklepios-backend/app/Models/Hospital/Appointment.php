<?php

namespace App\Models\Hospital;

use App\Models\Center;
use App\Models\Patient;
use App\Models\ProfileDoctor; // Ajuste si ton modèle s'appelle autrement
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'scheduled_datetime' => 'datetime',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(ProfileDoctor::class, 'profile_doctor_id');
    }

    public function center()
    {
        return $this->belongsTo(Center::class);
    }

    public function visit()
    {
        return $this->hasOne(PatientVisit::class);
    }
}