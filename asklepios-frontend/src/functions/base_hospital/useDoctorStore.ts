import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton architecture
import type { PaginatedResponse } from "../../types/types";
import type { DoctorDto, DoctorPayload } from "../../types/DoctorTypes";

export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const useDoctorStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES)
    // ======================================================
    const [doctors, setDoctors] = useState<DoctorDto[]>([]);
    const [allDoctors, setAllDoctors] = useState<DoctorDto[]>([]); // Liste plate pour les selects (assignations, rdv...)
    const [currentDoctor, setCurrentDoctor] = useState<DoctorDto | null>(null);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // ======================================================
    // 2. ACTIONS CRUD & FILTRES
    // ======================================================

    // --- LISTER & FILTRER (Paginé) ---
    const getDoctors = useCallback(async (
        page: number = 1,
        filters: { search?: string; center_id?: number | string; department_id?: number | string } = {},
        perPage: number = 15
    ) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<DoctorDto>>("/admin/doctors", {
                params: { page, per_page: perPage, ...filters }
            });

            setDoctors(res.data.data || []);
            setPagination({
                currentPage: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
                total: res.data.total || 0
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des médecins");
            }
            setDoctors([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- LISTER TOUT (Non paginé pour React-Select) ---
    const getAllDoctors = useCallback(async (filters: { center_id?: number | string } = {}) => {
        try {
            // Note: Si le composant est utilisé par la réception, il faudra appeler /reception/doctors
            // Ici, on utilise l'endpoint admin par défaut avec paramètre paginated=false
            const res = await api.get<DoctorDto[]>("/reception/doctors", {
                params: { paginated: 'false', ...filters }
            });
            setAllDoctors(res.data);
            return res.data;
        } catch (error) {
            console.error("Erreur lors de la récupération de la liste complète des médecins", error);
            setAllDoctors([]);
            return [];
        }
    }, []);

    // --- VOIR LES DÉTAILS D'UN MÉDECIN ---
    const getDoctorById = useCallback(async (id: number) => {
        try {
            setLoading(true);
            const res = await api.get<DoctorDto>(`/admin/doctors/${id}`);
            setCurrentDoctor(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de charger les détails de ce médecin");
            setCurrentDoctor(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // --- CRÉER UN MÉDECIN ---
    const createDoctor = async (payload: DoctorPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post("/admin/doctors", payload);
            
            toast.success("Profil médecin créé avec succès !");
            
            // On rafraîchit la liste principale (retour page 1) et la liste complète
            await getDoctors(1);
            await getAllDoctors();
            
            return res.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la création du profil");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- MODIFIER UN MÉDECIN ---
    const updateDoctor = async (id: number, payload: DoctorPayload) => {
        try {
            setActionLoading(true);
            await api.put(`/admin/doctors/${id}`, payload);
            
            toast.success("Profil mis à jour avec succès !");
            
            // Rafraîchir la liste sur la page actuelle
            await getDoctors(pagination?.currentPage || 1);
            await getAllDoctors();
            
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

    // --- SUPPRIMER UN MÉDECIN ---
    const deleteDoctor = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/doctors/${id}`);
            
            toast.success("Profil médecin supprimé de la plateforme");
            
            // Calcul de la page de secours pour éviter de se retrouver sur une page vide
            const currentCount = doctors.length;
            const currentPage = pagination?.currentPage || 1;
            const targetPage = (currentCount === 1 && currentPage > 1) ? currentPage - 1 : currentPage;
            
            await getDoctors(targetPage);
            await getAllDoctors();
            
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
        // États
        doctors,
        allDoctors,
        currentDoctor,
        pagination,
        loading,
        actionLoading,

        // Méthodes
        getDoctors,
        getAllDoctors,
        getDoctorById,
        createDoctor,
        updateDoctor,
        deleteDoctor
    };
};

export default useDoctorStore;