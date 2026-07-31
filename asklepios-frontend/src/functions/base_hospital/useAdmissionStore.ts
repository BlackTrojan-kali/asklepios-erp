import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; 
import type { PaginatedResponse } from "../../types/types"; 
import type { AdmissionDto, CreateAdmissionPayload, DischargePayload, AdmissionFilters } from "../../types/AdmissionTypes";

export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const useAdmissionStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES)
    // ======================================================
    const [admissions, setAdmissions] = useState<AdmissionDto[]>([]);
    const [currentAdmission, setCurrentAdmission] = useState<AdmissionDto | null>(null);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [exportLoading, setExportLoading] = useState<boolean>(false); // 👉 NOUVEAU

    // ======================================================
    // 2. ACTIONS API
    // ======================================================

    // --- LISTER LES HOSPITALISATIONS (Opérationnel / CRUD) ---
    const getAdmissions = useCallback(async (
        page: number = 1,
        filters: { status?: 'ADMITTED' | 'DISCHARGED'; patient_id?: number | string } = {},
        perPage: number = 15
    ) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<AdmissionDto>>("/shared/admissions", {
                params: { page, per_page: perPage, ...filters }
            });

            setAdmissions(res.data.data || []);
            setPagination({
                currentPage: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
                total: res.data.total || 0
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des admissions");
            }
            setAdmissions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 👉 NOUVEAU : LISTER L'HISTORIQUE (Reporting) ---
    const getAdmissionHistory = useCallback(async (
        page: number = 1,
        filters: AdmissionFilters = {},
        perPage: number = 15
    ) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<AdmissionDto>>("/admin/reports/admissions", {
                params: { page, per_page: perPage, ...filters }
            });

            setAdmissions(res.data.data || []);
            setPagination({
                currentPage: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
                total: res.data.total || 0
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération de l'historique.");
            }
            setAdmissions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 👉 NOUVEAU : EXPORTER L'HISTORIQUE EN PDF ---
    const exportAdmissionsPdf = async (filters: AdmissionFilters = {}) => {
        try {
            setExportLoading(true);
            
            // responseType: 'blob' est obligatoire pour les fichiers
            const res = await api.get("/admin/reports/admissions/export/pdf", {
                params: filters,
                responseType: 'blob'
            });

            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Rapport_Hospitalisations_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success("Rapport PDF généré avec succès !");
            return true;
        } catch (error) {
            console.error("Erreur Export PDF", error);
            toast.error("Échec de la génération du PDF.");
            return false;
        } finally {
            setExportLoading(false);
        }
    };

    // --- ADMETTRE UN PATIENT ---
    const createAdmission = async (payload: CreateAdmissionPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post("/shared/admissions", payload);
            toast.success("Patient hospitalisé avec succès.");
            await getAdmissions(1, { status: 'ADMITTED' });
            return res.data.data; 
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Impossible d'admettre ce patient");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- AUTORISER LA SORTIE ---
    const dischargePatient = async (admissionId: number, payload: DischargePayload = {}) => {
        try {
            setActionLoading(true);
            const res = await api.patch(`/shared/admissions/${admissionId}/discharge`, payload);
            toast.success("Sortie enregistrée. Le lit est en attente de nettoyage.");
            if (currentAdmission?.id === admissionId) {
                setCurrentAdmission(res.data.data);
            }
            await getAdmissions(pagination?.currentPage || 1);
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la sortie du patient");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        admissions,
        currentAdmission,
        pagination,
        loading,
        actionLoading,
        exportLoading, // NOUVEAU

        getAdmissions,
        getAdmissionHistory, // NOUVEAU
        exportAdmissionsPdf, // NOUVEAU
        createAdmission,
        dischargePatient
    };
};

export default useAdmissionStore;