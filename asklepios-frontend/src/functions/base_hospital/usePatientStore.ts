import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton architecture
import type { PaginatedResponse } from "../../types/types"; 
import type { PatientDto, PatientPayload } from "../../types/PatientTypes";

export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const usePatientStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES)
    // ======================================================
    const [patients, setPatients] = useState<PatientDto[]>([]);
    const [allPatients, setAllPatients] = useState<PatientDto[]>([]); // Liste plate pour les selects
    const [currentPatient, setCurrentPatient] = useState<PatientDto | null>(null);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // ======================================================
    // 2. ACTIONS CRUD & FILTRES
    // ======================================================

    // --- LISTER & FILTRER (Paginé) ---
    const getPatients = useCallback(async (
        page: number = 1,
        filters: { search?: string } = {},
        perPage: number = 15
    ) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<PatientDto>>("/receptionist/patients", {
                params: { page, per_page: perPage, ...filters }
            });

            setPatients(res.data.data || []);
            setPagination({
                currentPage: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
                total: res.data.total || 0
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des dossiers patients");
            }
            setPatients([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- LISTER TOUT (Non paginé pour React-Select) ---
    const getAllPatients = useCallback(async () => {
        try {
            const res = await api.get<PatientDto[]>("/receptionist/patients", {
                params: { paginated: 'false' } 
            });
            setAllPatients(res.data);
            return res.data;
        } catch (error) {
            console.error("Erreur lors de la récupération du listing complet", error);
            setAllPatients([]);
            return [];
        }
    }, []);

    // --- VOIR LES DÉTAILS D'UN PATIENT ---
    const getPatientById = useCallback(async (id: number) => {
        try {
            setLoading(true);
            const res = await api.get<PatientDto>(`/receptionist/patients/${id}`);
            setCurrentPatient(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de charger les détails de ce patient");
            setCurrentPatient(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // --- CRÉER UN DOSSIER ---
    const createPatient = async (payload: PatientPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post("/receptionist/patients", payload);
            
            toast.success("Dossier patient créé avec succès !");
            
            // On rafraîchit la liste principale (retour page 1) et la liste complète
            await getPatients(1);
            await getAllPatients();
            
            return res.data; // Utile si on veut rediriger vers le dossier du patient
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la création du dossier");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- MODIFIER UN DOSSIER ---
    const updatePatient = async (id: number, payload: PatientPayload) => {
        try {
            setActionLoading(true);
            await api.put(`/receptionist/patients/${id}`, payload);
            
            toast.success("Dossier mis à jour avec succès !");
            
            // Rafraîchir la liste sur la page actuelle
            await getPatients(pagination?.currentPage || 1);
            await getAllPatients();
            
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

    // --- SUPPRIMER (ARCHIVER) UN PATIENT ---
    const deletePatient = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/receptionist/patients/${id}`);
            
            toast.success("Dossier patient archivé");
            
            // Calcul de la page de secours
            const currentCount = patients.length;
            const currentPage = pagination?.currentPage || 1;
            const targetPage = (currentCount === 1 && currentPage > 1) ? currentPage - 1 : currentPage;
            
            await getPatients(targetPage);
            await getAllPatients();
            
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de l'archivage");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        // États
        patients,
        allPatients,
        currentPatient,
        pagination,
        loading,
        actionLoading,

        // Méthodes
        getPatients,
        getAllPatients,
        getPatientById,
        createPatient,
        updatePatient,
        deletePatient
    };
};

export default usePatientStore;