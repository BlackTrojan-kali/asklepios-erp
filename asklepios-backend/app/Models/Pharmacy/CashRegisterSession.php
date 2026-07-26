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
        'closing_mobile_money' => 'float',
        'closing_card' => 'float',
    ];

    protected $appends = ['sales_totals', 'treasury_totals', 'current_balance'];

    public function getCurrentBalanceAttribute()
    {
        if ($this->closed_at !== null) {
            return (float) ($this->closing_balance ?? 0.0);
        }
        $cashSales = (float) $this->sales()->where('payment_method', 'CASH')->sum('total_amount');
        $treasury = $this->treasury_totals;
        $cashNet = (float) ($treasury['cash']['net'] ?? 0.0);
        return (float) ($this->opening_balance + $cashSales + $cashNet);
    }

    public function getSalesTotalsAttribute()
    {
        return [
            'cash' => (float) $this->sales()->where('payment_method', 'CASH')->sum('total_amount'),
            'mobile_money' => (float) $this->sales()->where('payment_method', 'MOBILE_MONEY')->sum('total_amount'),
            'card' => (float) $this->sales()->where('payment_method', 'CARD')->sum('total_amount'),
        ];
    }

    public function getTreasuryTotalsAttribute()
    {
        $txs = $this->paymentTransactions()->where('status', '!=', 'cancelled');
        
        $cashIn = (float) (clone $txs)->where('type', 'cash_in')->where('payment_method', 'CASH')->sum('amount');
        $cashOut = (float) (clone $txs)->where('type', 'cash_out')->where('payment_method', 'CASH')->sum('amount');
        $cashTransfer = (float) (clone $txs)->where('type', 'transfer')->where('payment_method', 'CASH')->sum('amount');

        $momoIn = (float) (clone $txs)->where('type', 'cash_in')->where('payment_method', 'MOBILE_MONEY')->sum('amount');
        $momoOut = (float) (clone $txs)->where('type', 'cash_out')->where('payment_method', 'MOBILE_MONEY')->sum('amount');
        $momoTransfer = (float) (clone $txs)->where('type', 'transfer')->where('payment_method', 'MOBILE_MONEY')->sum('amount');

        $cardIn = (float) (clone $txs)->where('type', 'cash_in')->where('payment_method', 'CARD')->sum('amount');
        $cardOut = (float) (clone $txs)->where('type', 'cash_out')->where('payment_method', 'CARD')->sum('amount');
        $cardTransfer = (float) (clone $txs)->where('type', 'transfer')->where('payment_method', 'CARD')->sum('amount');

        return [
            'cash' => [
                'in' => $cashIn,
                'out' => $cashOut,
                'transfer' => $cashTransfer,
                'net' => $cashIn - $cashOut - $cashTransfer
            ],
            'mobile_money' => [
                'in' => $momoIn,
                'out' => $momoOut,
                'transfer' => $momoTransfer,
                'net' => $momoIn - $momoOut - $momoTransfer
            ],
            'card' => [
                'in' => $cardIn,
                'out' => $cardOut,
                'transfer' => $cardTransfer,
                'net' => $cardIn - $cardOut - $cardTransfer
            ]
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

    public function paymentTransactions()
    {
        return $this->hasMany(PaymentTransaction::class, 'cash_register_session_id');
    }
}
