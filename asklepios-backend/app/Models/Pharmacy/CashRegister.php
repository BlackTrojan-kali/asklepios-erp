<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;

class CashRegister extends Model
{
    protected $guarded = [];

    protected $appends = ['balance'];

    public function branch()
    {
        return $this->belongsTo(PharmacyBranch::class, 'pharmacy_branch_id');
    }

    public function sessions()
    {
        return $this->hasMany(CashRegisterSession::class, 'cash_register_id');
    }

    public function activeSession()
    {
        return $this->hasOne(CashRegisterSession::class, 'cash_register_id')->whereNull('closed_at');
    }

    public function getBalanceAttribute()
    {
        $activeSession = $this->activeSession;
        if (!$activeSession) {
            return 0.0;
        }
        return (float) ($activeSession->opening_balance + $activeSession->sales()->sum('total_amount'));
    }
}

