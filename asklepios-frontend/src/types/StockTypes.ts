// Importation du DTO du lot depuis ton fichier principal
// (Ajuste le chemin './PharmTypes' si nécessaire)
import type { BatchDto } from './PharmTypes';

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
// DTOs POUR LA GESTION DES STOCKS
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