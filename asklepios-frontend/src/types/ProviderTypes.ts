// ==========================================
// DTOs POUR LA GESTION DES FOURNISSEURS
// ==========================================

/**
 * Représente un fournisseur tel qu'il est renvoyé par l'API (GET)
 */
export interface ProviderDto {
    id: number;
    hospital_id: number;
    name: string;
    phone: string | null;
    address: string | null;
    niu: string | null; // Numéro d'Identifiant Unique (Spécifique aux impôts/taxes)
    created_at?: string;
    updated_at?: string;
}

/**
 * Le format attendu par le formulaire pour créer ou modifier un fournisseur (POST / PUT)
 */
export interface ProviderPayload {
    name: string;
    phone: string | number | ''; // Tolère une chaîne vide pour faciliter le vidage du champ dans React
    address: string;
    niu: string;
}