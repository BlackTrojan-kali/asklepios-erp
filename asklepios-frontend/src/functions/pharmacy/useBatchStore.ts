import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence
import type { BatchDto, BatchPayload } from "../../types/PharmTypes";

// Interface pour la pagination
export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const useBatchStore = () => {
    // --- ÉTATS ---
    const [batches, setBatches] = useState<BatchDto[]>([]);
    const [allBatches, setAllBatches] = useState<BatchDto[]>([]); // Liste complète pour les select
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // --- 1. LISTER & FILTRER Paginé (GET /admin/batches) ---
    const getBatches = useCallback(async (
        page: number = 1,
        filters: { search?: string, article_id?: number | string } = {}
    ) => {
        try {
            setLoading(true);
            const res = await api.get("/admin/batches", {
                params: { page, ...filters }
            });
            
            // Sécurisation de la réponse (paginée ou non)
            const responseData = res.data;
            const batchesData = responseData.data !== undefined ? responseData.data : responseData;
            
            setBatches(Array.isArray(batchesData) ? batchesData : []);
            
            setPagination({
                currentPage: responseData.current_page || 1,
                lastPage: responseData.last_page || 1,
                total: responseData.total || (Array.isArray(batchesData) ? batchesData.length : 0)
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des lots");
            }
            setBatches([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 1bis. RÉCUPÉRER TOUS LES LOTS (GET /admin/batches/all) ---
    const getAllBatches = useCallback(async (filters: { article_id?: number | string } = {}) => {
        try {
            const res = await api.get("/admin/batches/all", {
                params: filters
            });
            setAllBatches(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Erreur lors de la récupération de la liste complète des lots", error);
            setAllBatches([]);
        }
    }, []);

    // --- 2. CRÉER UN LOT (POST /admin/batches) ---
    const createBatch = async (payload: BatchPayload) => {
        try {
            setActionLoading(true);
            await api.post("/admin/batches", payload);
            
            toast.success("Lot enregistré avec succès !");
            
            // Rafraîchir les listes
            await getBatches(1); 
            await getAllBatches();
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la création du lot");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 3. MODIFIER UN LOT (PUT /admin/batches/{id}) ---
    const updateBatch = async (id: number, payload: BatchPayload) => {
        try {
            setActionLoading(true);
            await api.put(`/admin/batches/${id}`, payload);
            
            toast.success("Lot mis à jour avec succès !");
            
            // Rafraîchir les listes
            await getBatches(1); 
            await getAllBatches();
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

    // --- 4. SUPPRIMER UN LOT (DELETE /admin/batches/{id}) ---
    const deleteBatch = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/batches/${id}`);
            
            toast.success("Lot supprimé avec succès !");
            
            // Rafraîchir les listes
            await getBatches(1); 
            await getAllBatches();
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

    // =========================================================================
    // FONCTIONS : INITIALISATION DES STOCKS
    // =========================================================================

    // --- 5. INITIALISER TOUS LES STOCKS (POST /admin/batches/initialize-all-stocks) ---
    const initializeAllStocks = async () => {
        try {
            setActionLoading(true);
            const res = await api.post("/admin/batches/initialize-all-stocks");
            
            toast.success(res.data.message || "Stocks globaux synchronisés avec succès !");
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la synchronisation des stocks");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 6. INITIALISER LE STOCK D'UN LOT SPÉCIFIQUE (POST /admin/batches/{id}/initialize-stock) ---
    const initializeBatchStock = async (id: number) => {
        try {
            setActionLoading(true);
            const res = await api.post(`/admin/batches/${id}/initialize-stock`);
            
            toast.success(res.data.message || "Stock du lot synchronisé avec succès !");
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la synchronisation de ce lot");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        batches,
        allBatches, // Exporté pour les select
        pagination,
        loading,
        actionLoading,
        getBatches,
        getAllBatches,
        createBatch,
        updateBatch,
        deleteBatch,
        initializeAllStocks, 
        initializeBatchStock 
    };
};

export default useBatchStore;