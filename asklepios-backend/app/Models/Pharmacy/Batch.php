<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;

class Batch extends Model
{
    //
    protected $guarded = [];

    // Optionnel : s'assurer que les dates et nombres soient bien castés
    protected $casts = [
        'expire_date' => 'date',
        'purchase_price' => 'float',
    ];

    /**
     * Un lot appartient à un article spécifique.
     */
    public function article()
    {
        return $this->belongsTo(Article::class);
    }

    /**
     * Un lot peut avoir des stocks dans différentes succursales.
     */
    public function stocks()
    {
        return $this->hasMany(Stock::class, 'batch_id');
    }
}
