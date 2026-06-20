// Importation des types liés (ajuste les chemins selon ton architecture)
import type { StorageLocationDto, PharmacyBranchDto } from './StockTypes';
import type { BatchDto } from './PharmTypes';
// ==========================================
// ENUMS & TYPES LITTÉRAUX
// ==========================================

export type InventoryStatus = 'PENDING' | 'VALIDATED';

// ==========================================
// DTOs (Data Transfer Objects) - LECTURE
// ==========================================

/**
 * Représente une ligne de comptage d'inventaire
 */
export interface InventoryLineDto {
    id: number;
    inventory_id: number;
    pharmacy_branch_id: number;
    batch_id: number;
    storage_location_id: number | null;
    system_qty: number;
    physical_qty: number;
    descrepency: number; // L'écart (orthographe de ta base de données)
    created_at?: string;
    updated_at?: string;

    // Relations chargées par le backend
    batch?: BatchDto;
    storage_location?: StorageLocationDto;
}

/**
 * Représente l'en-tête d'un inventaire
 */
export interface InventoryDto {
    id: number;
    pharmacy_branch_id: number;
    user_id: number;
    status: InventoryStatus;
    execution_date: string;
    comment: string | null;
    created_at?: string;
    updated_at?: string;

    // Relations chargées par le backend
    pharmacyBranch?: PharmacyBranchDto;
    user?: {
        id: number;
        first_name: string;
        last_name: string;
    };
    lines?: InventoryLineDto[];
}

// ==========================================
// PAYLOADS - ÉCRITURE (Création / Modification)
// ==========================================

/**
 * Structure de la ligne envoyée lors de la création/modification
 */
export interface InventoryLinePayload {
    batch_id: number;
    storage_location_id?: number | null;
    physical_qty: number;
}

/**
 * Structure de la requête envoyée pour créer ou modifier un inventaire
 */
export interface InventoryPayload {
    execution_date: string;
    comment?: string | null;
    lines: InventoryLinePayload[];
}