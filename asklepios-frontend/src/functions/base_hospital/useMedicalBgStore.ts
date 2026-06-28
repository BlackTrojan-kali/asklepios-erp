import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api";
import type { MedicalBackgroundDto, MedicalBackgroundPayload } from "../../types/medicalBGTypes";

const useMedicalBgStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES)
    // ======================================================
    const [medicalBackground, setMedicalBackground] = useState<MedicalBackgroundDto | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // ======================================================
    // 2. ACTIONS
    // ======================================================

    // --- RÉCUPÉRER LE DOSSIER ---
    const getMedicalBackground = useCallback(async (patientId: number) => {
        if (!patientId) return null;

        try {
            setLoading(true);
            const res = await api.get<MedicalBackgroundDto>(`/shared/patients/${patientId}/medical-background`);
            setMedicalBackground(res.data);
            return res.data;
        } catch (error) {
            // Si c'est une 404, cela signifie simplement que le patient n'a pas encore de fiche
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                setMedicalBackground(null);
            } else {
                toast.error("Erreur lors de la récupération des antécédents médicaux");
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // --- INITIALISER LE DOSSIER (CREATE) ---
    const createMedicalBackground = async (patientId: number, payload: MedicalBackgroundPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post(`/shared/patients/${patientId}/medical-background`, payload);
            
            toast.success("Dossier médical initialisé avec succès !");
            setMedicalBackground(res.data.data);
            return res.data.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de l'initialisation du dossier");
            }
            return null;
        } finally {
            setActionLoading(false);
        }
    };

    // --- METTRE À JOUR LE DOSSIER (UPDATE) ---
    const updateMedicalBackground = async (patientId: number, payload: MedicalBackgroundPayload) => {
        try {
            setActionLoading(true);
            const res = await api.put(`/shared/patients/${patientId}/medical-background`, payload);
            
            toast.success("Antécédents médicaux mis à jour !");
            setMedicalBackground(res.data.data);
            return res.data.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la mise à jour");
            }
            return null;
        } finally {
            setActionLoading(false);
        }
    };

    // --- ARCHIVER LE DOSSIER (DELETE) ---
    const deleteMedicalBackground = async (patientId: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/shared/patients/${patientId}/medical-background`);
            
            toast.success("Dossier médical archivé.");
            setMedicalBackground(null);
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
// --- TÉLÉCHARGER LE CARNET MÉDICAL COMPLET ---
    const downloadMedicalRecord = async (patientId: number, action: 'stream' | 'download' = 'stream') => {
        try {
            setActionLoading(true);
            const response = await api.get(`/shared/patients/${patientId}/medical-record/download?action=${action}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Carnet_Medical_${patientId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Erreur lors du téléchargement du carnet médical");
        } finally {
            setActionLoading(false);
        }
    };
    return {
        // États
        medicalBackground,
        loading,
        actionLoading,

        // Méthodes
        getMedicalBackground,
        createMedicalBackground,
        updateMedicalBackground,
        deleteMedicalBackground,
        downloadMedicalRecord
    };
};

export default useMedicalBgStore;