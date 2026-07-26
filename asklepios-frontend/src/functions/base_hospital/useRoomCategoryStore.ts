import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin vers ton instance axios si nécessaire
import type { PaginatedResponse } from "../../types/types";
import type { RoomCategoryDto, RoomCategoryPayload } from "../../types/RoomCategoryTypes";

export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const useRoomCategoryStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES)
    // ======================================================
    const [roomCategories, setRoomCategories] = useState<RoomCategoryDto[]>([]);
    const [sharedRoomCategories, setSharedRoomCategories] = useState<RoomCategoryDto[]>([]); // Liste plate pour React-Select
    const [currentCategory, setCurrentCategory] = useState<RoomCategoryDto | null>(null);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // ======================================================
    // 2. ACTIONS CRUD & FILTRES
    // ======================================================

    // --- LISTER & FILTRER POUR L'ADMINISTRATEUR (Paginé) ---
    const getRoomCategories = useCallback(async (
        page: number = 1,
        filters: { search?: string; center_id?: number | string } = {},
        perPage: number = 15
    ) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<RoomCategoryDto>>("/admin/room-categories", {
                params: { page, per_page: perPage, ...filters }
            });

            setRoomCategories(res.data.data || []);
            setPagination({
                currentPage: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
                total: res.data.total || 0
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des catégories de chambres");
            }
            setRoomCategories([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- LISTER TOUT POUR LES COMPOSANTS SÉLECTEURS (Non paginé - Admin, Doctor, Reception) ---
    const getSharedRoomCategories = useCallback(async (filters: { center_id?: number | string } = {}) => {
        try {
            setLoading(true);
            const res = await api.get<RoomCategoryDto[]>("/shared/room-categories", {
                params: { paginated: 'false', ...filters }
            });
            setSharedRoomCategories(res.data);
            return res.data;
        } catch (error) {
            console.error("Erreur lors de la récupération partagée des catégories", error);
            setSharedRoomCategories([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // --- VOIR LES DÉTAILS D'UNE CATÉGORIE ---
    const getRoomCategoryById = useCallback(async (id: number) => {
        try {
            setLoading(true);
            const res = await api.get<RoomCategoryDto>(`/admin/room-categories/${id}`);
            setCurrentCategory(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de charger les détails de cette catégorie");
            setCurrentCategory(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // --- CRÉER UNE CATÉGORIE (Admin) ---
    const createRoomCategory = async (payload: RoomCategoryPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post("/admin/room-categories", payload);
            
            toast.success("Catégorie de chambre créée avec succès !");
            
            // Rafraîchir les listes après création
            await getRoomCategories(1);
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

    // --- MODIFIER UNE CATÉGORIE (Admin) ---
    const updateRoomCategory = async (id: number, payload: RoomCategoryPayload) => {
        try {
            setActionLoading(true);
            await api.put(`/admin/room-categories/${id}`, payload);
            
            toast.success("Catégorie mise à jour avec succès !");
            
            // Rafraîchir sur la page en cours
            await getRoomCategories(pagination?.currentPage || 1);
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

    // --- SUPPRIMER UNE CATÉGORIE (Admin) ---
    const deleteRoomCategory = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/room-categories/${id}`);
            
            toast.success("Catégorie de chambre supprimée");
            
            // Calcul de la page de secours si on vide complètement la page actuelle
            const currentCount = roomCategories.length;
            const currentPage = pagination?.currentPage || 1;
            const targetPage = (currentCount === 1 && currentPage > 1) ? currentPage - 1 : currentPage;
            
            await getRoomCategories(targetPage);
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
        roomCategories,
        sharedRoomCategories,
        currentCategory,
        pagination,
        loading,
        actionLoading,

        // Méthodes
        getRoomCategories,
        getSharedRoomCategories,
        getRoomCategoryById,
        createRoomCategory,
        updateRoomCategory,
        deleteRoomCategory
    };
};

export default useRoomCategoryStore;