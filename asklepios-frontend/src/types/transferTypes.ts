// N'oublie pas d'ajuster les chemins d'importation selon la structure exacte de ton projet Asklepios.
// Si tu n'as pas encore certains de ces DTOs, tu pourras les remplacer temporairement par `any`.
import type { DriverDto } from './driverTypes';
import type { VehiculeDto } from './vehiculeTypes';
// import type { PharmacyBranchDto } from './pharmacyTypes'; 
// import type { BatchDto } from './articleTypes'; 

// ==========================================
// TYPES SPÉCIFIQUES
// ==========================================

export type TransferStatus = 'INITIATED' | 'CANCELLED' | 'TERMINATED';

// ==========================================
// DTOs (Data Transfer Objects) - LECTURE
// ==========================================

/**
 * Représente une ligne de transfert (un lot expédié)
 */
export interface StockTransferLineDto {
    id: number;
    stock_transfer_id: number;
    batch_id: number;
    qty_requested: number | null;
    qty_shipped: number | null;
    created_at?: string;
    updated_at?: string;

    // Relation optionnelle chargée par le backend
    batch?: any; // Remplace `any` par `BatchDto` quand il sera disponible
}

/**
 * Représente un transfert de stock global (l'expédition)
 */
export interface StockTransferDto {
    id: number;
    source_pharmacy_id: number;
    destination_pharmacy_id: number;
    driver_id: number;
    vehicule_id: number;
    status: TransferStatus;
    shipped_at: string | null;
    received_at: string | null;
    created_at?: string;
    updated_at?: string;

    // Relations optionnelles chargées par le backend (via with())
    sourcePharmacy?: any;      // Remplace `any` par `PharmacyBranchDto`
    destinationPharmacy?: any; // Remplace `any` par `PharmacyBranchDto`
    driver?: DriverDto;
    vehicule?: VehiculeDto;
    lines?: StockTransferLineDto[];
}

// ==========================================
// PAYLOADS - ÉCRITURE (Création)
// ==========================================

/**
 * Format attendu pour une ligne de transfert lors de la création
 */
export interface StockTransferLinePayload {
    batch_id: number;
    qty: number;
}

/**
 * Format attendu par le contrôleur (store) pour initier un transfert (POST)
 * Note: source_pharmacy_id n'est pas requis car le backend le déduit du profil connecté.
 */
export interface StockTransferPayload {
    destination_pharmacy_id: number;
    driver_id: number;
    vehicule_id: number;
    lines: StockTransferLinePayload[];
}