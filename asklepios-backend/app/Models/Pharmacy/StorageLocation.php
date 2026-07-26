<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;

class StorageLocation extends Model
{
    protected $fillable = [
        'pharmacy_branch_id',
        'aisle',
        'shelf',
        'code'
    ];

    /**
     * L'emplacement appartient à une succursale
     */
    public function branch()
    {
        return $this->belongsTo(PharmacyBranch::class, 'pharmacy_branch_id');
    }

    /**
     * Un emplacement peut contenir plusieurs stocks
     */
    public function stocks()
    {
        return $this->hasMany(Stock::class, 'storage_location_id');
    }

    public function branchArticles()
    {
        return $this->hasMany(PharmacyBranchArticle::class, 'default_storage_location_id');
    }
}