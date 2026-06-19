<?php

namespace App\Models\Pharmacy;

use App\Models\Hospital;
use Illuminate\Database\Eloquent\Model;

class Vehicule extends Model
{
    protected $fillable = [
        'hospital_id',
        'licence_plate',
        'model',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }
}