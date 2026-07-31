import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajustez le chemin selon votre configuration
import type { 
    BiStockFilters, 
    StockKpisDto, 
    ValuationByCategoryDto, 
    ExpiringStockDto, 
    MovementTrendDto, 
    LowStockDetailsDto
} from "../../types/BiTypes"; // Ajustez le chemin

const useStockBiStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES) - Séparés par widget pour la fluidité
    // ======================================================
    
    // Données
    const [kpis, setKpis] = useState<StockKpisDto | null>(null);
    const [valuations, setValuations] = useState<ValuationByCategoryDto[]>([]);
    const [expiringStock, setExpiringStock] = useState<ExpiringStockDto[]>([]);
    const [movementTrends, setMovementTrends] = useState<MovementTrendDto[]>([]);
const [lowStockDetails, setLowStockDetails] = useState<LowStockDetailsDto[]>([]);
const [loadingLowStock, setLoadingLowStock] = useState<boolean>(false);
    // Loadings
    const [loadingKpis, setLoadingKpis] = useState<boolean>(false);
    const [loadingValuations, setLoadingValuations] = useState<boolean>(false);
    const [loadingExpiring, setLoadingExpiring] = useState<boolean>(false);
    const [loadingTrends, setLoadingTrends] = useState<boolean>(false);

    // ======================================================
    // 2. ACTIONS (FETCHERS)
    // ======================================================

    // --- Récupérer les KPIs globaux ---
    const fetchKpis = useCallback(async (filters: BiStockFilters = {}) => {
        try {
            setLoadingKpis(true);
            const res = await api.get<StockKpisDto>("/bi/stock/kpis", { params: filters });
            setKpis(res.data);
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors du chargement des KPIs.");
            }
            setKpis(null);
        } finally {
            setLoadingKpis(false);
        }
    }, []);

    // --- Récupérer la valorisation par catégorie ---
    const fetchValuationByCategory = useCallback(async (filters: BiStockFilters = {}) => {
        try {
            setLoadingValuations(true);
            const res = await api.get<ValuationByCategoryDto[]>("/bi/stock/valuation-by-category", { params: filters });
            setValuations(res.data);
        } catch (error) {
            console.error(error);
            setValuations([]);
        } finally {
            setLoadingValuations(false);
        }
    }, []);

    // --- Récupérer les stocks expirant bientôt ---
    const fetchExpiringSoon = useCallback(async (filters: BiStockFilters = {}) => {
        try {
            setLoadingExpiring(true);
            const res = await api.get<ExpiringStockDto[]>("/bi/stock/expiring-soon", { params: filters });
            setExpiringStock(res.data);
        } catch (error) {
            console.error(error);
            setExpiringStock([]);
        } finally {
            setLoadingExpiring(false);
        }
    }, []);

    // --- Récupérer les tendances de mouvements ---
    const fetchMovementTrends = useCallback(async (filters: BiStockFilters) => {
        // Validation stricte car ces champs sont requis par le backend pour cette route
        if (!filters.start_date || !filters.end_date) {
            console.warn("start_date et end_date sont requis pour fetchMovementTrends");
            return;
        }

        try {
            setLoadingTrends(true);
            const res = await api.get<MovementTrendDto[]>("/bi/stock/movement-trends", { params: filters });
            setMovementTrends(res.data);
        } catch (error) {
            console.error(error);
            setMovementTrends([]);
        } finally {
            setLoadingTrends(false);
        }
    }, []);

    // --- FONCTION UTILITAIRE : Tout recharger en même temps ---
    // Pratique lors du changement du filtre "Hôpital" ou "Pharmacie" global du Dashboard
    
// Ajoutez la fonction :
const fetchLowStockDetails = useCallback(async (filters: BiStockFilters = {}) => {
    try {
        setLoadingLowStock(true);
        const res = await api.get<LowStockDetailsDto[]>("/bi/stock/low-stock-details", { params: filters });
        setLowStockDetails(res.data);
    } catch (error) {
        console.error(error);
        setLowStockDetails([]);
    } finally {
        setLoadingLowStock(false);
    }
}, []);

// Mettez à jour fetchAllDashboardData :
const fetchAllDashboardData = useCallback((filters: BiStockFilters) => {
    fetchKpis(filters);
    fetchValuationByCategory(filters);
    fetchExpiringSoon(filters);
    fetchLowStockDetails(filters); // 👉 NOUVEAU
    
    if (filters.start_date && filters.end_date) {
        fetchMovementTrends(filters);
    }
}, [fetchKpis, fetchValuationByCategory, fetchExpiringSoon, fetchMovementTrends, fetchLowStockDetails]);
    return {
        // Données
        kpis,
        valuations,
        expiringStock,
        movementTrends,

        // Loadings individuels
        loadingKpis,
        loadingValuations,
        loadingExpiring,
        loadingTrends,

        // Fonctions
        fetchKpis,
        fetchValuationByCategory,
        fetchExpiringSoon,
        fetchMovementTrends,
        fetchAllDashboardData,
        fetchLowStockDetails,
        lowStockDetails,
        loadingLowStock,
    };
};

export default useStockBiStore;