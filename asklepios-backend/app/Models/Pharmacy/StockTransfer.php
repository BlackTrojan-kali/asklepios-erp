<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;

class StockTransfer extends Model
{
    // Obligatoire pour contrer la faute de frappe de la migration
    protected $table = 'stock_tranfers';
    protected $guarded = [];

    public function lines() { return $this->hasMany(StockTransferLine::class); }
    public function sourcePharmacy() { return $this->belongsTo(PharmacyBranch::class, 'source_pharmacy_id'); }
    public function destinationPharmacy() { return $this->belongsTo(PharmacyBranch::class, 'destination_pharmacy_id'); }
    public function driver() { return $this->belongsTo(Driver::class); }
    public function vehicule() { return $this->belongsTo(Vehicule::class); }
}