<?php

namespace App\Models\Hospital;

use App\Models\Department;
use App\Models\Hospital;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicalActCatalog extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Le nom de la table associée au modèle.
     */
    protected $table = 'medical_act_catalogs';

    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'hospital_id',
        'department_id',
        'name',
        'base_price',
    ];

    /**
     * Les attributs qui doivent être castés (convertis).
     * Il est recommandé de caster les prix en float (ou decimal) 
     * pour garantir des calculs exacts dans l'ERP.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'base_price' => 'float', 
    ];

    // ======================================================
    // RELATIONS
    // ======================================================

    /**
     * Obtient l'hôpital auquel appartient cet acte médical.
     */
    public function hospital(): BelongsTo
    {
        // Ajuste le namespace si ton modèle Hospital est dans un dossier spécifique (ex: SUPA)
        return $this->belongsTo(Hospital::class);
    }

    /**
     * Obtient le département dans lequel cet acte est pratiqué.
     */
    public function department(): BelongsTo
    {
        // Ajuste le namespace si ton modèle Department est ailleurs
        return $this->belongsTo(Department::class);
    }
}