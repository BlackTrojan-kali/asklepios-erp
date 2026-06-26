<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;

class PosSale extends Model
{
    protected $guarded = [];

    protected $casts = [
        'has_prescription' => 'boolean',
        'total_amount' => 'float',
        'amount_received' => 'float',
        'change_due' => 'float',
    ];

    public function branch()
    {
        return $this->belongsTo(PharmacyBranch::class, 'pharmacy_branch_id');
    }

    public function session()
    {
        return $this->belongsTo(CashRegisterSession::class, 'cash_register_session_id');
    }

    public function items()
    {
        return $this->hasMany(PosSaleItem::class, 'pos_sale_id');
    }
}
