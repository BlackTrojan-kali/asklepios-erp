import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton architecture
import type { PaginatedResponse } from "../../types/types"; // Ton type générique
import type { AdmissionDto, CreateAdmissionPayload, DischargePayload } from "../../types/AdmissionTypes";

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

    // ======================================================
    // 2. ACTIONS API
    // ======================================================

    // --- LISTER & FILTRER LES HOSPITALISATIONS (Paginé) ---
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

    // --- ADMETTRE UN PATIENT (Créer une hospitalisation) ---
    const createAdmission = async (payload: CreateAdmissionPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post("/shared/admissions", payload);
            
            toast.success("Patient hospitalisé avec succès.");
            
            // On recharge la liste des admissions en cours (page 1)
            await getAdmissions(1, { status: 'ADMITTED' });
            
            return res.data.data; // Retourne l'admission créée
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Impossible d'admettre ce patient");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- AUTORISER LA SORTIE (Discharge) ---
    const dischargePatient = async (admissionId: number, payload: DischargePayload = {}) => {
        try {
            setActionLoading(true);
            const res = await api.patch(`/shared/admissions/${admissionId}/discharge`, payload);
            
            toast.success("Sortie enregistrée. Le lit est en attente de nettoyage.");
            
            // Si on est sur une vue détaillée, on met à jour l'élément courant
            if (currentAdmission?.id === admissionId) {
                setCurrentAdmission(res.data.data);
            }

            // On recharge la liste courante
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
        // États
        admissions,
        currentAdmission,
        pagination,
        loading,
        actionLoading,

        // Méthodes
        getAdmissions,
        createAdmission,
        dischargePatient
    };
};

export default useAdmissionStore;