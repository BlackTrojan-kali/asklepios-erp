import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajustez le chemin selon votre arborescence
import type { 
    BiLaboratoryFilters, 
    LabActivityKpisDto, 
    LabRequestTrendDto, 
    LabTopTestDto, 
    LabRevenueByCategoryDto, 
    LabSampleQualityDto 
} from "../../types/BiTypes"; // Ajustez le chemin

const useLabActivityBiStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES) - Séparés par widget
    // ======================================================
    
    // Données
    const [kpis, setKpis] = useState<LabActivityKpisDto | null>(null);
    const [requestTrends, setRequestTrends] = useState<LabRequestTrendDto[]>([]);
    const [topTests, setTopTests] = useState<LabTopTestDto[]>([]);
    const [revenueByCategory, setRevenueByCategory] = useState<LabRevenueByCategoryDto[]>([]);
    const [sampleQuality, setSampleQuality] = useState<LabSampleQualityDto[]>([]);

    // Loadings
    const [loadingKpis, setLoadingKpis] = useState<boolean>(false);
    const [loadingRequestTrends, setLoadingRequestTrends] = useState<boolean>(false);
    const [loadingTopTests, setLoadingTopTests] = useState<boolean>(false);
    const [loadingRevenueByCategory, setLoadingRevenueByCategory] = useState<boolean>(false);
    const [loadingSampleQuality, setLoadingSampleQuality] = useState<boolean>(false);

    // ======================================================
    // 2. ACTIONS (FETCHERS)
    // ======================================================

    // --- Récupérer les KPIs du Laboratoire ---
    const fetchKpis = useCallback(async (filters: BiLaboratoryFilters = {}) => {
        try {
            setLoadingKpis(true);
            const res = await api.get<LabActivityKpisDto>("/bi/laboratory/kpis", { params: filters });
            setKpis(res.data);
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors du chargement des KPIs du laboratoire.");
            }
            setKpis(null);
        } finally {
            setLoadingKpis(false);
        }
    }, []);

    // --- Récupérer les Tendances des Demandes (Flux) ---
    const fetchRequestTrends = useCallback(async (filters: BiLaboratoryFilters) => {
        if (!filters.start_date || !filters.end_date) return;

        try {
            setLoadingRequestTrends(true);
            const res = await api.get<LabRequestTrendDto[]>("/bi/laboratory/request-trends", { params: filters });
            setRequestTrends(res.data);
        } catch (error) {
            console.error("Erreur (Tendances requêtes) :", error);
            setRequestTrends([]);
        } finally {
            setLoadingRequestTrends(false);
        }
    }, []);

    // --- Récupérer le Top des Examens (Rentabilité / Volume) ---
    const fetchTopTests = useCallback(async (filters: BiLaboratoryFilters = {}) => {
        try {
            setLoadingTopTests(true);
            const res = await api.get<LabTopTestDto[]>("/bi/laboratory/top-tests", { params: filters });
            setTopTests(res.data);
        } catch (error) {
            console.error("Erreur (Top Examens) :", error);
            setTopTests([]);
        } finally {
            setLoadingTopTests(false);
        }
    }, []);

    // --- Récupérer le CA par Catégorie de Labo (Hématologie, etc.) ---
    const fetchRevenueByCategory = useCallback(async (filters: BiLaboratoryFilters = {}) => {
        try {
            setLoadingRevenueByCategory(true);
            const res = await api.get<LabRevenueByCategoryDto[]>("/bi/laboratory/revenue-by-category", { params: filters });
            setRevenueByCategory(res.data);
        } catch (error) {
            console.error("Erreur (CA par Catégorie Labo) :", error);
            setRevenueByCategory([]);
        } finally {
            setLoadingRevenueByCategory(false);
        }
    }, []);

    // --- Récupérer la qualité des prélèvements (Rejets) ---
    const fetchSampleQuality = useCallback(async (filters: BiLaboratoryFilters = {}) => {
        try {
            setLoadingSampleQuality(true);
            const res = await api.get<LabSampleQualityDto[]>("/bi/laboratory/sample-quality", { params: filters });
            setSampleQuality(res.data);
        } catch (error) {
            console.error("Erreur (Qualité prélèvements) :", error);
            setSampleQuality([]);
        } finally {
            setLoadingSampleQuality(false);
        }
    }, []);

    // --- FONCTION UTILITAIRE : Tout recharger en même temps ---
    const fetchAllLabDashboardData = useCallback((filters: BiLaboratoryFilters) => {
        fetchKpis(filters);
        fetchTopTests(filters);
        fetchRevenueByCategory(filters);
        fetchSampleQuality(filters);
        
        // Nécessite des dates obligatoires
        if (filters.start_date && filters.end_date) {
            fetchRequestTrends(filters);
        }
    }, [
        fetchKpis, 
        fetchTopTests, 
        fetchRevenueByCategory, 
        fetchSampleQuality, 
        fetchRequestTrends
    ]);

    return {
        // Données
        kpis,
        requestTrends,
        topTests,
        revenueByCategory,
        sampleQuality,

        // Loadings individuels
        loadingKpis,
        loadingRequestTrends,
        loadingTopTests,
        loadingRevenueByCategory,
        loadingSampleQuality,

        // Fonctions
        fetchKpis,
        fetchRequestTrends,
        fetchTopTests,
        fetchRevenueByCategory,
        fetchSampleQuality,
        fetchAllLabDashboardData
    };
};

export default useLabActivityBiStore;