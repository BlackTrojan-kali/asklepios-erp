import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/api'; // Ajustez le chemin vers votre instance Axios
import type { PatientCoverageDto, PatientCoveragePayload } from '../../types/InsuranceTypes'; // Ajustez le chemin

export default function useCoveragesStore() {
    // Nouveaux états pour la lecture
    const [coverages, setCoverages] = useState<PatientCoverageDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    
    // État existant pour l'écriture
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // 1. Lister les couvertures d'un patient (Lecture seule - Tous les rôles)
    const getPatientCoverages = useCallback(async (patientId: number) => {
        setLoading(true);
        try {
            const res = await api.get(`/insurance-coverages/patient/${patientId}`);
            setCoverages(res.data.data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erreur lors de la récupération des couvertures.");
        } finally {
            setLoading(false);
        }
    }, []);

    // 2. Ajouter une couverture (Admin & Réception)
    const addCoverage = async (data: PatientCoveragePayload): Promise<boolean> => {
        setActionLoading(true);
        try {
            await api.post('/insurance-coverages', data);
            toast.success("Couverture patient enregistrée avec succès !");
            return true;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Erreur lors de l'ajout de la couverture.";
            toast.error(errorMessage);
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // 3. Mettre à jour une couverture (Admin & Réception)
    const updateCoverage = async (id: number, data: Partial<PatientCoveragePayload>): Promise<boolean> => {
        setActionLoading(true);
        try {
            await api.put(`/insurance-coverages/${id}`, data);
            toast.success("Couverture mise à jour avec succès !");
            return true;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Erreur lors de la mise à jour de la couverture.";
            toast.error(errorMessage);
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // 4. Supprimer (retirer) une couverture (Admin & Réception)
    const deleteCoverage = async (id: number): Promise<boolean> => {
        setActionLoading(true);
        try {
            await api.delete(`/insurance-coverages/${id}`);
            toast.success("Couverture retirée avec succès !");
            // Mise à jour optimiste de l'état local
            setCoverages(prev => prev.filter(cov => cov.id !== id));
            return true;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Erreur lors de la suppression de la couverture.";
            toast.error(errorMessage);
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        coverages, // <-- NOUVEAU
        loading, // <-- NOUVEAU
        actionLoading,
        getPatientCoverages, // <-- NOUVEAU
        addCoverage,
        updateCoverage,
        deleteCoverage
    };
}