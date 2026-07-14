<?php

namespace App\Models;

use App\Models\Pharmacy\PharmacyBranch;
use Illuminate\Database\Eloquent\Model;

class Hospital extends Model
{
    //
    protected $guarded = [];
    
    public function centers(){
        return $this->hasMany(Center::class);
    }
    public function laboratories(){
        return $this->hasMany(\App\Models\Laboratory\Laboratory::class);
    }
    public function pharmacies(){
        return $this->hasMany(PharmacyBranch::class);
    }
}
