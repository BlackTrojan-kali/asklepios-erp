<?php

namespace App\Models\Hospital;

use App\Models\Department; // Import du modèle Department resté à la racine
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FacilityRoom extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id', // En supposant que tu as corrigé 'departement_id' dans la migration
        'room_category_id',
        'name',
        'type',
    ];

    /**
     * Obtenir le département dans lequel se trouve cette salle.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Obtenir la catégorie de tarification de la salle (peut être null).
     */
    public function category(): BelongsTo
    {
        // Comme RoomCategory est dans le même namespace (Hospital), pas besoin de l'importer en haut
        return $this->belongsTo(RoomCategory::class, 'room_category_id');
    }

    /**
     * Obtenir tous les lits contenus dans cette salle.
     */
    public function beds(): HasMany
    {
        return $this->hasMany(Bed::class);
    }
}