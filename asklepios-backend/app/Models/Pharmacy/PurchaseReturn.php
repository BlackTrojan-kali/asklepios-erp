<?php

namespace App\Models\Pharmacy;

use App\Models\Hospital;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseReturn extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'hospital_id',
        'provider_id',
        'source_pharmacy_id',
        'purchase_order_id',
        'return_date',
        'status'
    ];

    protected $casts = [
        'return_date' => 'date',
    ];

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    public function provider()
    {
        return $this->belongsTo(Provider::class);
    }

    public function sourcePharmacy()
    {
        return $this->belongsTo(PharmacyBranch::class, 'source_pharmacy_id');
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }

    public function lines()
    {
        return $this->hasMany(PurchaseReturnLine::class, 'purchase_return_id');
    }
}