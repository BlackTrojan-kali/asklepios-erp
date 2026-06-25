<?php

namespace App\Models\Hospital;

use App\Models\Center; // Import du modèle Center resté à la racine
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RoomCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'center_id',
        'price_per_night',
        'name',
    ];

    protected $casts = [
        'price_per_night' => 'float',
    ];

    /**
     * Obtenir le centre médical auquel appartient cette catégorie.
     */
    public function center(): BelongsTo
    {
        return $this->belongsTo(Center::class);
    }

    /**
     * Obtenir toutes les salles/chambres ayant cette catégorie.
     */
    public function rooms(): HasMany
    {
        return $this->hasMany(FacilityRoom::class);
    }
}