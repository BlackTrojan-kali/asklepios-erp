import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin si nécessaire
import type { StockDto } from "../../types/StockTypes";

// Interface pour calquer les métadonnées de pagination retournées par Laravel
export interface PaginationDto {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

// Structure globale d'une réponse paginée sous Laravel
interface LaravelPaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

// Type pour les filtres acceptant la pagination
interface StockFilters {
    search?: string;
    branch_id?: number | string;
    article_id?: number | string;
    page?: number;
    per_page?: number;
}

const useStockStore = () => {
    // --- ÉTATS ---
    const [stocks, setStocks] = useState<StockDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    
    // Nouvel état pour gérer la pagination globale ou locale
    const [pagination, setPagination] = useState<PaginationDto>({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0
    });

    // --- 1. VUE GLOBALE (ADMIN/SUPERVISEUR) ---
    // GET /admin/stocks/global
    const getGlobalStocks = useCallback(async (filters: StockFilters = {}) => {
        try {
            setLoading(true);
            
            // Le type attendu passe de StockDto[] à LaravelPaginatedResponse<StockDto>
            const res = await api.get<LaravelPaginatedResponse<StockDto>>("/admin/stocks/global", {
                params: filters
            });
            
            // Sous Laravel paginate(), les lignes sont dans res.data.data
            setStocks(res.data.data);
            
            // Mise à jour des métadonnées de pagination
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                per_page: res.data.per_page,
                total: res.data.total
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la récupération des stocks globaux.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 2. VUE LOCALE (PHARMACIEN/VENDEUR) ---
    // GET /pharmacy/stocks/my-branch
    const getMyBranchStocks = useCallback(async (
        filters: Omit<StockFilters, 'branch_id'> = {}
    ) => {
        try {
            setLoading(true);
            
            const res = await api.get<LaravelPaginatedResponse<StockDto>>("/pharmacy/stocks/my-branch", {
                params: filters
            });
            
            setStocks(res.data.data);
            
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                per_page: res.data.per_page,
                total: res.data.total
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la récupération de vos stocks.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        stocks,
        loading,
        pagination, // <-- Ne pas oublier d'exposer l'état pagination pour ton composant de vue
        getGlobalStocks,
        getMyBranchStocks
    };
};

export default useStockStore;