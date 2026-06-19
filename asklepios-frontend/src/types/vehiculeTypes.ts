// Importation des types génériques si nécessaire (ajuste le chemin selon ton projet)
import type { HospitalDto } from './types';

// ==========================================
// DTOs (Data Transfer Objects) - LECTURE
// ==========================================

/**
 * Représente un véhicule renvoyé par l'API (GET)
 */
export interface VehiculeDto {
    id: number;
    hospital_id: number;
    licence_plate: string; // Plaque d'immatriculation
    model: string;         // Modèle/Marque du véhicule
    is_active: boolean;    // Statut du véhicule (Actif/Inactif)
    created_at?: string;
    updated_at?: string;

    // Relation optionnelle chargée par le backend (via with('hospital'))
    hospital?: HospitalDto;
}

// ==========================================
// PAYLOADS - ÉCRITURE (Création / Modification)
// ==========================================

/**
 * Format attendu par le formulaire pour créer ou modifier un véhicule (POST / PUT)
 */
export interface VehiculePayload {
    licence_plate: string;
    model: string;
    is_active?: boolean; // Optionnel (prendra true par défaut côté backend si omis)
}