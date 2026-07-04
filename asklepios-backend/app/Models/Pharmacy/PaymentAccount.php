<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;

class PaymentAccount extends Model
{
    protected $guarded = [];

    protected $casts = [
        'balance' => 'float',
    ];

    public function branch()
    {
        return $this->belongsTo(PharmacyBranch::class, 'pharmacy_branch_id');
    }

    public function outgoingTransactions()
    {
        return $this->hasMany(PaymentTransaction::class, 'source_account_id');
    }

    public function incomingTransactions()
    {
        return $this->hasMany(PaymentTransaction::class, 'destination_account_id');
    }
}
