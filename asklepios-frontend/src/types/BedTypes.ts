// ==========================================
// DTOs POUR LES LITS D'HOSPITALISATION
// ==========================================

import type { FacilityRoomDto } from "./FacilityRoomTypes";

/**
 * Objet constant agissant comme un Enum pour le runtime (Compatible avec Vite/SWC)
 * Représente l'état actuel d'un lit.
 */
export const BedState = {
    AVAILABLE: 'AVAILABLE',     // Disponible pour un nouveau patient
    OCCUPIED: 'OCCUPIED',       // Actuellement occupé par un patient
    CLEANING: 'CLEANING',       // En cours de nettoyage / désinfection
    MAINTENANCE: 'MAINTENANCE'  // En réparation ou maintenance technique
} as const;

/**
 * Type extrait de l'objet pour le typage statique strict
 */
export type BedState = (typeof BedState)[keyof typeof BedState];

/**
 * Représente un lit tel qu'il est renvoyé par l'API (GET)
 */
export interface BedDto {
    id: number;
    facility_room_id: number;
    bed_number: string;
    state: BedState;
    
    // Relation facultative chargée via Eager Loading (with('room'))
    room?: FacilityRoomDto;
    
    created_at?: string;
    updated_at?: string;
}

/**
 * Format attendu par le formulaire pour la création ou la modification (POST / PUT)
 */
export interface BedPayload {
    facility_room_id: number | ''; // '' pour faciliter la gestion de l'état initial des inputs
    bed_number: string;
    state: BedState | '';          // '' pour forcer le choix dans un Select
}

// NOTE : Pour manipuler les réponses paginées dans ton store :
// PaginatedResponse<BedDto>