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
// ==========================================
// DTOs POUR LA GESTION DES CATÉGORIES D'ARTICLES
// ==========================================

/**
 * Représente une catégorie telle qu'elle est renvoyée par l'API (GET)
 */
export interface ArticleCategoryDto {
    id: number;
    hospital_id: number;
    article_category_id: number | null; // ID de la catégorie parente (si c'est une sous-catégorie)
    name: string;
    description: string | null;
    
    // Relation chargée depuis le backend (récursive)
    parentCategory?: ArticleCategoryDto;
    
    created_at?: string;
    updated_at?: string;
}

/**
 * Le format attendu par le formulaire pour créer ou modifier une catégorie (POST / PUT)
 */
export interface ArticleCategoryPayload {
    name: string;
    description: string;
    // On utilise number | null pour gérer facilement le "Aucun parent" dans le Select
    article_category_id: number | null; 
}