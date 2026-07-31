import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin
import type { PaginatedResponse } from "../../types/types";

// --- TYPES REQUIS ---
export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

export interface ConsultationFilters {
    hospital_id?: number;
    center_id?: number;
    department_id?: number;
    profile_doctor_id?: number;
    patient_id?: number;
    is_billed?: string | boolean; // 'true', 'false', ou vide
    start_date?: string;
    end_date?: string;
    search?: string;
}

// Adapte ce DTO selon ton modèle exact
export interface ConsultationDto {
    id: number;
    chief_complaint: string;
    consultation_price: number;
    is_billed: boolean;
    created_at: string;
    patientVisit?: {
        patient?: { id: number; first_name: string; last_name: string };
        center?: { id: number; name: string };
        consultingRoom?: { department?: { id: number; name: string } };
    };
    doctor?: {
        user?: { first_name: string; last_name: string };
    };
}

const useConsultationHistoryStore = () => {
    const [consultations, setConsultations] = useState<ConsultationDto[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [exportLoading, setExportLoading] = useState<boolean>(false);

    // --- LISTER & FILTRER L'HISTORIQUE ---
    const getConsultations = useCallback(async (
        page: number = 1,
        filters: ConsultationFilters = {},
        perPage: number = 15
    ) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<ConsultationDto>>("/admin/reports/consultations", {
                params: { page, per_page: perPage, ...filters }
            });

            setConsultations(res.data.data || []);
            setPagination({
                currentPage: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
                total: res.data.total || 0
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération de l'historique des consultations.");
            }
            setConsultations([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- TÉLÉCHARGER L'EXPORT PDF ---
    const exportConsultationsPdf = async (filters: ConsultationFilters = {}) => {
        try {
            setExportLoading(true);
            
            // L'option responseType: 'blob' est OBLIGATOIRE pour télécharger un fichier binaire
            const res = await api.get("/admin/reports/consultations/export/pdf", {
                params: filters,
                responseType: 'blob'
            });

            // Création d'une URL locale pour le fichier reçu
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            
            // Création d'un lien invisible pour forcer le téléchargement
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Rapport_Consultations_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            
            // Nettoyage
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success("Export PDF généré avec succès !");
            return true;
        } catch (error) {
            console.error("Erreur Export PDF", error);
            toast.error("Échec de la génération du PDF.");
            return false;
        } finally {
            setExportLoading(false);
        }
    };

    return {
        consultations,
        pagination,
        loading,
        exportLoading,
        getConsultations,
        exportConsultationsPdf
    };
};

export default useConsultationHistoryStore;