// Importation des types génériques (ajuste le chemin selon ton projet)
import type { HospitalDto } from './types';

// ==========================================
// DTOs (Data Transfer Objects) - LECTURE
// ==========================================

/**
 * Représente un chauffeur renvoyé par l'API (GET)
 */
export interface DriverDto {
    id: number;
    hospital_id: number;
    fullname: string;      // Nom complet du chauffeur
    phone: number | null;  // Numéro de téléphone (optionnel)
    is_active: boolean;    // Statut du chauffeur (Actif/Inactif)
    created_at?: string;
    updated_at?: string;

    // Relation optionnelle chargée par le backend
    hospital?: HospitalDto;
}

// ==========================================
// PAYLOADS - ÉCRITURE (Création / Modification)
// ==========================================

/**
 * Format attendu par le formulaire pour créer ou modifier un chauffeur (POST / PUT)
 */
export interface DriverPayload {
    fullname: string;
    phone?: number | string | null; // Accepte string depuis le formulaire, sera converti/nettoyé
    is_active?: boolean;            // Optionnel (prendra true par défaut côté backend si omis)
}