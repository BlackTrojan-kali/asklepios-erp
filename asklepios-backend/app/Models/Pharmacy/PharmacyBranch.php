<?php

namespace App\Models\Pharmacy;

use App\Models\Hospital;
use Illuminate\Database\Eloquent\Model;

class PharmacyBranch extends Model
{
    //
    protected $guarded = [];
    /**
     * Une branche de pharmacie appartient à un hôpital
     */
    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }
}
