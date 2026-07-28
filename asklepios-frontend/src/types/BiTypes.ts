// ============================================================================
// FILTRES DE RECHERCHE BI
// ============================================================================
export interface PharmacyBiFilters {
    start_date?: string;
    end_date?: string;
    center_id?: number;
    pharmacy_branch_id?: number;
    group_by?: 'date' | 'month'; // Utilisé pour les graphiques de tendances
}

// ============================================================================
// 1. KPI GLOBAUX
// ============================================================================
export interface GlobalKPIsDto {
    total_revenue: number;
    total_transactions: number;
    average_basket: number;
    gross_margin: number;
    margin_percentage: number;
}

// ============================================================================
// 2. ANALYSE DES VENTES
// ============================================================================
export interface SalesTrendDto {
    period: string; // Format YYYY-MM-DD ou YYYY-MM
    revenue: number;
    transactions: number;
}

export interface PaymentMethodStatDto {
    payment_method: 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'INSURANCE' | 'BANK_TRANSFER';
    revenue: number;
    count: number;
}

export interface PrescriptionRatioDto {
    prescription_revenue: number;
    otc_revenue: number; // OTC = Over The Counter (Vente libre)
}

export interface TopArticleDto {
    article_name: string;
    category_name: string;
    total_qty: number;
    total_revenue: number;
}

export interface SalesAnalyticsDto {
    sales_trends: SalesTrendDto[];
    payment_methods: PaymentMethodStatDto[];
    prescription_ratio: PrescriptionRatioDto;
    top_articles: TopArticleDto[];
}

// ============================================================================
// 3. VALORISATION DES STOCKS
// ============================================================================
export interface ValuationByCategoryDto {
    category_name: string;
    total_items: number;
    purchase_value: number;
}

export interface InventoryValuationDto {
    total_purchase_value: number;
    total_selling_value: number;
    potential_profit: number;
    by_category: ValuationByCategoryDto[];
}

// ============================================================================
// 4. CONFORMITÉ MINSANTE (Alertes)
// ============================================================================
export interface ExpiringBatchDto {
    branch_name: string;
    article_name: string;
    batch_number: string;
    expire_date: string;
    qty_in_stock: number;
    status: 'EXPIRED' | 'EXPIRING_SOON';
}

export interface LowStockArticleDto {
    id: number;
    name: string;
    global_min_qty: number;
    total_qty: number;
}

export interface MinsanteComplianceDto {
    expiring_batches_count: number;
    expired_batches_count: number;
    expiring_batches_list: ExpiringBatchDto[];
    low_stock_alerts_count: number;
    low_stock_articles: LowStockArticleDto[];
}