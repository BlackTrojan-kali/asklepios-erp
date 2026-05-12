import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton architecture
import type { 
    CenterDto, 
    CenterPayload, 
    PaginatedResponse 
} from "../../types/types";

const useCenterStore = () => {
    // --- ÉTATS ---
    const [centers, setCenters] = useState<CenterDto[]>([]);
    const [currentCenter, setCurrentCenter] = useState<CenterDto | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false); // Pour bloquer les boutons pendant la sauvegarde
    
    // Pagination
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0
    });

    // --- 1. LISTER & FILTRER (GET /admin/centers) ---
    const getCenters = useCallback(async (
        page: number = 1, 
        filters: { search?: string, address?: string, country_id?: number | string } = {}, 
        perPage: number = 10
    ) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<CenterDto>>("/admin/centers", {
                params: { page, per_page: perPage, ...filters }
            });
            
            setCenters(res.data.data);
            setPagination({
                currentPage: res.data.current_page,
                lastPage: res.data.last_page,
                total: res.data.total
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des centres");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 2. RÉCUPÉRER UN CENTRE SPÉCIFIQUE (GET /admin/centers/{id}) ---
    const getCenter = useCallback(async (id: number) => {
        try {
            setLoading(true);
            const res = await api.get<CenterDto>(`/admin/centers/${id}`);
            setCurrentCenter(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de trouver ce centre");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 3. CRÉER UN CENTRE (POST /admin/centers) ---
    const createCenter = async (payload: CenterPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post("/admin/centers", payload);
            toast.success("Centre créé avec succès !");
            await getCenters(1); // Retour à la première page pour voir le nouveau centre
            return res.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la création du centre");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 4. MODIFIER UN CENTRE (PUT /admin/centers/{id}) ---
    const updateCenter = async (id: number, payload: CenterPayload) => {
        try {
            setActionLoading(true);
            const res = await api.put(`/admin/centers/${id}`, payload);
            toast.success("Centre mis à jour avec succès !");
            await getCenters(pagination.currentPage); // Reste sur la page actuelle
            return res.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la modification");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 5. SUPPRIMER UN CENTRE (DELETE /admin/centers/{id}) ---
    const deleteCenter = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/centers/${id}`);
            toast.success("Centre supprimé avec succès !");
            
            // Si c'était le dernier élément de la page, on recule d'une page
            const isLastItemOnPage = centers.length === 1 && pagination.currentPage > 1;
            const targetPage = isLastItemOnPage ? pagination.currentPage - 1 : pagination.currentPage;
            
            await getCenters(targetPage); 
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
        centers,
        currentCenter,
        loading,
        actionLoading,
        pagination,
        getCenters,
        getCenter,
        createCenter,
        updateCenter,
        deleteCenter
    };
};

export default useCenterStore;