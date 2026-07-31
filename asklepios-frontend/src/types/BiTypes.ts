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