 export interface UserLoginDto {
    email:string | null,
    password:string | null,
}
// src/types/types.ts

export interface ProfileDto {
    first_name: string;
    last_name: string | null;
    role: "super_admin" | "admin" | "doctor" | "pharmacy" | "reception" | "laboratory";
    email: string;
}
export  interface CountryDto{
    
    id?: number; 
    name:string;
    code:string;
    currency:string;
}
// Interface magique pour gérer n'importe quelle réponse paginée de Laravel !
export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}
export interface HospitalDto {
    id?: number;
    name: string;
    niu?: string | null;
    logo_url?: string | null; // L'URL venant de la BDD pour l'affichage
    logo?: File | null;       // Le fichier réel à envoyer lors de la création/modification
}
// --- DTOs POUR LA GESTION DES ADMINISTRATEURS ---

export interface AdminProfileDto {
    id: number;
    user_id: number;
    hospital_id: number;
    // La relation optionnelle vers l'hôpital
    hospital?: HospitalDto; 
}

export interface AdminDto {
    id: number;
    first_name: string;
    last_name: string | null;
    phone: number | string;
    email: string;
    role_id: number;
    // La relation optionnelle vers le profil (qui contient l'hôpital)
    profile_admin?: AdminProfileDto;
}

// Le format attendu par ton formulaire pour créer ou modifier un administrateur
export interface AdminPayload {
    first_name: string;
    last_name?: string | null;
    phone: number | string;
    email: string;
    // Requis à la création, optionnel à la modification
    password?: string; 
    hospital_id: number;
}
export interface LicenceDto {
    id: number;
    name: string;
    description: string | null;
    created_at?: string;
    updated_at?: string;
}

/**
 * Le format attendu par le formulaire pour créer ou modifier une licence
 * (On n'envoie pas l'ID ni les dates de création/modification au backend)
 */
export interface LicencePayload {
    name: string;
    description?: string | null;
}
// ==========================================
// DTOs POUR LA GESTION DES SOUSCRIPTIONS (SUPA)
// ==========================================

/**
 * Représente une ligne de facturation (une licence dans une souscription)
 */
export interface SubscriptionItemDto {
    id: number;
    subscription_id: number;
    licence_id: number;
    unit_price: number;
    // La relation optionnelle vers les détails de la licence
    licence?: LicenceDto; 
}

/**
 * Représente la souscription globale renvoyée par le backend
 */
export interface SubscriptionDto {
    id: number;
    hospital_id: number;
    country_id: number;
    starting_date: string;
    ending_date: string;
    // Les relations optionnelles chargées par le backend
    hospital?: HospitalDto;
    country?: CountryDto;
    items?: SubscriptionItemDto[];
}

// --- PAYLOADS (Format attendu pour la création / modification) ---

export interface SubscriptionItemPayload {
    licence_id: number;
    unit_price: number;
}

export interface SubscriptionPayload {
    hospital_id: number;
    country_id: number;
    starting_date: string; // Format attendu : "YYYY-MM-DD"
    ending_date: string;   // Format attendu : "YYYY-MM-DD"
    items: SubscriptionItemPayload[];
}

// --- DTOs POUR LA PRÉVISUALISATION DE FACTURE ---

export interface SubscriptionPreviewItem {
    licence_name: string;
    unit_price: number;
    center_count: number;
    sub_total: number;
}

export interface SubscriptionPreviewDto {
    hospital_name: string;
    period: {
        start: string;
        end: string;
    };
    country: string;
    licences: SubscriptionPreviewItem[];
    total_amount: number;
    currency: string;
}