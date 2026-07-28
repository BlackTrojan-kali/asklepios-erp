import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import type { 
    GlobalKPIsDto, 
    SalesAnalyticsDto, 
    InventoryValuationDto, 
    MinsanteComplianceDto, 
    PharmacyBiFilters 
} from "../../types/BiTypes";

const usePharmacyBiStore = () => {
    // --- ÉTATS DES DONNÉES ---
    const [kpis, setKpis] = useState<GlobalKPIsDto | null>(null);
    const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalyticsDto | null>(null);
    const [inventoryValuation, setInventoryValuation] = useState<InventoryValuationDto | null>(null);
    const [minsanteCompliance, setMinsanteCompliance] = useState<MinsanteComplianceDto | null>(null);

    // --- ÉTATS DE CHARGEMENT ---
    const [loadingKpis, setLoadingKpis] = useState<boolean>(false);
    const [loadingSales, setLoadingSales] = useState<boolean>(false);
    const [loadingValuation, setLoadingValuation] = useState<boolean>(false);
    const [loadingCompliance, setLoadingCompliance] = useState<boolean>(false);
    const [globalLoading, setGlobalLoading] = useState<boolean>(false);

    // ========================================================================
    // 1. RÉCUPÉRATION DES KPI GLOBAUX
    // ========================================================================
    const fetchGlobalKPIs = useCallback(async (filters: PharmacyBiFilters = {}) => {
        try {
            setLoadingKpis(true);
            const res = await api.get<GlobalKPIsDto>("/ceo/bi/pharmacy/kpis", { params: filters });
            setKpis(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de charger les indicateurs de performance (KPIs).");
            setKpis(null);
            return null;
        } finally {
            setLoadingKpis(false);
        }
    }, []);

    // ========================================================================
    // 2. RÉCUPÉRATION DE L'ANALYSE DES VENTES
    // ========================================================================
    const fetchSalesAnalytics = useCallback(async (filters: PharmacyBiFilters = {}) => {
        try {
            setLoadingSales(true);
            const res = await api.get<SalesAnalyticsDto>("/ceo/bi/pharmacy/sales-analytics", { params: filters });
            setSalesAnalytics(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de charger l'analyse détaillée des ventes.");
            setSalesAnalytics(null);
            return null;
        } finally {
            setLoadingSales(false);
        }
    }, []);

    // ========================================================================
    // 3. RÉCUPÉRATION DE LA VALORISATION DES STOCKS
    // ========================================================================
    const fetchInventoryValuation = useCallback(async (filters: PharmacyBiFilters = {}) => {
        try {
            setLoadingValuation(true);
            const res = await api.get<InventoryValuationDto>("/ceo/bi/pharmacy/inventory-valuation", { params: filters });
            setInventoryValuation(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de charger la valorisation des stocks.");
            setInventoryValuation(null);
            return null;
        } finally {
            setLoadingValuation(false);
        }
    }, []);

    // ========================================================================
    // 4. RÉCUPÉRATION DE LA CONFORMITÉ MINSANTE
    // ========================================================================
    const fetchMinsanteCompliance = useCallback(async (filters: PharmacyBiFilters = {}) => {
        try {
            setLoadingCompliance(true);
            const res = await api.get<MinsanteComplianceDto>("/ceo/bi/pharmacy/minsante-compliance", { params: filters });
            setMinsanteCompliance(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de charger les rapports de conformité MINSANTE.");
            setMinsanteCompliance(null);
            return null;
        } finally {
            setLoadingCompliance(false);
        }
    }, []);

    // ========================================================================
    // 5. FONCTION GLOBALE POUR CHARGER TOUT LE DASHBOARD EN PARALLÈLE
    // ========================================================================
    const fetchAllBiData = useCallback(async (filters: PharmacyBiFilters = {}) => {
        setGlobalLoading(true);
        try {
            // Exécution simultanée des 4 requêtes pour des performances maximales
            await Promise.all([
                fetchGlobalKPIs(filters),
                fetchSalesAnalytics(filters),
                fetchInventoryValuation(filters),
                fetchMinsanteCompliance(filters)
            ]);
        } catch (error) {
            console.error("Erreur lors du chargement global du Dashboard BI :", error);
        } finally {
            setGlobalLoading(false);
        }
    }, [fetchGlobalKPIs, fetchSalesAnalytics, fetchInventoryValuation, fetchMinsanteCompliance]);

    return {
        // Données
        kpis,
        salesAnalytics,
        inventoryValuation,
        minsanteCompliance,

        // États de chargement
        loadingKpis,
        loadingSales,
        loadingValuation,
        loadingCompliance,
        globalLoading,

        // Fonctions
        fetchGlobalKPIs,
        fetchSalesAnalytics,
        fetchInventoryValuation,
        fetchMinsanteCompliance,
        fetchAllBiData // <-- La fonction la plus utile pour initialiser le composant Dashboard
    };
};

export default usePharmacyBiStore;