<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;

class PharmacyBranchArticle extends Model
{
    protected $guarded = [];

    /**
     * Configuration appartient à une succursale
     */
    public function branch()
    {
        return $this->belongsTo(PharmacyBranch::class, 'pharmacy_branch_id');
    }

    /**
     * Configuration concerne un article
     */
    public function article()
    {
        return $this->belongsTo(Article::class, 'article_id');
    }

    /**
     * Emplacement de stockage par défaut pour cet article dans cette succursale
     */
    public function defaultStorageLocation()
    {
        return $this->belongsTo(StorageLocation::class, 'default_storage_location_id');
    }
}
