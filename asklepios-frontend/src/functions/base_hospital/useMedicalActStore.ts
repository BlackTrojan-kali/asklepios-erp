// src/functions/base_hospital/useMedicalActStore.ts

import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence
import type { PaginatedResponse } from "../../types/types";
import type { MedicalActDto, MedicalActPayload } from "../../types/MedicalActCatalogTypes";

export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const useMedicalActStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES)
    // ======================================================
    const [medicalActs, setMedicalActs] = useState<MedicalActDto[]>([]);
    const [sharedMedicalActs, setSharedMedicalActs] = useState<MedicalActDto[]>([]); // Liste plate (pour Selects)
    
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // ======================================================
    // 2. ACTIONS CRUD & FILTRES
    // ======================================================

    // --- LISTER & FILTRER (Paginé - Pour le tableau de gestion) ---
    const getMedicalActs = useCallback(async (
        departmentId: number,
        page: number = 1,
        filters: { search?: string } = {},
        perPage: number = 15
    ) => {
        if (!departmentId) return;
        
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<MedicalActDto>>(`/shared/departments/${departmentId}/medical-acts`, {
                params: { page, per_page: perPage, ...filters }
            });

            setMedicalActs(res.data.data || []);
            setPagination({
                currentPage: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
                total: res.data.total || 0
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des actes médicaux");
            }
            setMedicalActs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- LISTER TOUT (Non paginé - Pour les formulaires de facturation/sélection) ---
    const getSharedMedicalActs = useCallback(async (
        departmentId: number, 
        filters: { search?: string } = {}
    ) => {
        if (!departmentId) return [];

        try {
            setLoading(true);
            const res = await api.get<MedicalActDto[]>(`/shared/departments/${departmentId}/medical-acts`, {
                params: { paginated: 'false', ...filters }
            });
            setSharedMedicalActs(res.data);
            return res.data;
        } catch (error) {
            console.error("Erreur lors de la récupération du catalogue complet", error);
            setSharedMedicalActs([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // --- CRÉER UN ACTE ---
    const createMedicalAct = async (departmentId: number, payload: MedicalActPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post(`/shared/departments/${departmentId}/medical-acts`, payload);
            
            toast.success("Acte médical ajouté au catalogue avec succès !");
            
            // Rafraîchissement automatique de la liste
            await getMedicalActs(departmentId, 1);
            return res.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de l'ajout de l'acte");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- MODIFIER UN ACTE ---
    const updateMedicalAct = async (departmentId: number, actId: number, payload: MedicalActPayload) => {
        try {
            setActionLoading(true);
            await api.put(`/shared/departments/${departmentId}/medical-acts/${actId}`, payload);
            
            toast.success("Tarif et informations de l'acte mis à jour !");
            
            // On reste sur la même page après modification
            await getMedicalActs(departmentId, pagination?.currentPage || 1);
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

    // --- SUPPRIMER (ARCHIVER) UN ACTE ---
    const deleteMedicalAct = async (departmentId: number, actId: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/shared/departments/${departmentId}/medical-acts/${actId}`);
            
            toast.success("Acte médical retiré du catalogue.");
            
            // Gestion intelligente de la pagination après suppression
            const currentCount = medicalActs.length;
            const currentPage = pagination?.currentPage || 1;
            const targetPage = (currentCount === 1 && currentPage > 1) ? currentPage - 1 : currentPage;
            
            await getMedicalActs(departmentId, targetPage);
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la suppression");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        // États
        medicalActs,
        sharedMedicalActs,
        pagination,
        loading,
        actionLoading,

        // Méthodes
        getMedicalActs,
        getSharedMedicalActs,
        createMedicalAct,
        updateMedicalAct,
        deleteMedicalAct
    };
};

export default useMedicalActStore;