// ==========================================
// DTOs POUR LA GESTION DES RÉCEPTIONNISTES
// ==========================================

// Import des types globaux (Ajuste les chemins selon ton arborescence)
import type { CenterDto, PaginatedResponse } from "./types";
import type { UserDto } from "./PharmTypes"; // Assure-toi que UserDto est bien importé de sa source

/**
 * Représente un profil de réceptionniste tel qu'il est renvoyé par l'API (GET)
 */
export interface ReceptionistDto {
    id: number;
    user_id: number;
    hospital_id: number;
    center_id: number;
    desk_name: string;
    
    // Relations chargées depuis le backend via Eager Loading (with(['user', 'center']))
    user?: UserDto;
    center?: CenterDto;
    
    created_at?: string;
    updated_at?: string;
}

/**
 * Le format attendu par le formulaire pour créer ou modifier un réceptionniste (POST / PUT)
 */
export interface ReceptionistPayload {
    // --- Informations de l'Utilisateur (User) ---
    first_name: string;
    last_name?: string | null;
    phone: string | number; // Le type string gère mieux les inputs vides côté React
    email: string;
    password?: string; // Obligatoire à la création, optionnel à la modification
    
    // --- Informations du Profil (ProfileReception) ---
    center_id: number | ''; // '' permet de gérer l'état initial vide du select
    desk_name: string;
}

// NOTE : Pour la pagination des réceptionnistes dans ton store, 
// tu peux désormais utiliser ton interface magique globale !
// Exemple : PaginatedResponse<ReceptionistDto>