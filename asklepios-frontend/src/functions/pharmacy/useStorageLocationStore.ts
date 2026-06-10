import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence
import type { 
    StorageLocationDto, 
    StorageLocationPayload, 
    AssignStockPayload 
} from "../../types/PharmMagTypes";

const useStorageLocationStore = () => {
    // --- ÉTATS ---
    const [locations, setLocations] = useState<StorageLocationDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // --- FONCTION UTILITAIRE : Gérer les erreurs Laravel ---
    const handleError = (error: unknown, defaultMessage: string) => {
        if (axios.isAxiosError(error)) {
            const responseData = error.response?.data;
            if (responseData?.errors) {
                const firstError = Object.values(responseData.errors)[0] as string[];
                toast.error(firstError[0]);
            } else {
                toast.error(responseData?.message || defaultMessage);
            }
        } else {
            toast.error(defaultMessage);
        }
    };

    // --- 1. LISTER & FILTRER (GET /pharmacien/storage-locations) ---
    const getLocations = useCallback(async (
        filters: { search?: string } = {}
    ) => {
        try {
            setLoading(true);
            const res = await api.get<StorageLocationDto[]>("/pharmacy/storage-locations", {
                params: filters
            });
            setLocations(res.data);
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des emplacements de stockage");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 2. CRÉER UNE ZONE DE RANGEMENT (POST /pharmacien/storage-locations) ---
    const createLocation = async (payload: StorageLocationPayload) => {
        try {
            setActionLoading(true);
            await api.post("/pharmacy/storage-locations", payload);
            toast.success("Zone de rangement créée avec succès !");
            await getLocations(); 
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la création de la zone de rangement");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 3. MODIFIER UNE ZONE DE RANGEMENT (PUT /pharmacien/storage-locations/{id}) ---
    const updateLocation = async (id: number, payload: StorageLocationPayload) => {
        try {
            setActionLoading(true);
            await api.put(`/pharmacy/storage-locations/${id}`, payload);
            toast.success("Zone de rangement mise à jour !");
            await getLocations(); 
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la modification");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 4. SUPPRIMER UNE ZONE DE RANGEMENT (DELETE /pharmacien/storage-locations/{id}) ---
    const deleteLocation = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/pharmacy/storage-locations/${id}`);
            toast.success("Zone de rangement supprimée !");
            await getLocations(); 
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la suppression");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 5. AFFECTER UN STOCK À UN EMPLACEMENT (POST /pharmacien/storage-locations/assign-stock) ---
    const assignStockToLocation = async (payload: AssignStockPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post("/pharmacy/storage-locations/assign-stock", payload);
            
            // On affiche le message renvoyé par le backend (ex: "Article rangé" ou "Article retiré")
            toast.success(res.data?.message || "Stock mis à jour avec succès !");
            
            // Note : L'idéal est de rafraîchir la liste des stocks après cette action, 
            // tu devras appeler ton `getMyBranchStocks()` depuis le composant React où tu utilises cette fonction.
            
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de l'affectation du stock");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        locations,
        loading,
        actionLoading,
        getLocations,
        createLocation,
        updateLocation,
        deleteLocation,
        assignStockToLocation
    };
};

export default useStorageLocationStore;