<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;

class PosSaleItem extends Model
{
    protected $guarded = [];

    protected $casts = [
        'qty' => 'float',
        'unit_price' => 'float',
        'discount' => 'float',
        'sub_total' => 'float',
    ];

    public function sale()
    {
        return $this->belongsTo(PosSale::class, 'pos_sale_id');
    }

    public function article()
    {
        return $this->belongsTo(Article::class);
    }

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }
}
