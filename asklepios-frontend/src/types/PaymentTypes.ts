// ==========================================
// IMPORT DES TYPES LIÉS
// ==========================================
import type { InvoiceDto } from './InvoiceTypes';
// import type { ProfileReceptionDto } from './UserTypes'; 

// ==========================================
// ENUMS
// ==========================================
export const PaymentMethod = {
    CASH: 'CASH',
    MOBILE_MONEY: 'MOBILE_MONEY',
    CARD: 'CARD',
    INSURANCE: 'INSURANCE',
    BANK_TRANSFER: 'BANK_TRANSFER'
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

// ==========================================
// DTOs
// ==========================================

/**
 * Représente un paiement/encaissement (renvoyé par GET /shared/payments)
 */
export interface PaymentInvoiceDto {
    id: number;
    invoice_id: number;
    reception_id: number | null;
    amount: number;
    payment_method: PaymentMethod;
    created_at: string;
    updated_at: string;

    // --- Relations optionnelles ---
    invoice?: InvoiceDto;
    reception?: any; // Remplacer 'any' par ProfileReceptionDto quand il sera créé
}

// ==========================================
// PAYLOADS
// ==========================================

/**
 * Payload pour enregistrer un nouveau paiement
 * POST /shared/payments
 */
export interface CreatePaymentPayload {
    invoice_id: number;
    amount: number;
    payment_method: PaymentMethod;
}

/**
 * Payload pour modifier un paiement existant (Admin)
 * PUT /admin/payments/{id}
 */
export interface UpdatePaymentPayload {
    amount?: number;
    payment_method?: PaymentMethod;
}