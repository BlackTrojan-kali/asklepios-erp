<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Center extends Model
{
    //
    protected $guarded = [];
    
    public function country(){
        return $this->belongsTo(Country::class,"country_id");
    }
    public function hospital(){
        return $this->belongsTo(Hospital::class,"hospital_id");
    }
}
