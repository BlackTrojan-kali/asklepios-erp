import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api";
import type { PaginatedResponse } from "../../types/types";
import type { 
    AppointmentDto, 
    AppointmentPayload, 
    ReschedulePayload, 
    AdmitToWaitingRoomPayload, 
    AdmitToConsultationPayload,
    AppointmentHistoryFilters // 👉 Nouvel import
} from "../../types/AppointmentTypes";

export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const useAppointmentStore = () => {
    const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // --- LISTER & FILTRER LES RENDEZ-VOUS (Paginé) ---
   const getAppointments = useCallback(async (
        page: number = 1,
        // 👉 AJOUT DE patient_code ICI
        filters: { 
            date?: string; 
            start_date?: string; 
            end_date?: string; 
            status?: string; 
            patient_id?: number | string; 
            profile_doctor_id?: number | string; 
            center_id?: number | string;
            patient_code?: string; 
        } = {},
        perPage: number = 15
    ) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<AppointmentDto>>("/shared/appointments", {
                params: { page, per_page: perPage, ...filters }
            });

            setAppointments(res.data.data || []);
            setPagination({
                currentPage: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
                total: res.data.total || 0
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des rendez-vous");
            }
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    }, []);
    // --- RÉCUPÉRER LES RENDEZ-VOUS D'UN PATIENT SPÉCIFIQUE (Paginé) ---
    const getPatientAppointments = useCallback(async (
        patientId: number,
        page: number = 1,
        perPage: number = 15
    ) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<AppointmentDto>>(`/shared/patients/${patientId}/appointments`, {
                params: { page, per_page: perPage }
            });

            setAppointments(res.data.data || []);
            setPagination({
                currentPage: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
                total: res.data.total || 0
            });
            return res.data;
        } catch (error) {
            toast.error("Erreur lors de la récupération de l'historique des RDV");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // --- PROGRAMMER UN NOUVEAU RENDEZ-VOUS ---
    const createAppointment = async (payload: AppointmentPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post("/shared/appointments", payload);
            toast.success("Rendez-vous programmé avec succès !");
            await getAppointments(1); 
            return res.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la programmation");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- METTRE À JOUR UN RENDEZ-VOUS ---
    const updateAppointment = async (id: number, payload: Partial<AppointmentPayload>) => {
        try {
            setActionLoading(true);
            await api.put(`/shared/appointments/${id}`, payload);
            toast.success("Détails du rendez-vous mis à jour !");
            await getAppointments(pagination?.currentPage || 1);
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la modification");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- REPROGRAMMER ---
    const rescheduleAppointment = async (id: number, payload: ReschedulePayload) => {
        try {
            setActionLoading(true);
            await api.put(`/shared/appointments/${id}/reschedule`, payload);
            toast.success("Rendez-vous reprogrammé !");
            await getAppointments(pagination?.currentPage || 1);
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la reprogrammation");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- ANNULER UN RENDEZ-VOUS ---
    const cancelAppointment = async (id: number) => {
        try {
            setActionLoading(true);
            await api.patch(`/shared/appointments/${id}/cancel`);
            toast.success("Rendez-vous annulé.");
            await getAppointments(pagination?.currentPage || 1);
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Impossible d'annuler ce rendez-vous");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- ADMISSION : ENTRÉE EN SALLE D'ATTENTE ---
    const admitToWaitingRoom = async (appointmentId: number, payload: AdmitToWaitingRoomPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post(`/shared/appointments/${appointmentId}/admit`, payload);
            toast.success("Patient admis en salle d'attente.");
            await getAppointments(pagination?.currentPage || 1);
            return res.data; 
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de l'admission");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- ADMISSION : ENTRÉE EN CONSULTATION ---
    const admitToConsultation = async (visitId: number, payload: AdmitToConsultationPayload) => {
        try {
            setActionLoading(true);
            await api.patch(`/shared/visits/${visitId}/consultation`, payload);
            toast.success("Le patient est entré en consultation.");
            await getAppointments(pagination?.currentPage || 1);
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors du transfert");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- TÉLÉCHARGER LE CALENDRIER PDF (Journée précise) ---
    const exportPdf = async (filters: { date?: string; center_id?: number | string } = {}) => {
        try {
            setActionLoading(true);
            toast.loading("Génération du calendrier en cours...", { id: "pdf-toast" });

            const response = await api.get("/shared/appointments/export-pdf", {
                params: filters,
                responseType: "blob" 
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            const dateSuffix = filters.date ? `_${filters.date}` : '';
            link.setAttribute('download', `calendrier_rendez_vous${dateSuffix}.pdf`);
            
            document.body.appendChild(link);
            link.click();
            
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Téléchargement terminé !", { id: "pdf-toast" });
            return true;
        } catch (error) {
            toast.error("Échec de la génération du PDF", { id: "pdf-toast" });
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // 👉 NOUVEAU : TÉLÉCHARGER L'HISTORIQUE PDF (Périodes & Multi-filtres) ---
    const exportHistoryPdf = async (filters: AppointmentHistoryFilters) => {
        try {
            setActionLoading(true);
            
            const response = await api.get("/shared/appointments/export-history-pdf", {
                params: filters,
                responseType: "blob" 
            });

            // Pour l'historique, on l'ouvre plutôt dans un nouvel onglet pour aperçu
            const fileUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(fileUrl, '_blank');
            
            toast.success("Rapport d'historique généré avec succès !");
            return true;
        } catch (error) {
            toast.error("Impossible de générer le rapport. Vérifiez vos filtres.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        // États
        appointments,
        pagination,
        loading,
        actionLoading,

        // Méthodes (CRUD)
        getAppointments,
        getPatientAppointments,
        createAppointment,
        updateAppointment,
        rescheduleAppointment,
        cancelAppointment,

        // Méthodes (Flux)
        admitToWaitingRoom,
        admitToConsultation,

        // Utils (PDF)
        exportPdf,
        exportHistoryPdf
    };
};

export default useAppointmentStore;