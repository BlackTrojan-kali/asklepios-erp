<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProfileAdmin extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'hospital_id',
        'center_ids',
        'pharmacy_branch_ids',
        'laboratory_ids',
        'accessible_licences'
    ];

    // Laravel convertit automatiquement le JSON de la BDD en Tableau PHP et inversement
    protected $casts = [
        'center_ids'          => 'array',
        'pharmacy_branch_ids' => 'array',
        'laboratory_ids'      => 'array',
        'accessible_licences' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    /**
     * Helper pour filtrer automatiquement les requêtes selon les droits de l'Admin.
     * Exemple d'utilisation dans le contrôleur : 
     * $query = auth()->user()->profile_admin->scopePharmacyAccess($query);
     */
    public function scopePharmacyAccess($query, $columnName = 'id')
    {
        if (is_array($this->pharmacy_branch_ids) && count($this->pharmacy_branch_ids) > 0) {
            return $query->whereIn($columnName, $this->pharmacy_branch_ids);
        }
        return $query; // Si null, accès global, on ne filtre rien
    }

    public function scopeCenterAccess($query, $columnName = 'id')
    {
        if (is_array($this->center_ids) && count($this->center_ids) > 0) {
            return $query->whereIn($columnName, $this->center_ids);
        }
        return $query;
    }

    public function scopeLaboratoryAccess($query, $columnName = 'id')
    {
        if (is_array($this->laboratory_ids) && count($this->laboratory_ids) > 0) {
            return $query->whereIn($columnName, $this->laboratory_ids);
        }
        return $query;
    }
}