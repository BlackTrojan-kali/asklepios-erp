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
    

    public function facilityRoom(){
        return $this->belongsTo(Bed::class);
    }
    // Relation avec la chambre
    

    // Historique complet de toutes les admissions sur ce lit
    public function admissions()
    {
        return $this->hasMany(Admission::class);
    }

    // NOUVEAU : Raccourci pour récupérer UNIQUEMENT l'admission active
    public function currentAdmission()
    {
        return $this->hasOne(Admission::class)->where('status', 'ADMITTED');
    }
}