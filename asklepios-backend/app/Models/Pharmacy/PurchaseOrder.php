<?php

namespace App\Models\Pharmacy;

use App\Models\Hospital;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseOrder extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'hospital_id',
        'provider_id',
        'destination_pharmacy_id',
        'user_id',
        'status',
        'total_amount'
    ];

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    public function provider()
    {
        return $this->belongsTo(Provider::class);
    }

    public function destinationPharmacy()
    {
        return $this->belongsTo(PharmacyBranch::class, 'destination_pharmacy_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lines()
    {
        return $this->hasMany(PurchaseOrderLine::class, 'purchase_order_id');
    }
}