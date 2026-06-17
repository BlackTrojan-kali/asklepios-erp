<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrderLine extends Model
{
    protected $fillable = [
        'purchase_order_id',
        'article_id',
        'qty_ordered',
        'qty_received',
        'unit_cost'
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }

    public function article()
    {
        return $this->belongsTo(Article::class);
    }
}