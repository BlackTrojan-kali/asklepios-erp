<?php

namespace App\Models\Hospital; // <-- Namespace mis à jour pour correspondre au dossier

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Equipment extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Le nom de la table associée au modèle.
     */
    protected $table = 'equipment';

    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'department_id',
        'facility_room_id',
        'name',
        'manufacturer',
        'model_number',
        'serial_number',
        'status',
        'last_maintenance_date',
        'next_maintenance_date',
        'purchase_date',
        'warranty_expiry_date',
        'notes',
    ];

    /**
     * Les attributs qui doivent être castés (convertis).
     *
     * @var array<string, string>
     */
    protected $casts = [
        'last_maintenance_date' => 'date',
        'next_maintenance_date' => 'date',
        'purchase_date'         => 'date',
        'warranty_expiry_date'  => 'date',
    ];

    // ======================================================
    // 1. RELATIONS
    // ======================================================

    /**
     * Obtient le département auquel appartient cet équipement.
     * Note : Ajuste le chemin du namespace si Department n'est pas dans le dossier Hospital
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Department::class); 
        // Ou juste Department::class si il est dans le même dossier Hospital
    }

    /**
     * Obtient la salle (localisation physique) où se trouve l'équipement.
     * Note : Ajuste le chemin du namespace si FacilityRoom n'est pas dans le dossier Hospital
     */
    public function facilityRoom(): BelongsTo
    {
        return $this->belongsTo(FacilityRoom::class);
        // Ou juste FacilityRoom::class si il est dans le même dossier Hospital
    }

    // ======================================================
    // 2. SCOPES (Raccourcis de requêtes)
    // ======================================================

    /**
     * Scope : Récupérer uniquement les équipements prêts à l'emploi.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }

    /**
     * Scope : Récupérer les équipements en panne ou en maintenance.
     */
    public function scopeUnavailable($query)
    {
        return $query->whereIn('status', ['IN_MAINTENANCE', 'OUT_OF_SERVICE']);
    }

    /**
     * Scope : Récupérer les équipements dont la maintenance est prévue dans les 30 prochains jours.
     */
    public function scopeNeedsMaintenance($query)
    {
        return $query->whereNotNull('next_maintenance_date')
                     ->where('next_maintenance_date', '<=', now()->addDays(30))
                     ->whereNotIn('status', ['RETIRED']);
    }
}