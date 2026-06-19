<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;

class StockTransferLine extends Model
{
    // Obligatoire pour contrer la faute de frappe
    protected $table = 'stock_tranfer_lines';
    protected $guarded = [];

    public function transfer() { return $this->belongsTo(StockTransfer::class); }
    public function batch() { return $this->belongsTo(Batch::class); }
}