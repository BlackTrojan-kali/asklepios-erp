<?php


namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;

class Stock extends Model
{
    //
    protected $guarded = [];
    public function branch(){
        return $this->belongsTo(PharmacyBranch::class,"pharmacy_branch_id");
    }
    public function batch(){
        return $this->belongsTo(Batch::class);
    }
}
