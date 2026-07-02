// ==========================================
// ENUMS & TYPES POUR LE REPORTING
// ==========================================

export const ReportType = {
    INVOICES: 'INVOICES', // Factures (CA global)
    PAYMENTS: 'PAYMENTS', // Encaissements (Trésorerie)
    DEBTS: 'DEBTS'        // Créances clients (Impayés)
} as const;

export type ReportType = (typeof ReportType)[keyof typeof ReportType];

/**
 * Payload pour demander un rapport financier
 * GET /shared/reports/finance?report_type=...
 */
export interface FinancialReportFilters {
    report_type: ReportType;
    start_date?: string; // Format YYYY-MM-DD
    end_date?: string;   // Format YYYY-MM-DD
    center_id?: number;  // Spécifique Admin
}