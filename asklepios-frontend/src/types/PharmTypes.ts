// ==========================================
// DTOs POUR LA GESTION DES PHARMACIES (ADMIN)
// ==========================================

/**
 * Type strict pour les différents types de succursales
 */
export type PharmacyBranchType = "central_warehouse" | "retail_pos";
// ==========================================
// DTOs POUR LA GESTION DES PHARMACIES (ADMIN)
// ==========================================


/**
 * Représente une succursale de pharmacie telle qu'elle est renvoyée par l'API (GET)
 */
export interface PharmacyBranchDto {
    id: number;
    hospital_id: number;
    center_id: number | null; // Ajout du lien vers le centre (peut être null pour un magasin central)
    name: string;
    adress: string; // Attention: "adress" avec un seul 'd' comme défini dans ta migration
    type: PharmacyBranchType;
    
    // Relation chargée depuis le backend (si tu utilises with('center'))
    center?: {
        id: number;
        name: string;
        // Tu peux typer ça avec CenterDto si tu l'importes depuis ton fichier types.ts
    };

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
    center_id: number | null; // Ajout du champ pour la création/modification
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

// ==========================================
// DTOs POUR LA GESTION DES ARTICLES (CATALOGUE)
// ==========================================

/**
 * Représente un article tel qu'il est renvoyé par l'API (GET)
 */
// ==========================================
// DTOs POUR LA GESTION DES ARTICLES (CATALOGUE)
// ==========================================

export interface ArticleDto {
    id: number;
    hospital_id: number;
    category_id: number;
    name: string;
    barcode: string | null;
    global_min_qty: number;
    image_url: string | null;
    track_batches: boolean; // <-- NOUVEAU CHAMP
    
    category?: ArticleCategoryDto; 
    // --- NOUVEAUX CHAMPS OPTIONNELS (Calculés par le Backend) ---
    stock_qty?: number; 
    has_expiring_batches?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ArticlePayload {
    category_id: number | ""; 
    name: string;
    barcode: string;
    global_min_qty: number | ""; 
    track_batches: boolean; // <-- NOUVEAU CHAMP
    image: File | null; 
}


// ==========================================
// DTOs POUR LA GESTION DES LOTS (BATCHES)
// ==========================================

export interface BatchDto {
    id: number;
    article_id: number;
    batch_number: string;
    expire_date: string | null; // <-- PEUT DÉSORMAIS ÊTRE NULL
    purchase_price: number;
    
    article?: ArticleDto; 
    
    created_at?: string;
    updated_at?: string;
}

export interface BatchPayload {
    article_id: number | "";
    batch_number: string;
    expire_date: string; // Une chaîne vide "" sera envoyée comme null au backend
    purchase_price: number | ""; 
}
// ==========================================
// DTOs POUR LA GESTION DES UTILISATEURS
// ==========================================

export interface UserDto {
    id: number;
    first_name: string;
    last_name: string | null;
    phone: number;
    email: string;
    created_at?: string;
    updated_at?: string;
}

// ==========================================
// DTOs POUR LA GESTION DES PHARMACIENS
// ==========================================

/**
 * Représente un profil pharmacien tel qu'il est renvoyé par l'API (GET)
 */
export interface PharmacienDto {
    id: number;
    user_id: number;
    hospital_id: number;
    branch_id: number;
    position: 'magasin' | 'vente';
    
    // Relations chargées depuis le backend
    user?: UserDto;
    branch?: PharmacyBranchDto; // Assure-toi d'avoir ce DTO défini pour tes succursales
    
    created_at?: string;
    updated_at?: string;
}

/**
 * Le format attendu par le formulaire pour créer ou modifier un pharmacien (POST / PUT)
 */
export interface PharmacienPayload {
    first_name: string;
    last_name: string;
    phone: string | number; // Le string gère mieux les inputs vides avant soumission
    email: string;
    password?: string; // Optionnel lors de la modification
    position: 'magasin' | 'vente' | ''; // '' pour l'état initial du select
    branch_id: number | ''; // '' pour l'état initial du select
}