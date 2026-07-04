<?php

namespace App\Models\Pharmacy;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class PaymentTransaction extends Model
{
    protected $guarded = [];

    protected $casts = [
        'amount' => 'float',
        'confirmed_at' => 'datetime',
    ];

    public function branch()
    {
        return $this->belongsTo(PharmacyBranch::class, 'pharmacy_branch_id');
    }

    public function session()
    {
        return $this->belongsTo(CashRegisterSession::class, 'cash_register_session_id');
    }

    public function sourceAccount()
    {
        return $this->belongsTo(PaymentAccount::class, 'source_account_id');
    }

    public function destinationAccount()
    {
        return $this->belongsTo(PaymentAccount::class, 'destination_account_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function confirmedBy()
    {
        return $this->belongsTo(User::class, 'confirmed_by_id');
    }
}
