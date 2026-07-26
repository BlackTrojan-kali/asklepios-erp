// Le type strict pour l'énumération
export type CeoRoleType = 'ceo' | 'dsi' | 'daf';

// L'interface pour l'objet ProfileCeo complet
export interface ProfileCeoDto {
    id: number;
    user_id: number;
    hospital_id: number;
    type: CeoRoleType;
    user?: any;     // À remplacer par UserDto si vous l'avez défini
    hospital?: any; // À remplacer par HospitalDto si vous l'avez défini
    created_at?: string;
    updated_at?: string;
}