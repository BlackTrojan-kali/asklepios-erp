// ==========================================
// IMPORT DES TYPES LIÉS (À adapter selon ton arborescence)
// ==========================================
import type { PatientDto } from './PatientTypes';
import type { CenterDto } from './types'; // Ajuste le chemin
import type { PatientVisitDto } from './AppointmentTypes';
import type { ConsultationDto, PerformedMedicalActDto } from './ConsultationTypes';
import type { AdmissionDto } from './AdmissionTypes';
import type { PaymentInvoiceDto } from './PatientTypes';
import type { PatientCoverageDto } from './InsuranceTypes'; // 👉 Nouvel import pour les assurances

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
 * Détail d'une division de facture (Tiers Payant vs Patient)
 */
export interface InvoiceSplitDto {
    id: number;
    invoice_id: number;
    type: 'PATIENT' | 'INSURANCE';
    guarantor_claim_id: number | null;
    amount_to_pay: number;
    status: InvoiceStatus;
    created_at: string;
    updated_at: string;
}

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
    
    // Encaissements et Divisions (Tiers payant)
    payments?: PaymentInvoiceDto[];
    splits?: InvoiceSplitDto[]; // 👉 NOUVEAU

    // --- Champs virtuels (Accessors Laravel) ---
    total_paid?: number;      // Somme déjà versée
    remaining_debt?: number;  // Reste à payer (Total)
    patient_part?: number;    // 👉 NOUVEAU : Ce que le patient doit payer
    insurance_part?: number;  // 👉 NOUVEAU : Prise en charge assurance
}

/**
 * Réponse de la prévisualisation avant facturation
 */
export interface UnbilledPreviewDto {
    unbilled_consultations_count: number;
    unbilled_acts_total: number;
    unbilled_admissions_total: number;
    total_without_consultation: number;
    active_coverages: PatientCoverageDto[]; // 👉 NOUVEAU : Liste des assurances actives
}

// ==========================================
// PAYLOADS & FILTRES (Données envoyées à l'API)
// ==========================================

export interface GenerateInvoicePayload {
    consultation_price?: number; 
}

export interface InvoiceReportFilters {
    start_date?: string;
    end_date?: string;
    patient_id?: number | string;
    center_id?: number | string;
}