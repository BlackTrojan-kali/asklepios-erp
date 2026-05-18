// ==========================================
// DTOs POUR LA GESTION DES PHARMACIES (ADMIN)
// ==========================================

/**
 * Type strict pour les différents types de succursales
 */
export type PharmacyBranchType = "central_warehouse" | "retail_pos";

/**
 * Représente une succursale de pharmacie telle qu'elle est renvoyée par l'API (GET)
 */
export interface PharmacyBranchDto {
    id: number;
    hospital_id: number;
    name: string;
    adress: string; // Attention: "adress" avec un seul 'd' comme défini dans ta migration
    type: PharmacyBranchType;
    created_at?: string;
    updated_at?: string;
}

/**
 * Le format attendu par le formulaire pour créer ou modifier une succursale (POST / PUT)
 * Note : l'hospital_id n'est pas requis ici car le backend le déduit automatiquement.
 */
export interface PharmacyBranchPayload {
    name: string;
    adress: string;
    type: PharmacyBranchType | ""; // "" permet de gérer l'état initial vide du select
}

// Si tu as besoin de la réponse paginée plus tard, tu peux importer ton interface générique :
// import { PaginatedResponse } from "./types";