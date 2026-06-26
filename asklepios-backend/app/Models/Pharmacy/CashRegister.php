<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;

class CashRegister extends Model
{
    protected $guarded = [];

    public function branch()
    {
        return $this->belongsTo(PharmacyBranch::class, 'pharmacy_branch_id');
    }

    public function sessions()
    {
        return $this->hasMany(CashRegisterSession::class, 'cash_register_id');
    }
}
