<?php

namespace App\Http\Services\Security;

class ScopeResolver
{
    public static function applyPharmacyScope($query, string $column = 'pharmacy_branch_id')
    {
        $user = auth()->user();
        if ($user && $user->profile_admin) {
            $rawIds = $user->profile_admin->pharmacy_branch_ids;
            
            // 🟢 CORRECTION : Forcer le décodage si Laravel retourne une String ("JSON")
            $branchIds = is_string($rawIds) ? json_decode($rawIds, true) : $rawIds;

            if (!empty($branchIds) && is_array($branchIds)) {
                $query->whereIn($column, $branchIds);
            }
        }

        return $query;
    }

    public static function applyCenterScope($query, string $column = 'center_id')
    {
        $user = auth()->user();
        if ($user && $user->profile_admin) {
            $rawIds = $user->profile_admin->center_ids;
            $centerIds = is_string($rawIds) ? json_decode($rawIds, true) : $rawIds;

            if (!empty($centerIds) && is_array($centerIds)) {
                $query->whereIn($column, $centerIds);
            }
        }
        return $query;
    }

    public static function applyLaboratoryScope($query, string $column = 'laboratory_id')
    {
        $user = auth()->user();
        if ($user && $user->profile_admin) {
            $rawIds = $user->profile_admin->laboratory_ids;
            $labIds = is_string($rawIds) ? json_decode($rawIds, true) : $rawIds;

            if (!empty($labIds) && is_array($labIds)) {
                $query->whereIn($column, $labIds);
            }
        }
        return $query;
    }

    public static function canAccessPharmacy(int $branchId): bool
    {
        $user = auth()->user();
        if (!$user || !$user->profile_admin) return true;
        
        $rawIds = $user->profile_admin->pharmacy_branch_ids;
        $branchIds = is_string($rawIds) ? json_decode($rawIds, true) : $rawIds;

        if (empty($branchIds) || !is_array($branchIds)) return true; // Accès total
        
        return in_array($branchId, $branchIds);
    }
}