<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProfilePharm extends Model
{
    //
    protected $guarded = [];
    public function user(){
        return $this->belongsTo(User::class,"user_id");
    }
    public function branch()
    {
        return $this->belongsTo(\App\Models\Pharmacy\PharmacyBranch::class, 'branch_id');
    }
}
