// src/types/ConsultationTypes.ts

import type { PatientVisitDto } from './AppointmentTypes'; // À ajuster selon tes imports
import type { ProfileDoctorDto } from './DoctorTypes';
import type { MedicalActDto } from './MedicalActCatalogTypes';
import type { ArticleDto } from './PharmTypes';

// ==========================================================
// 1. DTOs (Données reçues de l'API - Lecture)
// ==========================================================

export interface PrescriptionLineDto {
    id: number;
    prescription_id: number;
    article_id: number | null;
    custom_medication_name: string | null;
    dosage: string;
    article?: ArticleDto; // Relation chargée
}

export interface PrescriptionDto {
    id: number;
    consultation_id: number;
    status: 'PENDING' | 'DELIVERED' | 'CANCELLED';
    prescription_lines?: PrescriptionLineDto[];
    created_at: string;
}

export interface ExamRequestLineDto {
    id: number;
    exam_request_id: number;
    exam_name: string;
    result_notes: string | null;
    document_url: string | null;
}

export interface ExamRequestDto {
    id: number;
    consultation_id: number;
    status: 'PENDING' | 'COMPLETED';
    exam_request_lines?: ExamRequestLineDto[];
    created_at: string;
}

export interface PerformedMedicalActDto {
    id: number;
    patient_visit_id: number;
    medical_act_catalog_id: number;
    equipment_id: number | null;
    applied_price: number;
    medical_act_catalog?: MedicalActDto; // Relation
}

export interface ConsultationDto {
    id: number;
    patient_visit_id: number;
    profile_doctor_id: number;
    chief_complaint: string;
    clinical_data: Record<string, any> | null; // Format JSON flexible (poids, tension, temp...)
    consultation_price: number;
    
    // Relations
    patient_visit?: PatientVisitDto;
    profile_doctor?: ProfileDoctorDto;
    prescriptions?: PrescriptionDto[];
    exam_requests?: ExamRequestDto[];
    
    created_at: string;
    updated_at: string;
}


// ==========================================================
// 2. PAYLOADS (Données envoyées à l'API - Écriture)
// ==========================================================

export interface PrescriptionLinePayload {
    article_id?: number | null;
    custom_medication_name?: string | null;
    dosage: string;
}

export interface ExamRequestLinePayload {
    exam_name: string;
}

export interface PerformedMedicalActPayload {
    medical_act_catalog_id: number;
    equipment_id?: number | null;
    applied_price: number;
}

/**
 * Le Payload global envoyé lors de la validation d'une consultation
 */
export interface CreateConsultationPayload {
    patient_visit_id: number;
    chief_complaint: string;
    clinical_data?: Record<string, any>; // ex: { poids: 75, tension: "12/8" }
    consultation_price?: number;
    
    // Tableaux optionnels générés par les services
    prescriptions?: PrescriptionLinePayload[];
    exams?: ExamRequestLinePayload[];
    medical_acts?: PerformedMedicalActPayload[];
}

export interface UpdateConsultationNotesPayload {
    chief_complaint?: string;
    clinical_data?: Record<string, any>;
}