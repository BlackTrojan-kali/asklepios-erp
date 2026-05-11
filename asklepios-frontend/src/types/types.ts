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