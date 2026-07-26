<?php

namespace App\Models;

use App\Models\Hospital\FacilityRoom;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $guarded = [];
    
    /**
     * Obtenir le centre auquel appartient ce département
     */
    public function center()
    {
        // ✅ Remplacement de hasOne par belongsTo
        return $this->belongsTo(Center::class);
    }
    
    /**
     * Les salles/installations de ce département
     */
    public function facilityRooms()
    {
        return $this->hasMany(FacilityRoom::class, 'department_id');
    }
}