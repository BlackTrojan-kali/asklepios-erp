<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockMovement extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'pharmacy_branch_id',
        'batch_id',
        'storage_location_id',
        'qty',
        'reference_type',
        'reference_id',
        'type',
        'qty_in_stock',
        'comment'
    ];

    public function pharmacyBranch()
    {
        return $this->belongsTo(PharmacyBranch::class);
    }

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    public function storageLocation()
    {
        return $this->belongsTo(StorageLocation::class);
    }
}