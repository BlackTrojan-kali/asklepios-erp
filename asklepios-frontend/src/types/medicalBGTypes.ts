/**
 * Type Union pour les groupes sanguins
 */
export type BloodType = 
    | 'A+' | 'A-' | 'B+' | 'B-' 
    | 'AB+' | 'AB-' | 'O+' | 'O-' 
    | 'UNKNOWN';

/**
 * DTO (Lecture) : Structure renvoyée par l'API
 */
export interface MedicalBackgroundDto {
    id: number;
    patient_id: number;
    
    blood_type: BloodType;
    
    // Champs JSON (Castés en tableaux PHP par Laravel)
    allergies: string[] | null;
    chronic_conditions: string[] | null;
    past_surgeries: string[] | null;
    current_medications: string[] | null;
    immunizations: string[] | null;
    
    // Champs texte
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
    
    // On peut envoyer des tableaux vides [] ou null
    allergies?: string[] | null;
    chronic_conditions?: string[] | null;
    past_surgeries?: string[] | null;
    current_medications?: string[] | null;
    immunizations?: string[] | null;
    
    family_history?: string | null;
    lifestyle_habits?: string | null;
    general_notes?: string | null;
}