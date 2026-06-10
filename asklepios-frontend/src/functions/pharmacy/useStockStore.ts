import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin si nécessaire
import type { StockDto } from "../../types/StockTypes";

const useStockStore = () => {
    // --- ÉTATS ---
    const [stocks, setStocks] = useState<StockDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // --- 1. VUE GLOBALE (ADMIN/SUPERVISEUR) ---
    // GET /admin/stocks/global
    const getGlobalStocks = useCallback(async (
        filters: { search?: string, branch_id?: number | string, article_id?: number | string } = {}
    ) => {
        try {
            setLoading(true);
            const res = await api.get<StockDto[]>("/admin/stocks/global", {
                params: filters
            });
            
            setStocks(res.data);
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la récupération des stocks globaux.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 2. VUE LOCALE (PHARMACIEN/VENDEUR) ---
    // GET /pharmacien/stocks/my-branch
    const getMyBranchStocks = useCallback(async (
        filters: { search?: string, article_id?: number | string } = {}
    ) => {
        try {
            setLoading(true);
            const res = await api.get<StockDto[]>("/pharmacy/stocks/my-branch", {
                params: filters
            });
            
            setStocks(res.data);
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                // Si l'utilisateur n'est pas rattaché à une succursale, on affiche l'erreur renvoyée par le backend (403)
                toast.error(error.response?.data?.message || "Erreur lors de la récupération de vos stocks.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        stocks,
        loading,
        getGlobalStocks,
        getMyBranchStocks
    };
};

export default useStockStore;