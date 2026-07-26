/**
 * Type Union pour les groupes sanguins
 */
export type BloodType = 
    | 'A+' | 'A-' | 'B+' | 'B-' 
    | 'AB+' | 'AB-' | 'O+' | 'O-' 
    | 'UNKNOWN';

/**
 * Structure d'un antécédent chirurgical tel qu'illustré dans la migration
 */
export interface SurgeryHistory {
    name: string;
    year?: number | string;
    notes?: string | null;
}

/**
 * DTO (Lecture) : Structure renvoyée par l'API
 */
export interface MedicalBackgroundDto {
    id: number;
    patient_id: number;
    blood_type: BloodType;
    
    // Champs JSON (Gérés comme des tableaux côté frontend)
    allergies: string[] | null;
    chronic_conditions: string[] | null;
    past_surgeries: SurgeryHistory[] | null; // 👉 Corrigé de string[] à SurgeryHistory[]
    current_medications: string[] | null;
    immunizations: string[] | null;
    
    // Champs texte libre
    family_history: string | null;
    lifestyle_habits: string | null;
    general_notes: string | null;
    
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
}

/**
 * Payload (Écriture) : Données envoyées pour création/modification
 */
export interface MedicalBackgroundPayload {
    blood_type?: BloodType;
    
    allergies?: string[] | null;
    chronic_conditions?: string[] | null;
    past_surgeries?: SurgeryHistory[] | null; // 👉 Aligné avec la structure d'objets JSON
    current_medications?: string[] | null;
    immunizations?: string[] | null;
    
    family_history?: string | null;
    lifestyle_habits?: string | null;
    general_notes?: string | null;
}