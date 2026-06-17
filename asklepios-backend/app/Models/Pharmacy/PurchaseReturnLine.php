<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;

class PurchaseReturnLine extends Model
{
    protected $guarded = [
    ];

    public function purchaseReturn()
    {
        return $this->belongsTo(PurchaseReturn::class, 'purchase_return_id');
    }

    public function pharmacyBranch()
    {
        return $this->belongsTo(PharmacyBranch::class);
    }
    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }
}