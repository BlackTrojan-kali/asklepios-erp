import type { PatientDto } from './PatientTypes';
import type { FacilityRoomDto } from './FacilityRoomTypes';
import type { DoctorDto } from './DoctorTypes';
import type { PatientVisitDto } from './AppointmentTypes';

export type AdmissionStatus = 'ADMITTED' | 'DISCHARGED';
export type BedState = 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';

export interface BedDto {
    id: number;
    facility_room_id: number;
    bed_number: string;
    state: BedState;
    facilityRoom?: FacilityRoomDto; // Si tu as besoin d'afficher le nom de la salle
    created_at: string;
    updated_at: string;
}

export interface AdmissionDto {
    id: number;
    patient_id: number;
    patient_visit_id: number | null;
    profile_doctor_id: number | null;
    bed_id: number;
    reason_for_admission: string;
    discharge_notes: string | null;
    admission_date: string; // ISO 8601 string
    expected_discharge_date: string | null;
    actual_discharge_date: string | null;
    status: AdmissionStatus;
    is_billed: boolean;
    invoice_id: number | null;
    created_at: string;
    updated_at: string;

    // Relations (chargées via le "with" du contrôleur)
    patient?: PatientDto;
    bed?: BedDto;
    doctor?: DoctorDto;
    patientVisit?: PatientVisitDto;
}

export interface CreateAdmissionPayload {
    patient_id: number;
    bed_id: number;
    reason_for_admission: string;
    patient_visit_id?: number | null; // Optionnel (utile si l'admission vient d'une consultation en cours)
    profile_doctor_id?: number | null; // Optionnel (Le médecin en charge)
    expected_discharge_date?: string | null; // YYYY-MM-DD
}

export interface DischargePayload {
    discharge_notes?: string;
}