import type{ ProviderDto } from "./ProviderTypes";
import type{ UserDto } from "./PharmTypes"; // Assure-toi d'avoir un type User
import type{ PharmacyBranchDto, ArticleDto } from "./PharmTypes";

// ============================================================================
// 1. COMMANDES FOURNISSEURS (PURCHASE ORDERS)
// ============================================================================

export type PurchaseOrderStatus = 'PENDING' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderLineDto {
    id: number;
    purchase_order_id: number;
    article_id: number;
    qty_ordered: number;
    qty_received: number;
    unit_cost: number | null;
    article?: ArticleDto;
    created_at?: string;
    updated_at?: string;
}

export interface PurchaseOrderDto {
    id: number;
    hospital_id: number;
    provider_id: number;
    destination_pharmacy_id: number;
    user_id: number;
    status: PurchaseOrderStatus;
    total_amount: number | null;
    provider?: ProviderDto;
    destinationPharmacy?: PharmacyBranchDto;
    user?: UserDto;
    lines?: PurchaseOrderLineDto[];
    created_at?: string;
    updated_at?: string;
}

/**
 * Payload pour la création/modification d'une commande
 */
export interface PurchaseOrderLinePayload {
    article_id: number | ''; // '' pour gérer l'état initial vide dans les select
    qty_ordered: number | '';
    unit_cost: number | '';
}

export interface PurchaseOrderPayload {
    provider_id: number | '';
    destination_pharmacy_id?: number | ''; // Optionnel (utile pour l'Admin, géré côté back pour le pharmacien)
    lines: PurchaseOrderLinePayload[];
}

/**
 * Payload pour la validation (Réception) d'une commande
 */
export interface ValidatePurchaseOrderLinePayload {
    line_id: number;
    qty_received: number | '';
    batch_number: string;
    expire_date: string; // Format YYYY-MM-DD
    storage_location_id: number | null; // L'emplacement est optionnel à la réception
}

export interface ValidatePurchaseOrderPayload {
    lines: ValidatePurchaseOrderLinePayload[];
}

// ============================================================================
// 2. RETOURS FOURNISSEURS (PURCHASE RETURNS)
// ============================================================================

export type PurchaseReturnStatus = 'PENDING' | 'SHIPPED' | 'CANCELLED';

export interface PurchaseReturnLineDto {
    id: number;
    purchase_return_id: number;
    pharmacy_branch_id: number;
    batch_id: number;
    qty_returned: number;
    reason: string | null;
    
    // Le lot complet avec l'article imbriqué
    batch?: {
        id: number;
        article_id: number;
        batch_number: string;
        article?: ArticleDto;
    };
    
    created_at?: string;
    updated_at?: string;
}
export interface PurchaseReturnDto {
    id: number;
    hospital_id: number;
    provider_id: number;
    source_pharmacy_id: number;
    purchase_order_id: number | null;
    return_date: string; // Format YYYY-MM-DD
    status: PurchaseReturnStatus;
    provider?: ProviderDto;
    sourcePharmacy?: PharmacyBranchDto;
    purchaseOrder?: PurchaseOrderDto;
    lines?: PurchaseReturnLineDto[];
    created_at?: string;
    updated_at?: string;
}

/**
 * Payload pour la création/modification d'un retour
 */
export interface PurchaseReturnLinePayload {
    article_id: number | '';
    batch_id: number | '';
    qty_returned: number | '';
    reason: string;
}

export interface PurchaseReturnPayload {
    provider_id: number | '';
    purchase_order_id?: number | ''; // Optionnel : Si le retour est lié à une commande précise
    source_pharmacy_id?: number | ''; // Pour l'Admin
    return_date: string; // Par défaut : la date du jour
    lines: PurchaseReturnLinePayload[];
}