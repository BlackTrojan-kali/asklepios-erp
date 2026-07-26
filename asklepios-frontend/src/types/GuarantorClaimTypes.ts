// Imports des types liés (ajustez les chemins selon votre structure)
import type { CenterDto } from './types';
import type { InsuranceCompanyDto } from './InsuranceTypes';
import type { InvoiceSplitDto } from './InvoiceTypes';

// --- ENUMS ---
export const GuarantorClaimStatus = {
    DRAFT: 'DRAFT',
    SUBMITTED: 'SUBMITTED',
    PAID: 'PAID',
    DISPUTED: 'DISPUTED'
} as const;

export type GuarantorClaimStatus = (typeof GuarantorClaimStatus)[keyof typeof GuarantorClaimStatus];

// --- DTOs (Retour de l'API) ---

/**
 * Représente un bordereau de réclamation complet
 */
export interface GuarantorClaimDto {
    id: number;
    center_id: number;
    insurance_company_id: number;
    claim_month: string; // Format YYYY-MM-DD
    total_claim_amount: number;
    status: GuarantorClaimStatus;
    claim_refence: string | null; // (Avec la faute de frappe issue de la migration)
    created_at: string;
    updated_at: string;

    // Champs virtuels (Agrégations)
    invoice_splits_count?: number;

    // Relations optionnelles (Eager Loading)
    insuranceCompany?: InsuranceCompanyDto;
    center?: CenterDto;
    invoiceSplits?: InvoiceSplitDto[]; // Les lignes de facture liées
}

// --- PAYLOADS (Envoi vers l'API) ---

/**
 * Payload pour la création d'un bordereau
 * POST /shared/guarantor-claims
 */
export interface CreateGuarantorClaimPayload {
    insurance_company_id: number;
    claim_month: string; // YYYY-MM-DD
    split_ids: number[]; // Tableau des IDs des InvoiceSplits (Parts assurance impayées)
}

/**
 * Payload pour la mise à jour d'un bordereau
 * PUT /shared/guarantor-claims/{id}
 */
export interface UpdateGuarantorClaimPayload {
    status?: GuarantorClaimStatus;
    claim_refence?: string | null;
}

/**
 * Filtres pour la recherche/pagination
 */
export interface GuarantorClaimFilters {
    center_id?: number | string;
    insurance_company_id?: number | string;
    status?: string;
    claim_month?: string; // Format YYYY-MM
}