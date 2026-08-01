// ======================================================
// FILTRES GLOBAUX BI
// ======================================================
export interface BiStockFilters {
    hospital_id?: number | string;
    pharmacy_branch_id?: number | string;
    category_id?: number | string;
    article_id?: number | string; // 👉 NOUVEAU
    start_date?: string;
    end_date?: string;
    days?: number;
}

// 👉 NOUVELLE INTERFACE
export interface LowStockDetailsDto {
    id: number;
    article_name: string;
    category_name: string;
    global_min_qty: number;
    current_qty: number;
}
// ... gardez le reste identique
// ======================================================
// DTOs DES RÉSULTATS BI (Data Transfer Objects)
// ======================================================

export interface StockKpisDto {
    total_stock_value: number;
    expired_stock_value: number;
    loss_percentage: number;
    articles_in_low_stock: number;
}

export interface ValuationByCategoryDto {
    category_name: string;
    total_value: number;
    distinct_articles: number;
}

export interface ExpiringStockDto {
    article_name: string;
    batch_number: string;
    pharmacy_name: string;
    qty: number;
    expire_date: string;
    risk_value: number;
}

export interface MovementTrendDto {
    date: string;
    ENTRY: number;
    EXIT: number;
}

// ======================================================
// FILTRES GLOBAUX BI (Communs à Stock et Finance)
// ======================================================
export interface BiFinanceFilters {
    hospital_id?: number | string;
    pharmacy_branch_id?: number | string;
    start_date?: string; // Format YYYY-MM-DD
    end_date?: string;   // Format YYYY-MM-DD
}

// ======================================================
// DTOs DES RÉSULTATS BI FINANCE
// ======================================================

export interface FinanceKpisDto {
    total_revenue: number;
    total_sales: number;
    average_basket: number;
    total_treasury: number;
}

export interface RevenueTrendDto {
    date: string;
    daily_revenue: number;
}

export interface RevenueByPaymentMethodDto {
    name: string; // CASH, MOBILE_MONEY, CARD
    value: number;
}

export interface RevenueByCategoryDto {
    category_name: string;
    revenue: number;
}

export interface TopArticleDto {
    article_name: string;
    total_qty: number;
    revenue: number;
}

export interface CashFlowDto {
    type: 'cash_in' | 'cash_out' | 'transfer';
    total_amount: number;
}
// ======================================================
// FILTRES GLOBAUX BI ACTIVITÉS (Hôpital / Centres)
// ======================================================
export interface BiActivityFilters {
    hospital_id?: number | string;
    center_id?: number | string; // Remplace pharmacy_branch_id pour cette vue
    start_date?: string; // Format YYYY-MM-DD
    end_date?: string;   // Format YYYY-MM-DD
}

// ======================================================
// DTOs DES RÉSULTATS BI ACTIVITÉS DE L'HÔPITAL
// ======================================================

export interface ActivityKpisDto {
    total_visits: number;
    emergency_visits: number;
    total_consultations: number;
    total_medical_acts: number;
    total_admissions: number;
    admission_rate: number;
}

export interface VisitTrendDto {
    date: string;
    ROUTINE: number;
    EMERGENCY: number;
    FOLLOW_UP: number;
}

export interface DoctorConsultationDto {
    first_name: string;
    last_name: string;
    speciality: string;
    total_consultations: number;
}

export interface TopMedicalActDto {
    act_name: string;
    total_performed: number;
}

export interface ActiveAdmissionDto {
    first_name: string;
    last_name: string;
    patient_code: string;
    admission_date: string;
    reason_for_admission: string;
    bed_number: string;
    room_name: string;
    days_admitted: number;
}

// ======================================================
// FILTRES GLOBAUX BI FINANCE HÔPITAL
// ======================================================
export interface BiHospitalFinanceFilters {
    hospital_id?: number | string;
    center_id?: number | string;
    start_date?: string; // Format YYYY-MM-DD
    end_date?: string;   // Format YYYY-MM-DD
}

// ======================================================
// DTOs DES RÉSULTATS BI FINANCE HÔPITAL
// ======================================================

export interface HospitalFinanceKpisDto {
    total_invoiced: number;
    total_collected: number;
    total_outstanding: number;
    patient_expected_share: number;
    insurance_expected_share: number;
    collection_rate: number;
}

export interface HospitalRevenueTrendDto {
    date: string;
    daily_revenue: number;
}

export interface RevenueByServiceDto {
    service_name: string;
    revenue: number;
}

export interface HospitalPaymentMethodDto {
    name: string; // Ex: CASH, MOBILE_MONEY...
    value: number;
}

export interface InsuranceClaimStatusDto {
    insurance_name: string;
    DRAFT: number;
    SUBMITTED: number;
    PAID: number;
    DISPUTED: number;
}