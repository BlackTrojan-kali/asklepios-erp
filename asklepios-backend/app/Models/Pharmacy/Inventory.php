<?php

namespace App\Models\Pharmacy;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    // Indiquer les champs qu'on peut remplir via create() ou update()
    protected $fillable = [
        'pharmacy_branch_id',
        'user_id',
        'status',          // PENDING ou VALIDATED
        'execution_date',  // Date de l'inventaire
        'comment'          // Notes du magasinier
    ];

    // Typage automatique pour les dates
    protected $casts = [
        'execution_date' => 'date',
    ];

    /**
     * RELATIONS
     */

    // Un inventaire appartient à une succursale (pharmacie)
    public function pharmacyBranch()
    {
        return $this->belongsTo(PharmacyBranch::class);
    }

    // Un inventaire est réalisé par un utilisateur (le magasinier/pharmacien)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Un inventaire contient plusieurs lignes (les produits comptés)
    public function lines()
    {
        return $this->hasMany(InventoryLine::class);
    }
}