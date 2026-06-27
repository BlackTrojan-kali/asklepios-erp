import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence
import type { PaginatedResponse } from "../../types/types";
import type { FacilityRoomDto, FacilityRoomPayload } from "../../types/FacilityRoomTypes";

export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const useFacilityRoomStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES)
    // ======================================================
    const [facilityRooms, setFacilityRooms] = useState<FacilityRoomDto[]>([]);
    const [sharedFacilityRooms, setSharedFacilityRooms] = useState<FacilityRoomDto[]>([]); // Liste plate pour React-Select
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // ======================================================
    // 2. ACTIONS CRUD & FILTRES
    // ======================================================

    // --- LISTER & FILTRER (Paginé - Pour la vue "Explorateur") ---
    const getFacilityRooms = useCallback(async (
        departmentId: number,
        page: number = 1,
        filters: { search?: string; type?: string } = {},
        perPage: number = 15
    ) => {
        if (!departmentId) return;
        
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<FacilityRoomDto>>(`/shared/departments/${departmentId}/facility-rooms`, {
                params: { page, per_page: perPage, ...filters }
            });

            setFacilityRooms(res.data.data || []);
            setPagination({
                currentPage: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
                total: res.data.total || 0
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des salles");
            }
            setFacilityRooms([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- LISTER TOUT POUR LES SÉLECTEURS (Non paginé) ---
    const getSharedFacilityRooms = useCallback(async (
        departmentId: number, 
        filters: { type?: string } = {}
    ) => {
        if (!departmentId) return [];

        try {
            setLoading(true);
            const res = await api.get<FacilityRoomDto[]>(`/shared/departments/${departmentId}/facility-rooms`, {
                params: { paginated: 'false', ...filters }
            });
            setSharedFacilityRooms(res.data);
            return res.data;
        } catch (error) {
            console.error("Erreur lors de la récupération des salles (liste complète)", error);
            setSharedFacilityRooms([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // --- CRÉER UNE SALLE (Admin) ---
    const createFacilityRoom = async (payload: FacilityRoomPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post("/admin/facility-rooms", payload);
            
            toast.success("Salle créée avec succès !");
            
            // Rafraîchissement automatique de la liste du département concerné
            if (payload.department_id) {
                await getFacilityRooms(Number(payload.department_id), 1);
            }
            return res.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la création");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- MODIFIER UNE SALLE (Admin) ---
    const updateFacilityRoom = async (id: number, payload: FacilityRoomPayload) => {
        try {
            setActionLoading(true);
            await api.put(`/admin/facility-rooms/${id}`, payload);
            
            toast.success("Salle mise à jour avec succès !");
            
            // On reste sur la même page
            if (payload.department_id) {
                await getFacilityRooms(Number(payload.department_id), pagination?.currentPage || 1);
            }
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

    // --- SUPPRIMER UNE SALLE (Admin) ---
    const deleteFacilityRoom = async (id: number, currentDepartmentId: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/facility-rooms/${id}`);
            
            toast.success("Salle supprimée avec succès.");
            
            // Gestion intelligente de la pagination après suppression
            const currentCount = facilityRooms.length;
            const currentPage = pagination?.currentPage || 1;
            const targetPage = (currentCount === 1 && currentPage > 1) ? currentPage - 1 : currentPage;
            
            await getFacilityRooms(currentDepartmentId, targetPage);
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

    // --- SYNCHRONISER LES SALLES D'ATTENTE (Admin) ---
    const syncWaitingRooms = async () => {
        try {
            setActionLoading(true);
            const res = await api.post("/admin/facility-rooms/sync-waiting-rooms");
            
            toast.success(`${res.data.rooms_created} salle(s) d'attente générée(s) !`);
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la synchronisation");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        // États
        facilityRooms,
        sharedFacilityRooms,
        pagination,
        loading,
        actionLoading,

        // Méthodes
        getFacilityRooms,
        getSharedFacilityRooms,
        createFacilityRoom,
        updateFacilityRoom,
        deleteFacilityRoom,
        syncWaitingRooms
    };
};

export default useFacilityRoomStore;