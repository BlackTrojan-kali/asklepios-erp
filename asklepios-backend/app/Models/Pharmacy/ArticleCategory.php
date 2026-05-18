<?php

namespace App\Models\Pharmacy;

use App\Models\Hospital;
use Illuminate\Database\Eloquent\Model;

class ArticleCategory extends Model
{
    //
    protected $guarded  = [];
    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    /**
     * Récupère la catégorie parente (si c'est une sous-catégorie)
     */
    public function parentCategory()
    {
        return $this->belongsTo(ArticleCategory::class, 'article_category_id');
    }

    /**
     * Récupère toutes les sous-catégories directes de cette catégorie
     */
    public function subCategories()
    {
        return $this->hasMany(ArticleCategory::class, 'article_category_id');
    }
}
