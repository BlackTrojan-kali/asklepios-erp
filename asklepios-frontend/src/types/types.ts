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