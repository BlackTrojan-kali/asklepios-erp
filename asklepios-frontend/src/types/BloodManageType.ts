// ======================================================
// DTOs (Données reçues de l'API)
// ======================================================

export interface BloodRefrigeratorDto {
    id: number;
    center_id: number;
    name: string;
    target_temperature: number;
    status: string; // Ex: ACTIVE, MAINTENANCE, OUT_OF_SERVICE
    center?: {      // Relation renvoyée par le "with('center')" du backend
        id: number;
        hospital_id: number;
        name: string;
    };
    created_at: string;
    updated_at: string;
}

export interface PaginatedBloodRefrigerators {
    current_page: number;
    data: BloodRefrigeratorDto[];
    last_page: number;
    total: number;
    per_page: number;
}

// ======================================================
// PAYLOADS (Données envoyées à l'API)
// ======================================================

export interface BloodRefrigeratorPayload {
    center_id: number;
    name: string;
    target_temperature: number;
    status: string;
}

// ======================================================
// FILTRES DE RECHERCHE
// ======================================================

export interface BloodRefrigeratorFilters {
    center_id?: number | string;
    hospital_id?: number | string;
    status?: string;
    search?: string;
    page?: number;
    per_page?: number;
}

// ======================================================
// DTOs DONNEURS (Données reçues de l'API)
// ======================================================

export interface BloodDonorDto {
    id: number;
    center_id: number;
    first_name: string;
    last_name: string | null;
    gender: 'M' | 'F';
    birth_date: string;
    blood_bags?: BloodBagDto[]; 
    blood_type: string;
    phone_contact: string;
    last_donation_date: string | null;
    serology_status: 'PENDING' | 'CLEARED' | 'REJECTED';
    center?: {
        id: number;
        hospital_id: number;
        name: string;
    };
    created_at: string;
    updated_at: string;
}

export interface PaginatedBloodDonors {
    current_page: number;
    data: BloodDonorDto[];
    last_page: number;
    total: number;
    per_page: number;
}

// ======================================================
// PAYLOADS DONNEURS (Données envoyées à l'API)
// ======================================================

export interface BloodDonorPayload {
    center_id: number;
    first_name: string;
    last_name?: string | null;
    gender: 'M' | 'F';
    birth_date: string;
    blood_type: string;
    phone_contact: string;
    last_donation_date?: string | null;
    serology_status?: 'PENDING' | 'CLEARED' | 'REJECTED';
}

// ======================================================
// FILTRES DE RECHERCHE DONNEURS
// ======================================================

export interface BloodDonorFilters {
    center_id?: number | string;
    hospital_id?: number | string;
    blood_type?: string;
    serology_status?: string;
    search?: string;
    page?: number;
    per_page?: number;
}
// ======================================================
// DTOs POCHES DE SANG (Données reçues de l'API)
// ======================================================

export interface BloodBagDto {
    id: number;
    center_id: number;
    blood_refrigerator_id: number;
    blood_donor_id: number | null;
    blood_type: string;
    volume_ml: number;
    collection_date: string;
    expiry_date: string;
    external_supplier: string | null;
    type: 'WHOLE_BLOOD' | 'RED_CELLS' | 'PLASMA';
    barcode: string | null;
    status: 'QUARANTINE' | 'AVAILABLE' | 'USED' | 'EXPIRED';
    
    // Relations
    center?: {
        id: number;
        name: string;
    };
    blood_refrigerator?: {
        id: number;
        name: string;
    };
    blood_donor?: {
        id: number;
        first_name: string;
        last_name: string | null;
    };
    
    created_at: string;
    updated_at: string;
}

export interface PaginatedBloodBags {
    current_page: number;
    data: BloodBagDto[];
    last_page: number;
    total: number;
    per_page: number;
}

// ======================================================
// PAYLOADS POCHES DE SANG (Création / Modification)
// ======================================================

export interface BloodBagPayload {
    center_id: number;
    blood_refrigerator_id: number;
    blood_donor_id?: number | null;
    blood_type: string;
    volume_ml: number;
    collection_date: string;
    expiry_date: string;
    external_supplier?: string | null;
    type: 'WHOLE_BLOOD' | 'RED_CELLS' | 'PLASMA';
    barcode?: string | null;
    status: 'QUARANTINE' | 'AVAILABLE' | 'USED' | 'EXPIRED';
}

// ======================================================
// FILTRES DE RECHERCHE POCHES DE SANG
// ======================================================

export interface BloodBagFilters {
    center_id?: number | string;
    hospital_id?: number | string;
    blood_refrigerator_id?: number | string;
    blood_type?: string;
    type?: string;
    status?: string;
    search?: string;
    page?: number;
    per_page?: number;
}
// ======================================================
// DTOs & PAYLOADS : TARIFICATION DES POCHES (BagCenter)
// ======================================================

export interface BagPricingDto {
    id: number;
    center_id: number;
    blood_type: string;
    price: number;
    center?: {
        id: number;
        name: string;
    };
    created_at: string;
    updated_at: string;
}

export interface BagPricingPayload {
    center_id: number;
    blood_type: string;
    price: number;
}

export interface BagPricingFilters {
    center_id?: number | string;
}

// ======================================================
// DTOs & PAYLOADS : TRANSFUSIONS (BloodTransfusion)
// ======================================================

export interface BloodTransfusionDto {
    id: number;
    consultation_id: number;
    center_id: number;
    blood_bag_id: number;
    start_time: string;
    end_time: string | null;
    status: 'ON_GOING' | 'FINISHED';
    is_billed: boolean;
    
    // Relations
    blood_bag?: BloodBagDto; // Utilise le DTO de poche de sang déjà créé
    consultation?: any; // Remplacez "any" par votre DTO Consultation existant si vous l'avez (ex: ConsultationDto)
    center?: {
        id: number;
        name: string;
    };

    created_at: string;
    updated_at: string;
}

export interface BloodTransfusionPayload {
    consultation_id: number;
    center_id: number;
    blood_bag_id: number;
    start_time?: string; // Optionnel, le backend met now() par défaut
}

export interface BloodTransfusionFilters {
    consultation_id?: number | string;
}

// ======================================================
// FILTRES : SUIVI DES TRANSFUSIONS
// ======================================================
export interface BloodTrackingFilters {
    status?: string;
    start_date?: string;
    end_date?: string;
    blood_type?: string;
}

// ======================================================
// DTO : SUIVI DES TRANSFUSIONS (Avec relations profondes)
// ======================================================
export interface BloodTrackingDto {
    id: number;
    consultation_id: number;
    center_id: number;
    blood_bag_id: number;
    start_time: string;
    end_time: string | null;
    status: 'ON_GOING' | 'FINISHED';
    is_billed: boolean;
    created_at: string;

    // Relations
    blood_bag?: {
        id: number;
        blood_type: string;
        type: string;
        volume_ml: number;
        barcode: string;
    };
    center?: {
        id: number;
        name: string;
    };
    consultation?: {
        id: number;
        profile_doctor?: {
            id: number;
            user?: {
                id: number;
                first_name: string;
                last_name: string;
            };
        };
        // Le patient peut venir d'une visite classique
        patient_visit?: {
            id: number;
            patient?: {
                id: number;
                patient_code: string;
                first_name: string;
                last_name: string;
            };
        };
        // Ou d'une hospitalisation
        admission?: {
            id: number;
            patient?: {
                id: number;
                patient_code: string;
                first_name: string;
                last_name: string;
            };
        };
    };
}