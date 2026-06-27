import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence
import type { PaginatedResponse } from "../../types/types";
import type { EquipmentDto, EquipmentPayload } from "../../types/EquipmentTypes";

export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const useEquipmentStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES)
    // ======================================================
    const [equipment, setEquipment] = useState<EquipmentDto[]>([]);
    const [sharedEquipment, setSharedEquipment] = useState<EquipmentDto[]>([]); // Liste plate (pour Selects)
    const [maintenanceAlerts, setMaintenanceAlerts] = useState<EquipmentDto[]>([]); // Pour le dashboard
    
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // ======================================================
    // 2. ACTIONS CRUD & FILTRES
    // ======================================================

    // --- LISTER & FILTRER (Paginé - Pour l'explorateur d'équipements) ---
    const getEquipment = useCallback(async (
        departmentId: number,
        page: number = 1,
        filters: { search?: string; status?: string } = {},
        perPage: number = 15
    ) => {
        if (!departmentId) return;
        
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<EquipmentDto>>(`/shared/departments/${departmentId}/equipment`, {
                params: { page, per_page: perPage, ...filters }
            });

            setEquipment(res.data.data || []);
            setPagination({
                currentPage: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
                total: res.data.total || 0
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des équipements");
            }
            setEquipment([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- LISTER TOUT (Non paginé - Pour les formulaires / assignations) ---
    const getSharedEquipment = useCallback(async (
        departmentId: number, 
        filters: { status?: string } = {}
    ) => {
        if (!departmentId) return [];

        try {
            setLoading(true);
            const res = await api.get<EquipmentDto[]>(`/shared/departments/${departmentId}/equipment`, {
                params: { paginated: 'false', ...filters }
            });
            setSharedEquipment(res.data);
            return res.data;
        } catch (error) {
            console.error("Erreur lors de la récupération des équipements (liste complète)", error);
            setSharedEquipment([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // --- ALERTES DE MAINTENANCE ---
    const getMaintenanceAlerts = useCallback(async (departmentId: number) => {
        if (!departmentId) return [];

        try {
            setLoading(true);
            const res = await api.get<EquipmentDto[]>(`/shared/departments/${departmentId}/equipment/maintenance-alerts`);
            setMaintenanceAlerts(res.data);
            return res.data;
        } catch (error) {
            console.error("Erreur lors de la récupération des alertes de maintenance", error);
            setMaintenanceAlerts([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // --- CRÉER UN ÉQUIPEMENT ---
    const createEquipment = async (departmentId: number, payload: EquipmentPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post(`/shared/departments/${departmentId}/equipment`, payload);
            
            toast.success("Équipement ajouté avec succès !");
            
            // Rafraîchissement automatique de la liste du département concerné
            await getEquipment(departmentId, 1);
            return res.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de l'ajout de l'équipement");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- MODIFIER UN ÉQUIPEMENT ---
    const updateEquipment = async (departmentId: number, equipmentId: number, payload: EquipmentPayload) => {
        try {
            setActionLoading(true);
            await api.put(`/shared/departments/${departmentId}/equipment/${equipmentId}`, payload);
            
            toast.success("Informations de l'équipement mises à jour !");
            
            // On reste sur la même page
            await getEquipment(departmentId, pagination?.currentPage || 1);
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

    // --- SUPPRIMER UN ÉQUIPEMENT (ARCHIVAGE) ---
    const deleteEquipment = async (departmentId: number, equipmentId: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/shared/departments/${departmentId}/equipment/${equipmentId}`);
            
            toast.success("Équipement archivé avec succès.");
            
            // Gestion intelligente de la pagination après suppression
            const currentCount = equipment.length;
            const currentPage = pagination?.currentPage || 1;
            const targetPage = (currentCount === 1 && currentPage > 1) ? currentPage - 1 : currentPage;
            
            await getEquipment(departmentId, targetPage);
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de l'archivage");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        // États
        equipment,
        sharedEquipment,
        maintenanceAlerts,
        pagination,
        loading,
        actionLoading,

        // Méthodes
        getEquipment,
        getSharedEquipment,
        getMaintenanceAlerts,
        createEquipment,
        updateEquipment,
        deleteEquipment
    };
};

export default useEquipmentStore;