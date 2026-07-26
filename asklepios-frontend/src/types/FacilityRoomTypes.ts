// ==========================================
// DTOs POUR LES SALLES ET INSTALLATIONS
// ==========================================

import type { DepartmentDto } from "./types";
import type { RoomCategoryDto } from "./RoomCategoryTypes";

/**
 * Objet constant agissant comme un Enum pour le runtime (Ne sera pas effacé par Vite)
 */
export const FacilityRoomType = {
    WAITING_ROOM: 'WAITING_ROOM',
    CONSULTATION: 'CONSULTATION',
    WARD: 'WARD'
} as const;

/**
 * Type extrait de l'objet pour le typage statique de TypeScript
 */
export type FacilityRoomType = (typeof FacilityRoomType)[keyof typeof FacilityRoomType];

/**
 * Représente une salle/installation telle qu'elle est renvoyée par l'API (GET)
 */
export interface FacilityRoomDto {
    id: number;
    department_id: number;
    room_category_id: number | null;
    name: string;
    type: FacilityRoomType;
    
    // Relations facultatives chargées via Eager Loading
    department?: DepartmentDto;
    category?: RoomCategoryDto;
    
    created_at?: string;
    updated_at?: string;
}

/**
 * Format attendu par le formulaire pour la création ou la modification (POST / PUT)
 */
export interface FacilityRoomPayload {
    department_id: number | '';          
    room_category_id?: number | '' | null; 
    name: string;
    type: FacilityRoomType | '';         
}