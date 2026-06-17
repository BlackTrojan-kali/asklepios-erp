// Centralisation des imports depuis ton fichier principal de types pharmacie
import type { BatchDto, ArticleDto } from './PharmTypes';

// ==========================================
// DTOs POUR LA GESTION DES SUCCURSALES
// ==========================================
export interface PharmacyBranchDto {
    id: number;
    hospital_id: number;
    name: string;
    address?: string;
    created_at?: string;
    updated_at?: string;
}

// ==========================================
// DTOs POUR LA GESTION DES STOCKS VISUELS
// ==========================================
/**
 * Représente un enregistrement de stock tel qu'il est renvoyé par l'API (GET)
 */
export interface StockDto {
    id: number;
    pharmacy_branch_id: number;
    batch_id: number;
    qty: number;
    
    // Relations chargées depuis le backend (via with(['branch', 'batch.article.category']))
    branch?: PharmacyBranchDto; 
    batch?: BatchDto;           
    
    created_at?: string;
    updated_at?: string;
}

// ==========================================
// ENUMS & TYPES LITTÉRAUX POUR LES MOUVEMENTS
// ==========================================
export type MovementType = 'ENTRY' | 'EXIT';

export type MovementReferenceType = 
    | 'PURCHASE' 
    | 'RETURN' 
    | 'TRANSFER' 
    | 'INVENTORY' 
    | 'SALE' 
    | 'OTHER';

// ==========================================
// DTOs POUR LES EMPLACEMENTS DE RANGEMENT
// ==========================================
export interface StorageLocationDto {
    id: number;
    pharmacy_branch_id: number;
    aisle: string | null;     // Allée
    shelf: string | null;     // Étagère
    description: string | null;
    created_at?: string;
    updated_at?: string;
}

// ==========================================
// DTOs POUR LA PISTE D'AUDIT (MOVEMENTS)
// ==========================================
export interface StockMovementDto {
    id: number;
    pharmacy_branch_id: number;
    batch_id: number;
    storage_location_id: number | null;
    qty: number;
    reference_type: MovementReferenceType;
    reference_id: number | null;
    type: MovementType;
    qty_in_stock: number;
    comment: string | null;
    created_at: string;
    updated_at: string;

    // Relations chargées par le backend (with(['batch.article', 'storageLocation', 'pharmacyBranch']))
    batch?: BatchDto; // Utilise proprement le DTO importé en haut
    storageLocation?: StorageLocationDto;
    pharmacyBranch?: PharmacyBranchDto; // Réutilise le DTO de succursale défini plus haut
}

/**
 * Type pour le payload si un mouvement devait être soumis manuellement (ex: ajustement d'inventaire)
 */
export interface StockMovementPayload {
    batch_id: number;
    storage_location_id?: number | null;
    qty: number;
    type: MovementType;
    reference_type: MovementReferenceType;
    comment?: string;
}