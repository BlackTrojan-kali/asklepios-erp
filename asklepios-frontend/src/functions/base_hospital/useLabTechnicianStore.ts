import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api";
import type { PaginatedResponse } from "../../types/types";
import type { LabTechnicianDto, LabTechnicianPayload } from "../../types/LabTechnicianTypes";

export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const useLabTechnicianStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES)
    // ======================================================
    const [technicians, setTechnicians] = useState<LabTechnicianDto[]>([]);
    const [allTechnicians, setAllTechnicians] = useState<LabTechnicianDto[]>([]);
    const [currentTechnician, setCurrentTechnician] = useState<LabTechnicianDto | null>(null);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // ======================================================
    // 2. ACTIONS CRUD & FILTRES
    // ======================================================

    const getTechnicians = useCallback(async (
        page: number = 1,
        filters: { search?: string; center_id?: number | string; } = {},
        perPage: number = 15
    ) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<LabTechnicianDto>>("/admin/lab-technicians", {
                params: { page, per_page: perPage, ...filters }
            });

            setTechnicians(res.data.data || []);
            setPagination({
                currentPage: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
                total: res.data.total || 0
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des techniciens");
            }
            setTechnicians([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const getAllTechnicians = useCallback(async (filters: { center_id?: number | string } = {}) => {
        try {
            const res = await api.get<LabTechnicianDto[]>("/admin/lab-technicians", {
                params: { paginated: 'false', ...filters }
            });
            setAllTechnicians(res.data);
            return res.data;
        } catch (error) {
            console.error("Erreur lors de la récupération de la liste complète des techniciens", error);
            setAllTechnicians([]);
            return [];
        }
    }, []);

    const getTechnicianById = useCallback(async (id: number) => {
        try {
            setLoading(true);
            const res = await api.get<LabTechnicianDto>(`/admin/lab-technicians/${id}`);
            setCurrentTechnician(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de charger les détails de ce technicien");
            setCurrentTechnician(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createTechnician = async (payload: LabTechnicianPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post("/admin/lab-technicians", payload);
            
            toast.success("Profil technicien créé avec succès !");
            
            await getTechnicians(1);
            await getAllTechnicians();
            
            return res.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la création du profil");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const updateTechnician = async (id: number, payload: LabTechnicianPayload) => {
        try {
            setActionLoading(true);
            await api.put(`/admin/lab-technicians/${id}`, payload);
            
            toast.success("Profil mis à jour avec succès !");
            
            await getTechnicians(pagination?.currentPage || 1);
            await getAllTechnicians();
            
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

    const deleteTechnician = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/lab-technicians/${id}`);
            
            toast.success("Profil technicien supprimé");
            
            const currentCount = technicians.length;
            const currentPage = pagination?.currentPage || 1;
            const targetPage = (currentCount === 1 && currentPage > 1) ? currentPage - 1 : currentPage;
            
            await getTechnicians(targetPage);
            await getAllTechnicians();
            
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
        technicians,
        allTechnicians,
        currentTechnician,
        pagination,
        loading,
        actionLoading,

        getTechnicians,
        getAllTechnicians,
        getTechnicianById,
        createTechnician,
        updateTechnician,
        deleteTechnician
    };
};

export default useLabTechnicianStore;
