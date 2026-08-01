import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajustez le chemin selon votre arborescence
import type { 
    BiActivityFilters, 
    ActivityKpisDto, 
    VisitTrendDto, 
    DoctorConsultationDto, 
    TopMedicalActDto, 
    ActiveAdmissionDto 
} from "../../types/BiTypes"; // Ajustez le chemin

const useHospitalActivityBiStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES) - Séparés par widget
    // ======================================================
    
    // Données
    const [kpis, setKpis] = useState<ActivityKpisDto | null>(null);
    const [visitTrends, setVisitTrends] = useState<VisitTrendDto[]>([]);
    const [consultationsByDoctor, setConsultationsByDoctor] = useState<DoctorConsultationDto[]>([]);
    const [topMedicalActs, setTopMedicalActs] = useState<TopMedicalActDto[]>([]);
    const [activeAdmissions, setActiveAdmissions] = useState<ActiveAdmissionDto[]>([]);

    // Loadings
    const [loadingKpis, setLoadingKpis] = useState<boolean>(false);
    const [loadingVisitTrends, setLoadingVisitTrends] = useState<boolean>(false);
    const [loadingConsultationsByDoctor, setLoadingConsultationsByDoctor] = useState<boolean>(false);
    const [loadingTopMedicalActs, setLoadingTopMedicalActs] = useState<boolean>(false);
    const [loadingActiveAdmissions, setLoadingActiveAdmissions] = useState<boolean>(false);

    // ======================================================
    // 2. ACTIONS (FETCHERS)
    // ======================================================

    // --- Récupérer les KPIs d'Activité ---
    const fetchKpis = useCallback(async (filters: BiActivityFilters = {}) => {
        try {
            setLoadingKpis(true);
            const res = await api.get<ActivityKpisDto>("/bi/hospital/kpis", { params: filters });
            setKpis(res.data);
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors du chargement des KPIs d'activité.");
            }
            setKpis(null);
        } finally {
            setLoadingKpis(false);
        }
    }, []);

    // --- Récupérer les Tendances de Visites (Flux Patients) ---
    const fetchVisitTrends = useCallback(async (filters: BiActivityFilters) => {
        if (!filters.start_date || !filters.end_date) return;

        try {
            setLoadingVisitTrends(true);
            const res = await api.get<VisitTrendDto[]>("/bi/hospital/visit-trends", { params: filters });
            setVisitTrends(res.data);
        } catch (error) {
            console.error("Erreur (Tendances visites) :", error);
            setVisitTrends([]);
        } finally {
            setLoadingVisitTrends(false);
        }
    }, []);

    // --- Récupérer le classement des Médecins ---
    const fetchConsultationsByDoctor = useCallback(async (filters: BiActivityFilters = {}) => {
        try {
            setLoadingConsultationsByDoctor(true);
            const res = await api.get<DoctorConsultationDto[]>("/bi/hospital/consultations-by-doctor", { params: filters });
            setConsultationsByDoctor(res.data);
        } catch (error) {
            console.error("Erreur (Médecins) :", error);
            setConsultationsByDoctor([]);
        } finally {
            setLoadingConsultationsByDoctor(false);
        }
    }, []);

    // --- Récupérer le Top des Actes Médicaux ---
    const fetchTopMedicalActs = useCallback(async (filters: BiActivityFilters = {}) => {
        try {
            setLoadingTopMedicalActs(true);
            const res = await api.get<TopMedicalActDto[]>("/bi/hospital/top-medical-acts", { params: filters });
            setTopMedicalActs(res.data);
        } catch (error) {
            console.error("Erreur (Top Actes) :", error);
            setTopMedicalActs([]);
        } finally {
            setLoadingTopMedicalActs(false);
        }
    }, []);

    // --- Récupérer la liste des patients actuellement hospitalisés ---
    const fetchActiveAdmissions = useCallback(async (filters: BiActivityFilters = {}) => {
        try {
            setLoadingActiveAdmissions(true);
            const res = await api.get<ActiveAdmissionDto[]>("/bi/hospital/active-admissions", { params: filters });
            setActiveAdmissions(res.data);
        } catch (error) {
            console.error("Erreur (Admissions actives) :", error);
            setActiveAdmissions([]);
        } finally {
            setLoadingActiveAdmissions(false);
        }
    }, []);

    // --- FONCTION UTILITAIRE : Tout recharger en même temps ---
    const fetchAllActivityDashboardData = useCallback((filters: BiActivityFilters) => {
        fetchKpis(filters);
        fetchConsultationsByDoctor(filters);
        fetchTopMedicalActs(filters);
        fetchActiveAdmissions(filters);
        
        // Nécessite des dates obligatoires
        if (filters.start_date && filters.end_date) {
            fetchVisitTrends(filters);
        }
    }, [
        fetchKpis, 
        fetchConsultationsByDoctor, 
        fetchTopMedicalActs, 
        fetchActiveAdmissions, 
        fetchVisitTrends
    ]);

    return {
        // Données
        kpis,
        visitTrends,
        consultationsByDoctor,
        topMedicalActs,
        activeAdmissions,

        // Loadings individuels
        loadingKpis,
        loadingVisitTrends,
        loadingConsultationsByDoctor,
        loadingTopMedicalActs,
        loadingActiveAdmissions,

        // Fonctions
        fetchKpis,
        fetchVisitTrends,
        fetchConsultationsByDoctor,
        fetchTopMedicalActs,
        fetchActiveAdmissions,
        fetchAllActivityDashboardData
    };
};

export default useHospitalActivityBiStore;