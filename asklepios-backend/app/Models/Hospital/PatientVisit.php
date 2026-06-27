<?php

namespace App\Models\Hospital;

use App\Models\Center;
use App\Models\Patient;
use App\Models\ProfileReception; // Ajuste selon ton modèle
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PatientVisit extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'arrival_time' => 'datetime',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function center()
    {
        return $this->belongsTo(Center::class);
    }

    public function receptionist()
    {
        return $this->belongsTo(ProfileReception::class, 'profile_reception_id');
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function waitingRoom()
    {
        return $this->belongsTo(FacilityRoom::class, 'waiting_room_id');
    }

    public function consultingRoom()
    {
        return $this->belongsTo(FacilityRoom::class, 'consulting_room_id');
    }
    
}