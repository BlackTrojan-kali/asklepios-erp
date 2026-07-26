// ==========================================
// DTOs POUR LES RENDEZ-VOUS & FLUX PATIENTS
// ==========================================

import type { PatientDto } from "./PatientTypes";
import type { FacilityRoomDto } from "./FacilityRoomTypes";

// ------------------------------------------
// 1. ÉNUMÉRATIONS (Runtime-safe pour Vite)
// ------------------------------------------

/** Statuts d'un rendez-vous */
export const AppointmentStatus = {
    SCHEDULED: 'SCHEDULED',
    CANCELLED: 'CANCELLED',
    ARRIVED: 'ARRIVED'
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

/** Statuts d'une visite (Parcours dans l'hôpital) */
export const PatientVisitStatus = {
    IN_WAITING_ROOM: 'IN_WAITING_ROOM',
    IN_CONSULTATION: 'IN_CONSULTATION',
    COMPLETE: 'COMPLETE'
} as const;
export type PatientVisitStatus = (typeof PatientVisitStatus)[keyof typeof PatientVisitStatus];

/** Types d'admission (Urgence, Routine, Suivi) */
export const VisitType = {
    ROUTINE: 'ROUTINE',
    EMERGENCY: 'EMERGENCY',
    FOLLOW_UP: 'FOLLOW_UP'
} as const;
export type VisitType = (typeof VisitType)[keyof typeof VisitType];


// ------------------------------------------
// 2. INTERFACES (Modèles en lecture - GET)
// ------------------------------------------

/**
 * Représente un Rendez-vous tel qu'il est renvoyé par l'API
 */
export interface AppointmentDto {
    id: number;
    patient_id: number;
    profile_doctor_id: number;
    center_id: number;
    scheduled_datetime: string;
    reason: string | null;
    status: AppointmentStatus;

    // Relations optionnelles (Eager Loading)
    patient?: PatientDto;
    doctor?: any;  // Remplace 'any' par ton ProfileDoctorDto si tu l'as déjà créé
    center?: any;  // Remplace 'any' par ton CenterDto si tu l'as déjà créé

    created_at?: string;
    updated_at?: string;
}

/**
 * Représente une Visite / Admission d'un patient
 */
export interface PatientVisitDto {
    id: number;
    patient_id: number;
    center_id: number;
    profile_reception_id: number;
    appointment_id: number | null;
    waiting_room_id: number | null;
    consulting_room_id: number | null;
    arrival_time: string | null;
    queue_number: number | null;
    status: PatientVisitStatus;
    visit_type: VisitType;

    // Relations optionnelles
    patient?: PatientDto;
    appointment?: AppointmentDto;
    waiting_room?: FacilityRoomDto;
    consulting_room?: FacilityRoomDto;

    created_at?: string;
    updated_at?: string;
}


// ------------------------------------------
// 3. PAYLOADS ET FILTRES (Modèles d'écriture - POST/PUT/GET)
// ------------------------------------------

export interface AppointmentPayload {
    patient_id: number | '';
    profile_doctor_id: number | '';
    center_id: number | '';
    scheduled_datetime: string;
    reason?: string | null;
}

export interface ReschedulePayload {
    scheduled_datetime: string;
}

export interface AdmitToWaitingRoomPayload {
    waiting_room_id: number | '';
    visit_type: VisitType | '';
}

export interface AdmitToConsultationPayload {
    consulting_room_id: number | '';
}

// 👉 NOUVEAU : Filtres pour l'historique PDF
export interface AppointmentHistoryFilters {
    start_date?: string;
    end_date?: string;
    status?: string;
    center_id?: number | string;
    patient_id?: number | string;
}