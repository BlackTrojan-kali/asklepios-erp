import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin vers ton instance Axios configurée
import type { PaginatedResponse } from "../../types/types";
import type { ReceptionistDto, ReceptionistPayload } from "../../types/ReceptionistTypes";

// Interface alignée avec tes autres stores pour la pagination
export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const useReceptionistStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES)
    // ======================================================
    const [receptionists, setReceptionists] = useState<ReceptionistDto[]>([]);
    const [currentReceptionist, setCurrentReceptionist] = useState<ReceptionistDto | null>(null);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // ======================================================
    // 2. ACTIONS CRUD & FILTRES
    // ======================================================

    // LISTER & FILTRER (Paginé) - GET /admin/receptionists
    const getReceptionists = useCallback(async (
        page: number = 1,
        filters: { search?: string; center_id?: number | string } = {},
        perPage: number = 15
    ) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<ReceptionistDto>>("/admin/receptionists", {
                params: { page, per_page: perPage, ...filters }
            });

            setReceptionists(res.data.data || []);
            setPagination({
                currentPage: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
                total: res.data.total || 0
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération de la liste des réceptionnistes");
            }
            setReceptionists([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // VOIR LES DÉTAILS - GET /admin/receptionists/{id}
    const getReceptionistById = useCallback(async (id: number) => {
        try {
            setLoading(true);
            const res = await api.get<ReceptionistDto>(`/admin/receptionists/${id}`);
            setCurrentReceptionist(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de charger les détails de ce réceptionniste");
            setCurrentReceptionist(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // CRÉER - POST /admin/receptionists
    const createReceptionist = async (payload: ReceptionistPayload) => {
        try {
            setActionLoading(true);
            await api.post("/admin/receptionists", payload);
            
            toast.success("Réceptionniste créé avec succès !");
            
            // Rafraîchir la liste et revenir à la page 1
            await getReceptionists(1);
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la création du profil");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // MODIFIER - PUT /admin/receptionists/{id}
    const updateReceptionist = async (id: number, payload: ReceptionistPayload) => {
        try {
            setActionLoading(true);
            await api.put(`/admin/receptionists/${id}`, payload);
            
            toast.success("Profil mis à jour avec succès !");
            
            // Rafraîchir la liste sur la page actuelle
            await getReceptionists(pagination?.currentPage || 1);
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

    // SUPPRIMER - DELETE /admin/receptionists/{id}
    const deleteReceptionist = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/receptionists/${id}`);
            
            toast.success("Réceptionniste supprimé du système");
            
            // Calcul de la page de secours si on supprime le dernier élément d'une page
            const currentCount = receptionists.length;
            const currentPage = pagination?.currentPage || 1;
            const targetPage = (currentCount === 1 && currentPage > 1) ? currentPage - 1 : currentPage;
            
            await getReceptionists(targetPage);
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
        receptionists,
        currentReceptionist,
        pagination,
        loading,
        actionLoading,

        // Méthodes actions
        getReceptionists,
        getReceptionistById,
        createReceptionist,
        updateReceptionist,
        deleteReceptionist
    };
};

export default useReceptionistStore;