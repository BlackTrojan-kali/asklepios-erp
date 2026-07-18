// ==========================================
// DTOs POUR LA GESTION DES TECHNICIENS LABO
// ==========================================

import type { CenterDto, HospitalDto } from "./types";
import type { UserDto } from "./PharmTypes";

export interface LabPersonnelDto {
    id: number;
    user_id: number;
    hospital_id: number;
    laboratory_id: number;
    lab_roles: string[];
    speciality: string;
    specifications: string | null;
    
    // Relations
    user?: UserDto;
    laboratory?: any;
    hospital?: HospitalDto;
    
    created_at?: string;
    updated_at?: string;
}

export interface LabPersonnelPayload {
    first_name: string;
    last_name?: string | null;
    phone: string | number;
    email: string;
    password?: string;
    
    laboratory_id: number | string;
    lab_roles: string[];
    speciality: string;
    specifications?: string | null;
}
