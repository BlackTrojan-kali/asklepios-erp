// functions/admin/useInsuranceStore.ts (ou le dossier approprié)

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/api'; // Ajustez le chemin vers votre instance Axios
import type { InsuranceCompanyDto, InsuranceCompanyPayload } from '../../types/InsuranceTypes'; // Ajustez le chemin

interface FetchInsuranceParams {
    hospital_id?: number;
    search?: string;
    [key: string]: any; // Permet d'ajouter d'autres filtres si besoin
}

export default function useInsuranceStore() {
    const [insurances, setInsurances] = useState<InsuranceCompanyDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // 1. Lister les assurances (CORRIGÉ : Accepte page, filtres et perPage)
    const getInsurances = useCallback(async (
        page: number = 1, 
        filters: FetchInsuranceParams = {}, 
        perPage: number = 15
    ) => {
        setLoading(true);
        try {
            const res = await api.get('/admin/insurance-companies', { 
                params: { page, per_page: perPage, ...filters } 
            });
            
            // Supporte à la fois une réponse paginée Laravel (res.data.data) ou un tableau direct (res.data)
            const data = res.data.data ? res.data.data : res.data;
            setInsurances(data);
            
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erreur lors de la récupération des assurances.");
        } finally {
            setLoading(false);
        }
    }, []);

    // 2. Créer une assurance
    const createInsurance = async (data: InsuranceCompanyPayload): Promise<boolean> => {
        setActionLoading(true);
        try {
            await api.post('/admin/insurance-companies', data);
            toast.success("Compagnie d'assurance ajoutée avec succès !");
            return true;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Erreur lors de la création de l'assurance.";
            toast.error(errorMessage);
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // 3. Mettre à jour une assurance
    const updateInsurance = async (id: number, data: Partial<InsuranceCompanyPayload>): Promise<boolean> => {
        setActionLoading(true);
        try {
            await api.put(`/admin/insurance-companies/${id}`, data);
            toast.success("Assurance mise à jour avec succès !");
            return true;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Erreur lors de la mise à jour de l'assurance.";
            toast.error(errorMessage);
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // 4. Supprimer une assurance
    const deleteInsurance = async (id: number): Promise<boolean> => {
        setActionLoading(true);
        try {
            await api.delete(`/admin/insurance-companies/${id}`);
            toast.success("Assurance supprimée avec succès !");
            // Mise à jour optimiste de l'état local
            setInsurances(prev => prev.filter(insurance => insurance.id !== id));
            return true;
        } catch (error: any) {
            toast.error("Erreur lors de la suppression de l'assurance.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        insurances,
        loading,
        actionLoading,
        getInsurances,
        createInsurance,
        updateInsurance,
        deleteInsurance
    };
}