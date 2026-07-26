// ==========================================
// DTOs POUR LES CATÉGORIES DE CHAMBRES
// ==========================================

import type { CenterDto } from "./types"; // Ajuste le chemin selon ton arborescence

/**
 * Représente une catégorie de chambre renvoyée par l'API (GET)
 */
export interface RoomCategoryDto {
    id: number;
    center_id: number;
    name: string;               // Ex: VIP, Standard, Demi-prive, Box urgence...
    price_per_night: number;    // Prix de la nuitée pour l'hospitalisation
    
    // Relation facultative chargée via Eager Loading (with('center'))
    center?: CenterDto;
    
    created_at?: string;
    updated_at?: string;
}

/**
 * Format attendu par le formulaire pour la création ou la modification (POST / PUT)
 */
export interface RoomCategoryPayload {
    center_id: number | '';     // '' facilite la gestion de l'état initial dans un select
    name: string;
    price_per_night: number | ''; // Permet de laisser l'input vide pendant la saisie
}

// Pour manipuler les réponses paginées de l'administration :
// PaginatedResponse<RoomCategoryDto>