<?php

namespace App\Models\Pharmacy;

use App\Models\Hospital;
use Illuminate\Database\Eloquent\Model;

class Provider extends Model
{
    protected $fillable = [
        'hospital_id',
        'name',
        'phone',
        'address',
        'niu'
    ];

    /**
     * Relation avec l'hôpital
     */
    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }
}