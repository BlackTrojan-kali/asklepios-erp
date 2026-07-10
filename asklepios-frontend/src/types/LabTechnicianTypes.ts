// ==========================================
// DTOs POUR LA GESTION DES TECHNICIENS LABO
// ==========================================

import type { CenterDto, HospitalDto } from "./types";
import type { UserDto } from "./PharmTypes";

export interface LabTechnicianDto {
    id: number;
    user_id: number;
    hospital_id: number;
    center_id: number;
    speciality: string;
    specifications: string | null;
    
    // Relations
    user?: UserDto;
    center?: CenterDto;
    hospital?: HospitalDto;
    
    created_at?: string;
    updated_at?: string;
}

export interface LabTechnicianPayload {
    first_name: string;
    last_name?: string | null;
    phone: string | number;
    email: string;
    password?: string;
    
    center_id: number | '';
    speciality: string;
    specifications?: string | null;
}
