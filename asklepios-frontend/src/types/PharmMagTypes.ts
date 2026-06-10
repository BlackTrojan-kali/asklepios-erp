// ============================================================================
// DTOs POUR LA GESTION DE L'ESPACE ET DE L'AMÉNAGEMENT (STORAGE LOCATIONS)
// ============================================================================

/**
 * Représente une zone ou un emplacement de rangement physique renvoyé par l'API (GET)
 */
export interface StorageLocationDto {
    id: number;
    pharmacy_branch_id: number;
    aisle: string | null; // Allée (ex: "Allée A")
    shelf: string | null; // Étagère / Rayon (ex: "Étagère 3")
    code: string | null;  // Code unique ou code-barres de la zone (ex: "A-3")
    created_at?: string;
    updated_at?: string;
}

/**
 * Le format attendu par le formulaire pour créer ou modifier un emplacement (POST / PUT)
 */
export interface StorageLocationPayload {
    aisle: string;
    shelf: string;
    code: string;
}

/**
 * Le format requis pour l'affectation ou le rangement d'un article en stock (POST)
 */
export interface AssignStockPayload {
    stock_id: number;
    storage_location_id: number | null; // null permet de désassigner (retirer du rayon)
}