import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajustez le chemin selon votre arborescence
import type { 
    BiHospitalFinanceFilters, 
    HospitalFinanceKpisDto, 
    HospitalRevenueTrendDto, 
    RevenueByServiceDto, 
    HospitalPaymentMethodDto, 
    InsuranceClaimStatusDto 
} from "../../types/BiTypes"; // Ajustez le chemin

const useHospitalFinanceBiStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES) - Séparés par widget
    // ======================================================
    
    // Données
    const [kpis, setKpis] = useState<HospitalFinanceKpisDto | null>(null);
    const [revenueTrends, setRevenueTrends] = useState<HospitalRevenueTrendDto[]>([]);
    const [revenueByService, setRevenueByService] = useState<RevenueByServiceDto[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<HospitalPaymentMethodDto[]>([]);
    const [insuranceClaims, setInsuranceClaims] = useState<InsuranceClaimStatusDto[]>([]);

    // Loadings
    const [loadingKpis, setLoadingKpis] = useState<boolean>(false);
    const [loadingTrends, setLoadingTrends] = useState<boolean>(false);
    const [loadingServices, setLoadingServices] = useState<boolean>(false);
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState<boolean>(false);
    const [loadingInsuranceClaims, setLoadingInsuranceClaims] = useState<boolean>(false);

    // ======================================================
    // 2. ACTIONS (FETCHERS)
    // ======================================================

    // --- Récupérer les KPIs Financiers de l'Hôpital ---
    const fetchKpis = useCallback(async (filters: BiHospitalFinanceFilters = {}) => {
        try {
            setLoadingKpis(true);
            const res = await api.get<HospitalFinanceKpisDto>("/bi/hospital-finance/kpis", { params: filters });
            setKpis(res.data);
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors du chargement des KPIs de facturation.");
            }
            setKpis(null);
        } finally {
            setLoadingKpis(false);
        }
    }, []);

    // --- Récupérer les Tendances d'Encaissements ---
    const fetchRevenueTrends = useCallback(async (filters: BiHospitalFinanceFilters) => {
        if (!filters.start_date || !filters.end_date) return;

        try {
            setLoadingTrends(true);
            const res = await api.get<HospitalRevenueTrendDto[]>("/bi/hospital-finance/revenue-trends", { params: filters });
            setRevenueTrends(res.data);
        } catch (error) {
            console.error("Erreur (Tendances CA Hôpital) :", error);
            setRevenueTrends([]);
        } finally {
            setLoadingTrends(false);
        }
    }, []);

    // --- Récupérer le CA par Service (Consultation, Labo, etc.) ---
    const fetchRevenueByService = useCallback(async (filters: BiHospitalFinanceFilters = {}) => {
        try {
            setLoadingServices(true);
            const res = await api.get<RevenueByServiceDto[]>("/bi/hospital-finance/revenue-by-service", { params: filters });
            setRevenueByService(res.data);
        } catch (error) {
            console.error("Erreur (CA par Service) :", error);
            setRevenueByService([]);
        } finally {
            setLoadingServices(false);
        }
    }, []);

    // --- Récupérer les méthodes de paiement ---
    const fetchPaymentMethods = useCallback(async (filters: BiHospitalFinanceFilters = {}) => {
        try {
            setLoadingPaymentMethods(true);
            const res = await api.get<HospitalPaymentMethodDto[]>("/bi/hospital-finance/payment-methods", { params: filters });
            setPaymentMethods(res.data);
        } catch (error) {
            console.error("Erreur (Méthodes paiement Hôpital) :", error);
            setPaymentMethods([]);
        } finally {
            setLoadingPaymentMethods(false);
        }
    }, []);

    // --- Récupérer l'état des créances d'assurance ---
    const fetchInsuranceClaims = useCallback(async (filters: BiHospitalFinanceFilters = {}) => {
        try {
            setLoadingInsuranceClaims(true);
            const res = await api.get<InsuranceClaimStatusDto[]>("/bi/hospital-finance/insurance-claims", { params: filters });
            setInsuranceClaims(res.data);
        } catch (error) {
            console.error("Erreur (Créances Assurances) :", error);
            setInsuranceClaims([]);
        } finally {
            setLoadingInsuranceClaims(false);
        }
    }, []);

    // --- FONCTION UTILITAIRE : Tout recharger en même temps ---
    const fetchAllHospitalFinanceDashboardData = useCallback((filters: BiHospitalFinanceFilters) => {
        fetchKpis(filters);
        fetchRevenueByService(filters);
        fetchPaymentMethods(filters);
        fetchInsuranceClaims(filters);
        
        // Nécessite des dates obligatoires
        if (filters.start_date && filters.end_date) {
            fetchRevenueTrends(filters);
        }
    }, [
        fetchKpis, 
        fetchRevenueByService, 
        fetchPaymentMethods, 
        fetchInsuranceClaims, 
        fetchRevenueTrends
    ]);

    return {
        // Données
        kpis,
        revenueTrends,
        revenueByService,
        paymentMethods,
        insuranceClaims,

        // Loadings individuels
        loadingKpis,
        loadingTrends,
        loadingServices,
        loadingPaymentMethods,
        loadingInsuranceClaims,

        // Fonctions
        fetchKpis,
        fetchRevenueTrends,
        fetchRevenueByService,
        fetchPaymentMethods,
        fetchInsuranceClaims,
        fetchAllHospitalFinanceDashboardData
    };
};

export default useHospitalFinanceBiStore;