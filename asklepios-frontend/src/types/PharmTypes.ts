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
    center_id: number | null; // Lien vers le centre médical (si applicable)
    country_id: number | null; // <-- NOUVEAU: Lien vers le pays
    name: string;
    adress: string; // Attention: "adress" avec un seul 'd' (comme défini dans la migration)
    type: PharmacyBranchType;
    
    // Relations chargées depuis le backend (si 'with' utilisé dans Laravel)
    center?: {
        id: number;
        name: string;
        // Tu peux remplacer par CenterDto si disponible
    };
    country?: {
        id: number;
        name: string;
        code: string;
        currency: string;
    };

    created_at?: string;
    updated_at?: string;
}

/**
 * Le format attendu par le formulaire pour créer ou modifier une succursale (POST / PUT)
 */
export interface PharmacyBranchPayload {
    name: string;
    adress: string;
    type: PharmacyBranchType | ""; 
    center_id: number | null; 
    country_id: number | null; // <-- NOUVEAU CHAMP
}


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
    article_category_id: number | null; // Pour gérer le "Aucun parent"
}


// ==========================================
// DTOs POUR LA GESTION DES ARTICLES (CATALOGUE)
// ==========================================

/**
 * Représente un article tel qu'il est renvoyé par l'API (GET)
 */
export interface ArticleDto {
    id: number;
    hospital_id: number;
    category_id: number;
    name: string;
    barcode: string | null;
    global_min_qty: number;
    image_url: string | null;
    track_batches: boolean;
    
    category?: ArticleCategoryDto; 
    
    // Nouveaux champs optionnels calculés par le Backend
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
    track_batches: boolean; 
    image: File | null; 
}


// ==========================================
// DTOs POUR LA GESTION DES LOTS (BATCHES)
// ==========================================

export interface BatchDto {
    id: number;
    article_id: number;
    batch_number: string;
    expire_date: string | null; // Peut être null si l'article n'a pas de date de péremption
    purchase_price: number;
    
    article?: ArticleDto; 
    
    created_at?: string;
    updated_at?: string;
}

export interface BatchPayload {
    article_id: number | "";
    batch_number: string;
    expire_date: string; // Envoyée comme string vide ("") au backend pour signifier "null"
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
    branch?: PharmacyBranchDto; 
    
    created_at?: string;
    updated_at?: string;
}

/**
 * Le format attendu par le formulaire pour créer ou modifier un pharmacien (POST / PUT)
 */
export interface PharmacienPayload {
    first_name: string;
    last_name: string;
    phone: string | number; // String gère mieux les inputs vides avant soumission
    email: string;
    password?: string; // Optionnel lors de la modification
    position: 'magasin' | 'vente' | ''; // '' pour l'état initial du select
    branch_id: number | ''; // '' pour l'état initial du select
}