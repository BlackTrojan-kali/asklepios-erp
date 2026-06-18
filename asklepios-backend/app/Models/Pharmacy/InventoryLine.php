<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;

class InventoryLine extends Model
{
    // Indiquer les champs qu'on peut remplir via create() ou update()
    protected $fillable = [
        'inventory_id',
        'pharmacy_branch_id',
        'batch_id',           // Le lot (le produit) compté
        'storage_location_id',// L'emplacement où il a été trouvé (optionnel)
        'system_qty',         // Ce que le système disait qu'on avait
        'physical_qty',       // Ce que le magasinier a vraiment compté
        'descrepency'         // L'écart (physical - system)
    ];

    /**
     * RELATIONS
     */

    // Cette ligne appartient à un inventaire parent
    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }

    // Cette ligne est liée à une succursale
    public function pharmacyBranch()
    {
        return $this->belongsTo(PharmacyBranch::class);
    }

    // Le produit compté (Le lot, qui lui-même pointe vers l'article)
    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    // L'emplacement physique où l'article a été compté
    public function storageLocation()
    {
        return $this->belongsTo(StorageLocation::class);
    }
}