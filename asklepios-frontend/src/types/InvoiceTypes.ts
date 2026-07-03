// ==========================================
// IMPORT DES TYPES LIÉS (À adapter selon ton arborescence)
// ==========================================
import type { PatientDto } from './PatientTypes';
// En supposant que tu as ces types définis ailleurs :
import type { CenterDto } from './types';
import type { PatientVisitDto } from './AppointmentTypes';
import type { ConsultationDto } from './ConsultationTypes';
import type { PerformedMedicalActDto } from './ConsultationTypes';
import type { AdmissionDto } from './AdmissionTypes';
import type { PaymentInvoiceDto } from './PatientTypes';

// ==========================================
// ENUMS
// ==========================================
export const InvoiceStatus = {
    UNPAID: 'UNPAID',
    PAID: 'PAID'
} as const;

export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

// ==========================================
// DTOs (Data Transfer Objects - Retour de l'API)
// ==========================================

/**
 * Représente une facture complète (renvoyée par GET /shared/invoices/{id})
 */
export interface InvoiceDto {
    id: number;
    patient_id: number;
    center_id: number;
    patient_visit_id: number | null;
    total_amount: number;
    status: InvoiceStatus;
    created_at: string;
    updated_at: string;

    // --- Relations optionnelles (Eager Loading) ---
    patient?: PatientDto;
    center?: CenterDto;
    patientVisit?: PatientVisitDto;
    
    // Éléments facturés
    consultations?: ConsultationDto[];
    performedMedicalActs?: PerformedMedicalActDto[];
    admissions?: AdmissionDto[];
    
    // Encaissements
    payments?: PaymentInvoiceDto[];

    // --- Champs virtuels (Ajoutés par le backend lors des rapports) ---
    paid_amount?: number;       // Somme déjà versée
    remaining_amount?: number;  // Reste à payer
}

// ==========================================
// PAYLOADS (Données envoyées à l'API)
// ==========================================

/**
 * Payload pour la génération d'une facture depuis une visite
 * POST /shared/visits/{visitId}/generate-invoice
 */
export interface GenerateInvoicePayload {
    consultation_price?: number; // Prix saisi manuellement par le docteur
}
// ==========================================
// DTOs (Data Transfer Objects - Retour de l'API)
// ==========================================

/**
 * Représente une facture complète (renvoyée par GET /shared/invoices/{id})
 */
export interface InvoiceDto {
    id: number;
    patient_id: number;
    center_id: number;
    patient_visit_id: number | null;
    total_amount: number;
    status: InvoiceStatus;
    created_at: string;
    updated_at: string;

    // --- Relations optionnelles (Eager Loading) ---
    patient?: PatientDto;
    center?: CenterDto;
    patientVisit?: PatientVisitDto;
    
    // Éléments facturés
    consultations?: ConsultationDto[];
    performedMedicalActs?: PerformedMedicalActDto[];
    admissions?: AdmissionDto[];
    
    // Encaissements
    payments?: PaymentInvoiceDto[];

    // --- Champs virtuels (Accessors Laravel 'total_paid' et 'remaining_debt') ---
    total_paid?: number;      // Somme déjà versée
    remaining_debt?: number;  // Reste à payer
}

// ==========================================
// PAYLOADS & FILTRES (Données envoyées à l'API)
// ==========================================

/**
 * Payload pour la génération d'une facture
 */
export interface GenerateInvoicePayload {
    consultation_price?: number; 
}

/**
 * Filtres pour le rapport PDF des factures
 */
export interface InvoiceReportFilters {
    start_date?: string;
    end_date?: string;
    patient_id?: number | string;
    center_id?: number | string;
}