// ==========================================
// DTOs POUR LA GESTION DES PATIENTS
// ==========================================

/**
 * Objet constant agissant comme un Enum pour le runtime (Compatible avec Vite/SWC)
 */
export const PatientGender = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    OTHER: 'OTHER'
} as const;

export type PatientGender = (typeof PatientGender)[keyof typeof PatientGender];

/**
 * Représente un dossier patient tel qu'il est renvoyé par l'API (GET)
 */
export interface PatientDto {
    id: number;
    hospital_id: number;
    patient_code: string;       // Généré automatiquement par le backend (ex: H1-A3K9-M2W4)
    first_name: string;
    last_name: string | null;
    bith_date: string;          // Coquille (bith au lieu de birth), conservée pour matcher la BDD
    contact_phone: string;
    birth_place: string | null;
    address: string | null;
    emergency_contact_name: string | null;
    emergency_contact_number: string | null;
    gender: PatientGender;
    
    // Horodatages Eloquent
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null; // Présent via SoftDeletes
}

/**
 * Le format attendu par le formulaire pour créer ou modifier un dossier patient (POST / PUT)
 */
export interface PatientPayload {
    first_name: string;
    last_name?: string | null;
    bith_date: string;          // Format attendu par le backend: "YYYY-MM-DD"
    contact_phone: string;
    birth_place?: string | null;
    address?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_number?: string | null;
    gender: PatientGender | ''; // '' pour forcer le choix dans un Select (état initial)
}