import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/api'; // Ajustez le chemin vers votre configuration Axios
import type { ProfileCeoDto } from '../../types/CeoTypes'; // Ajustez le chemin

export default function useCeoStore() {
    const [ceos, setCeos] = useState<ProfileCeoDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // Récupérer la liste
    const getCeos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/supa/ceos');
            setCeos(res.data.data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erreur lors de la récupération des profils.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Créer un profil
    const createCeo = async (data: any): Promise<boolean> => {
        setActionLoading(true);
        try {
            await api.post('/supa/ceos', data);
            toast.success("Profil de direction créé avec succès !");
            return true;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Erreur lors de la création.";
            toast.error(errorMessage);
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // Mettre à jour un profil
    const updateCeo = async (id: number, data: any): Promise<boolean> => {
        setActionLoading(true);
        try {
            await api.put(`/supa/ceos/${id}`, data);
            toast.success("Profil mis à jour avec succès !");
            return true;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Erreur lors de la mise à jour.";
            toast.error(errorMessage);
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // Supprimer un profil
    const deleteCeo = async (id: number): Promise<boolean> => {
        setActionLoading(true);
        try {
            await api.delete(`/supa/ceos/${id}`);
            toast.success("Profil supprimé avec succès !");
            // Mise à jour de l'état local après suppression
            setCeos(prev => prev.filter(ceo => ceo.id !== id));
            return true;
        } catch (error: any) {
            toast.error("Erreur lors de la suppression.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        ceos,
        loading,
        actionLoading,
        getCeos,
        createCeo,
        updateCeo,
        deleteCeo
    };
}