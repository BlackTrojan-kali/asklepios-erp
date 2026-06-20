<?php

namespace App\Models\Pharmacy;

use App\Models\Center;
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
    public function center()
    {
        return $this->belongsTo(Center::class);
    }
    // Dans app/Models/Pharmacy/PharmacyBranch.php

    public function inventories()
    {
        return $this->hasMany(Inventory::class);
    }
    public function country()
{
    return $this->belongsTo(\App\Models\Country::class);
}
}
