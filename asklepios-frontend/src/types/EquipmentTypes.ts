// src/types/EquipmentTypes.ts

// Optionnel : Import des types liés si tu les as déjà créés, sinon tu peux commenter ces lignes
import type { FacilityRoomDto } from './FacilityRoomTypes';
import type { DepartmentDto } from './types'; // ou autre nom selon ton architecture

/**
 * Type Union des statuts possibles pour un équipement (Remplace l'enum)
 */
export type EquipmentStatus = 
    | 'ACTIVE'
    | 'IN_USE'
    | 'IN_MAINTENANCE'
    | 'OUT_OF_SERVICE'
    | 'RETIRED';

/**
 * DTO (Data Transfer Object) : Ce que l'API nous renvoie (Lecture)
 */
export interface EquipmentDto {
    id: number;
    department_id: number;
    facility_room_id: number | null;
    
    name: string;
    manufacturer: string | null;
    model_number: string | null;
    serial_number: string | null;
    
    status: EquipmentStatus | string;
    
    last_maintenance_date: string | null; // Les dates arrivent sous forme de chaîne YYYY-MM-DD
    next_maintenance_date: string | null;
    purchase_date: string | null;
    warranty_expiry_date: string | null;
    
    notes: string | null;
    
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;

    // Relations (chargées via ->with() dans le contrôleur)
    facility_room?: FacilityRoomDto;
    department?: DepartmentDto;
}

/**
 * Payload : Les données à envoyer à l'API pour Créer ou Mettre à jour (Écriture)
 */
export interface EquipmentPayload {
    facility_room_id?: number | string | null;
    name: string;
    manufacturer?: string | null;
    model_number?: string | null;
    serial_number?: string | null;
    
    status: EquipmentStatus | string;
    
    last_maintenance_date?: string | null;
    next_maintenance_date?: string | null;
    purchase_date?: string | null;
    warranty_expiry_date?: string | null;
    
    notes?: string | null;
}