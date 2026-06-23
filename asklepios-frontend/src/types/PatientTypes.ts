// ==========================================
// DTOs POUR LA GESTION DES PATIENTS
// ==========================================

// Import de l'interface de pagination générique (ajuste le chemin si besoin)
// import type { PaginatedResponse } from "./types";

/**
 * Représente un dossier patient tel qu'il est renvoyé par l'API (GET)
 */
export interface PatientDto {
    id: number;
    hospital_id: number;
    patient_code: string;       // Généré automatiquement par le backend (ex: H1-A3K9-M2W4)
    first_name: string;
    last_name: string | null;
    bith_date: string;          // Attention à la coquille (bith au lieu de birth), conservée pour matcher la BDD
    contact_phone: string;
    
    // Horodatages Eloquent
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null; // Présent si tu utilises le SoftDeletes
}

/**
 * Le format attendu par le formulaire pour créer ou modifier un dossier patient (POST / PUT)
 * * Note : 
 * - L'hospital_id est déduit côté backend via le token Sanctum du réceptionniste.
 * - Le patient_code est généré par le backend à la création.
 */
export interface PatientPayload {
    first_name: string;
    last_name?: string | null;
    bith_date: string;          // Format attendu par le backend: "YYYY-MM-DD"
    contact_phone: string;
}

// NOTE : Pour la pagination, tu pourras utiliser ton interface magique :
// PaginatedResponse<PatientDto>