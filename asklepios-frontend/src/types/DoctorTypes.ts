// ==========================================
// DTOs POUR LA GESTION DES MÉDECINS
// ==========================================

// Import des types globaux (Ajuste les chemins selon ton arborescence)
import type { CenterDto, DepartmentDto, PaginatedResponse } from "./types";
import type { UserDto } from "./PharmTypes"; // Assure-toi que UserDto est bien importé

/**
 * Représente un profil de médecin tel qu'il est renvoyé par l'API (GET)
 */
export interface DoctorDto {
    id: number;
    user_id: number;
    hospital_id: number;
    center_id: number;
    department_id: number | null; // Optionnel selon ta migration
    speciality: string;
    specifications: string | null;
    
    // Relations chargées depuis le backend via Eager Loading (with(['user', 'center', 'department']))
    user?: UserDto;
    center?: CenterDto;
    department?: DepartmentDto;
    
    created_at?: string;
    updated_at?: string;
}

/**
 * Le format attendu par le formulaire pour créer ou modifier un médecin (POST / PUT)
 */
export interface DoctorPayload {
    // --- Informations de l'Utilisateur (User) ---
    first_name: string;
    last_name?: string | null;
    phone: string | number; // Le type string gère mieux les inputs vides côté React
    email: string;
    password?: string; // Obligatoire à la création, optionnel à la modification
    
    // --- Informations du Profil (ProfileDoctor) ---
    center_id: number | ''; // '' permet de gérer l'état initial vide du select
    department_id?: number | '' | null; // Optionnel
    speciality: string;
    specifications?: string | null;
}

// NOTE : Pour la pagination des médecins dans ton store admin, 
// tu peux utiliser ton interface magique globale :
// PaginatedResponse<DoctorDto>