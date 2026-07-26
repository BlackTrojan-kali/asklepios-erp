// src/types/MedicalActCatalogTypes.ts

/**
 * DTO (Data Transfer Object) : Ce que l'API nous renvoie (Lecture)
 */
export interface MedicalActDto {
    id: number;
    hospital_id: number;
    department_id: number;
    
    name: string;
    base_price: number;
    
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
}

/**
 * Payload : Les données à envoyer à l'API pour Créer ou Mettre à jour (Écriture)
 */
export interface MedicalActPayload {
    hospital_id: number | string;
    name: string;
    base_price: number | string;
}