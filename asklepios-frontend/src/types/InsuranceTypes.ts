// types/InsuranceTypes.ts

export interface InsuranceCompanyDto {
    id: number;
    hospital_id: number;
    name: string;
    email: string | null;
    contact: string | null;
    created_at?: string;
    updated_at?: string;
}

// Optionnel : Type pour la création/mise à jour (exclut l'ID et les timestamps)
export interface InsuranceCompanyPayload {
    hospital_id?: number; // Requis à la création, optionnel à la mise à jour
    name: string;
    email?: string | null;
    contact?: string | null;


}

// À ajouter dans types/InsuranceTypes.ts

export interface PatientCoverageDto {
    id: number;
    patient_id: number;
    insurance_company_id: number;
    valid_until: string;
    is_active: boolean;
    policy_number: string;
    coverage_rate: number;
    created_at?: string;
    updated_at?: string;
    
    // Relations optionnelles (à typer selon vos autres DTOs si disponibles)
    insurance_company?: InsuranceCompanyDto; 
    patient?: any;
    priority_order: number; // <-- NOUVEAU CHAMP
}

export interface PatientCoveragePayload {
    patient_id?: number; // Requis à la création
    insurance_company_id?: number; // Requis à la création
    valid_until?: string;
    is_active?: boolean;
    policy_number?: string;
    coverage_rate?: number;
    priority_order?: number; // <-- NOUVEAU CHAMP
}
