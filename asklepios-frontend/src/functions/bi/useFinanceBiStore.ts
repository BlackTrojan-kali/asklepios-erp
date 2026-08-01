import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajustez le chemin selon votre arborescence
import type { 
    BiFinanceFilters, 
    FinanceKpisDto, 
    RevenueTrendDto, 
    RevenueByPaymentMethodDto, 
    RevenueByCategoryDto, 
    TopArticleDto, 
    CashFlowDto 
} from "../../types/BiTypes"; // Ajustez le chemin

const useFinanceBiStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES) - Séparés par widget
    // ======================================================
    
    // Données
    const [kpis, setKpis] = useState<FinanceKpisDto | null>(null);
    const [revenueTrends, setRevenueTrends] = useState<RevenueTrendDto[]>([]);
    const [revenueByPaymentMethod, setRevenueByPaymentMethod] = useState<RevenueByPaymentMethodDto[]>([]);
    const [revenueByCategory, setRevenueByCategory] = useState<RevenueByCategoryDto[]>([]);
    const [topArticles, setTopArticles] = useState<TopArticleDto[]>([]);
    const [cashFlow, setCashFlow] = useState<CashFlowDto[]>([]);

    // Loadings
    const [loadingKpis, setLoadingKpis] = useState<boolean>(false);
    const [loadingTrends, setLoadingTrends] = useState<boolean>(false);
    const [loadingPaymentMethod, setLoadingPaymentMethod] = useState<boolean>(false);
    const [loadingCategory, setLoadingCategory] = useState<boolean>(false);
    const [loadingTopArticles, setLoadingTopArticles] = useState<boolean>(false);
    const [loadingCashFlow, setLoadingCashFlow] = useState<boolean>(false);

    // ======================================================
    // 2. ACTIONS (FETCHERS)
    // ======================================================

    // --- Récupérer les KPIs Financiers ---
    const fetchKpis = useCallback(async (filters: BiFinanceFilters = {}) => {
        try {
            setLoadingKpis(true);
            const res = await api.get<FinanceKpisDto>("/bi/finance/kpis", { params: filters });
            setKpis(res.data);
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors du chargement des KPIs financiers.");
            }
            setKpis(null);
        } finally {
            setLoadingKpis(false);
        }
    }, []);

    // --- Récupérer l'évolution du Chiffre d'Affaires ---
    const fetchRevenueTrends = useCallback(async (filters: BiFinanceFilters) => {
        if (!filters.start_date || !filters.end_date) return;

        try {
            setLoadingTrends(true);
            const res = await api.get<RevenueTrendDto[]>("/bi/finance/revenue-trends", { params: filters });
            setRevenueTrends(res.data);
        } catch (error) {
            console.error(error);
            setRevenueTrends([]);
        } finally {
            setLoadingTrends(false);
        }
    }, []);

    // --- Récupérer le CA par Mode de Paiement ---
    const fetchRevenueByPaymentMethod = useCallback(async (filters: BiFinanceFilters = {}) => {
        try {
            setLoadingPaymentMethod(true);
            const res = await api.get<RevenueByPaymentMethodDto[]>("/bi/finance/revenue-by-payment-method", { params: filters });
            setRevenueByPaymentMethod(res.data);
        } catch (error) {
            console.error(error);
            setRevenueByPaymentMethod([]);
        } finally {
            setLoadingPaymentMethod(false);
        }
    }, []);

    // --- Récupérer le CA par Catégorie ---
    const fetchRevenueByCategory = useCallback(async (filters: BiFinanceFilters = {}) => {
        try {
            setLoadingCategory(true);
            const res = await api.get<RevenueByCategoryDto[]>("/bi/finance/revenue-by-category", { params: filters });
            setRevenueByCategory(res.data);
        } catch (error) {
            console.error(error);
            setRevenueByCategory([]);
        } finally {
            setLoadingCategory(false);
        }
    }, []);

    // --- Récupérer le Top des Articles ---
    const fetchTopArticles = useCallback(async (filters: BiFinanceFilters = {}) => {
        try {
            setLoadingTopArticles(true);
            const res = await api.get<TopArticleDto[]>("/bi/finance/top-articles", { params: filters });
            setTopArticles(res.data);
        } catch (error) {
            console.error(error);
            setTopArticles([]);
        } finally {
            setLoadingTopArticles(false);
        }
    }, []);

    // --- Récupérer le Cash Flow (Trésorerie) ---
    const fetchCashFlow = useCallback(async (filters: BiFinanceFilters = {}) => {
        try {
            setLoadingCashFlow(true);
            const res = await api.get<CashFlowDto[]>("/bi/finance/cash-flow", { params: filters });
            setCashFlow(res.data);
        } catch (error) {
            console.error(error);
            setCashFlow([]);
        } finally {
            setLoadingCashFlow(false);
        }
    }, []);

    // --- FONCTION UTILITAIRE : Tout recharger en même temps ---
    const fetchAllFinanceDashboardData = useCallback((filters: BiFinanceFilters) => {
        fetchKpis(filters);
        fetchRevenueByPaymentMethod(filters);
        fetchRevenueByCategory(filters);
        fetchTopArticles(filters);
        fetchCashFlow(filters);
        
        // Nécessite des dates obligatoires
        if (filters.start_date && filters.end_date) {
            fetchRevenueTrends(filters);
        }
    }, [
        fetchKpis, 
        fetchRevenueByPaymentMethod, 
        fetchRevenueByCategory, 
        fetchTopArticles, 
        fetchCashFlow, 
        fetchRevenueTrends
    ]);

    return {
        // Données
        kpis,
        revenueTrends,
        revenueByPaymentMethod,
        revenueByCategory,
        topArticles,
        cashFlow,

        // Loadings individuels
        loadingKpis,
        loadingTrends,
        loadingPaymentMethod,
        loadingCategory,
        loadingTopArticles,
        loadingCashFlow,

        // Fonctions
        fetchKpis,
        fetchRevenueTrends,
        fetchRevenueByPaymentMethod,
        fetchRevenueByCategory,
        fetchTopArticles,
        fetchCashFlow,
        fetchAllFinanceDashboardData
    };
};

export default useFinanceBiStore;