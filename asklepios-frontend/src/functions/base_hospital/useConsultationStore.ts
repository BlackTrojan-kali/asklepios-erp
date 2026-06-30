// src/functions/doctor/useConsultationStore.ts

import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api";
import type { PaginatedResponse } from "../../types/types";
import type { 
    ConsultationDto, 
    CreateConsultationPayload, 
    UpdateConsultationNotesPayload 
} from "../../types/ConsultationTypes";

export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const useConsultationStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES)
    // ======================================================
    const [consultations, setConsultations] = useState<ConsultationDto[]>([]);
    const [currentConsultation, setCurrentConsultation] = useState<ConsultationDto | null>(null);
    
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // ======================================================
    // 2. ACTIONS API
    // ======================================================

    // --- LISTER L'HISTORIQUE DES CONSULTATIONS DU MÉDECIN ---
    const getConsultations = useCallback(async (
        page: number = 1,
        filters: { date?: string; patient_id?: number } = {},
        perPage: number = 15
    ) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<ConsultationDto>>('/doctor/consultations', {
                params: { page, per_page: perPage, ...filters }
            });

            setConsultations(res.data.data || []);
            setPagination({
                currentPage: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
                total: res.data.total || 0
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération de l'historique");
            }
            setConsultations([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- RÉCUPÉRER LES DÉTAILS D'UNE CONSULTATION SPÉCIFIQUE ---
    const getConsultationDetails = useCallback(async (id: number) => {
        if (!id) return null;

        try {
            setLoading(true);
            const res = await api.get<ConsultationDto>(`/doctor/consultations/${id}`);
            setCurrentConsultation(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de charger les détails de la consultation");
            setCurrentConsultation(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // --- ENREGISTRER UNE NOUVELLE CONSULTATION (AVEC ORDONNANCES ET EXAMENS) ---
    const createConsultation = async (payload: CreateConsultationPayload) => {
        try {
            setActionLoading(true);
            
            // On nettoie les tableaux vides avant l'envoi pour alléger la requête
            const cleanPayload = {
                ...payload,
                prescriptions: payload.prescriptions?.length ? payload.prescriptions : undefined,
                exams: payload.exams?.length ? payload.exams : undefined,
                medical_acts: payload.medical_acts?.length ? payload.medical_acts : undefined,
            };

            const res = await api.post('/doctor/consultations', cleanPayload);
            
            toast.success("Consultation enregistrée avec succès !");
            return res.data.data; // Retourne l'objet consultation créé
            
        } catch (error) {
            if (axios.isAxiosError(error)) {
                // Gestion des erreurs de validation (422) ou autres (500)
                const message = error.response?.data?.message || "Erreur lors de l'enregistrement de la consultation";
                toast.error(message);
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- METTRE À JOUR LES NOTES CLINIQUES ---
    const updateConsultationNotes = async (id: number, payload: UpdateConsultationNotesPayload) => {
        try {
            setActionLoading(true);
            const res = await api.put(`/doctor/consultations/${id}`, payload);
            
            toast.success("Dossier clinique mis à jour !");
            
            // Mise à jour de l'état local si c'est la consultation actuellement affichée
            if (currentConsultation?.id === id) {
                setCurrentConsultation(res.data.data);
            }
            
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

    // --- SUPPRIMER UNE CONSULTATION (Annulation par le médecin) ---
    const deleteConsultation = async (id: number) => {
        try {
            setActionLoading(true);
            const res = await api.delete(`/doctor/consultations/${id}`);
            
            toast.success(res.data.message || "Consultation annulée avec succès.");
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de l'annulation de la consultation");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- SOUMETTRE UN RÉSULTAT D'EXAMEN (Pour les Laborantins) ---
    const submitExamResult = async (examLineId: number, payload: { result_notes?: string, document_url?: string }) => {
        try {
            setActionLoading(true);
            const res = await api.patch(`/shared/exam-requests/${examLineId}/submit-result`, payload);
            toast.success("Résultat enregistré avec succès.");
            return res.data;
        } catch (error) {
            toast.error("Erreur lors de la soumission du résultat");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- RÉCUPÉRER LES ACTES MÉDICAUX DU CATALOGUE (Pour la facture) ---
    const getMedicalActs = useCallback(async (departmentId: number) => {
        try {
            const res = await api.get(`/shared/departments/${departmentId}/medical-acts`);
            return res.data;
        } catch (error) {
            return [];
        }
    }, []);

    return {
        // États
        consultations,
        currentConsultation,
        pagination,
        loading,
        actionLoading,

        // Méthodes
        getConsultations,
        getConsultationDetails,
        createConsultation,
        updateConsultationNotes,
        deleteConsultation, // <--- NOUVELLE MÉTHODE EXPOSÉE ICI
        submitExamResult,
        getMedicalActs
    };
};

export default useConsultationStore;