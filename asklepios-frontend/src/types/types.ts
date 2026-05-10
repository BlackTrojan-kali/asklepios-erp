 export interface UserLoginDto {
    email:string | null,
    password:string | null,
}
// src/types/types.ts

export interface ProfileDto {
    first_name: string;
    last_name: string | null;
    role: "super_admin" | "admin" | "doctor" | "pharmacy" | "reception" | "laboratory";
    email: string;
}
export  interface CountryDto{
    
    id?: number; 
    name:string;
    code:string;
    currency:string;
}
// Interface magique pour gérer n'importe quelle réponse paginée de Laravel !
export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}