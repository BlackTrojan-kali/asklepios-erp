<?php

namespace App\Models\Pharmacy;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class CashRegisterSession extends Model
{
    protected $guarded = [];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'opening_balance' => 'float',
        'closing_balance' => 'float',
    ];

    protected $appends = ['sales_totals'];

    public function getSalesTotalsAttribute()
    {
        return [
            'cash' => (float) $this->sales()->where('payment_method', 'CASH')->sum('total_amount'),
            'mobile_money' => (float) $this->sales()->where('payment_method', 'MOBILE_MONEY')->sum('total_amount'),
            'card' => (float) $this->sales()->where('payment_method', 'CARD')->sum('total_amount'),
        ];
    }

    public function register()
    {
        return $this->belongsTo(CashRegister::class, 'cash_register_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function sales()
    {
        return $this->hasMany(PosSale::class, 'cash_register_session_id');
    }
}
