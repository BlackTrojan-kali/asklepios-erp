<?php


namespace App\Models\Pharmacy;

use App\Models\Hospital;
use App\Models\Pharmacy\ArticleCategory;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    //
    protected $guarded = [];

    /**
     * L'article appartient à un hôpital
     */
    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    /**
     * L'article appartient à une catégorie
     */
    public function category()
    {
        return $this->belongsTo(ArticleCategory::class, 'category_id');
    }
}
