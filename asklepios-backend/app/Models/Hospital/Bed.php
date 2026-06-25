<?php

namespace App\Models\Hospital;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bed extends Model
{
    use HasFactory;

    protected $fillable = [
        'facility_room_id',
        'bed_number',
        'state',
    ];

    /**
     * Obtenir la salle (FacilityRoom) dans laquelle se trouve le lit.
     */
    public function room(): BelongsTo
    {
        // Comme FacilityRoom est dans le même namespace (Hospital), pas besoin de l'importer
        return $this->belongsTo(FacilityRoom::class, 'facility_room_id');
    }
}