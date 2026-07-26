import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence
import type { PaginatedResponse } from "../../types/types";
import type { BedDto, BedPayload } from "../../types/BedTypes";

export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const useBedStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES)
    // ======================================================
    const [beds, setBeds] = useState<BedDto[]>([]);
    const [sharedBeds, setSharedBeds] = useState<BedDto[]>([]); // Liste plate
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // ======================================================
    // 2. ACTIONS CRUD & FILTRES
    // ======================================================

    // --- LISTER & FILTRER (Paginé - Pour la vue de gestion des lits) ---
    const getBeds = useCallback(async (
        roomId: number,
        page: number = 1,
        filters: { search?: string; state?: string } = {},
        perPage: number = 15
    ) => {
        if (!roomId) return;
        
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<BedDto>>(`/shared/rooms/${roomId}/beds`, {
                params: { page, per_page: perPage, ...filters }
            });

            setBeds(res.data.data || []);
            setPagination({
                currentPage: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
                total: res.data.total || 0
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des lits");
            }
            setBeds([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- LISTER TOUT (Non paginé - Pour assigner un patient à un lit par exemple) ---
    const getSharedBeds = useCallback(async (
        roomId: number, 
        filters: { state?: string } = {}
    ) => {
        if (!roomId) return [];

        try {
            setLoading(true);
            const res = await api.get<BedDto[]>(`/shared/rooms/${roomId}/beds`, {
                params: { paginated: 'false', ...filters }
            });
            setSharedBeds(res.data);
            return res.data;
        } catch (error) {
            console.error("Erreur lors de la récupération des lits (liste complète)", error);
            setSharedBeds([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // --- CRÉER UN LIT (Admin) ---
    const createBed = async (payload: BedPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post("/admin/beds", payload);
            
            toast.success("Lit ajouté avec succès !");
            
            // Rafraîchissement automatique de la liste de la salle concernée
            if (payload.facility_room_id) {
                await getBeds(Number(payload.facility_room_id), 1);
            }
            return res.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de l'ajout du lit");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- MODIFIER UN LIT (Admin) ---
    const updateBed = async (id: number, payload: BedPayload) => {
        try {
            setActionLoading(true);
            await api.put(`/admin/beds/${id}`, payload);
            
            toast.success("Informations du lit mises à jour !");
            
            // On reste sur la même page
            if (payload.facility_room_id) {
                await getBeds(Number(payload.facility_room_id), pagination?.currentPage || 1);
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

    // --- SUPPRIMER UN LIT (Admin) ---
    const deleteBed = async (id: number, currentRoomId: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/beds/${id}`);
            
            toast.success("Lit supprimé avec succès.");
            
            // Gestion intelligente de la pagination après suppression
            const currentCount = beds.length;
            const currentPage = pagination?.currentPage || 1;
            const targetPage = (currentCount === 1 && currentPage > 1) ? currentPage - 1 : currentPage;
            
            await getBeds(currentRoomId, targetPage);
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
        beds,
        sharedBeds,
        pagination,
        loading,
        actionLoading,

        // Méthodes
        getBeds,
        getSharedBeds,
        createBed,
        updateBed,
        deleteBed
    };
};

export default useBedStore;