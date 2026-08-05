import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajustez le chemin selon votre arborescence
import type { 
    BloodRefrigeratorDto, 
    BloodRefrigeratorPayload,
    BloodRefrigeratorFilters 
} from "../../types/BloodManageType"; // Ajustez le chemin

// Interface pour la pagination
export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const useBloodRefrigeratorStore = () => {
    // --- ÉTATS ---
    const [bloodRefrigerators, setBloodRefrigerators] = useState<BloodRefrigeratorDto[]>([]);
    const [allRefrigerators, setAllRefrigerators] = useState<BloodRefrigeratorDto[]>([]); // Utile pour les selects (ex: assigner une poche à un frigo)
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false); 
    const [actionLoading, setActionLoading] = useState<boolean>(false); 

    // --- 1. LISTER & FILTRER Paginé (GET /admin/blood-refrigerators) ---
    const getBloodRefrigerators = useCallback(async (
        page: number = 1,
        filters: BloodRefrigeratorFilters = {}
    ) => {
        try {
            setLoading(true);
            const res = await api.get("/admin/blood-refrigerators", {
                params: { page, ...filters }
            });
            
            // Sécurisation de la réponse paginée
            const responseData = res.data;
            const fridgesData = responseData.data !== undefined ? responseData.data : responseData;
            
            setBloodRefrigerators(Array.isArray(fridgesData) ? fridgesData : []);
            
            setPagination({
                currentPage: responseData.current_page || 1,
                lastPage: responseData.last_page || 1,
                total: responseData.total || (Array.isArray(fridgesData) ? fridgesData.length : 0)
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des réfrigérateurs");
            }
            setBloodRefrigerators([]); // Fallback de sécurité
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 1bis. RÉCUPÉRER TOUS LES RÉFRIGÉRATEURS SANS PAGINATION (Optionnel, utile pour les formulaires) ---
    const getAllBloodRefrigerators = useCallback(async (filters: BloodRefrigeratorFilters = {}) => {
        try {
            // On peut forcer une limite très haute pour tout récupérer d'un coup
            const res = await api.get("/admin/blood-refrigerators", {
                params: { ...filters, per_page: 500 }
            });
            
            const responseData = res.data;
            const fridgesData = responseData.data !== undefined ? responseData.data : responseData;
            
            setAllRefrigerators(Array.isArray(fridgesData) ? fridgesData : []);
        } catch (error) {
            console.error("Erreur lors de la récupération de la liste complète", error);
            setAllRefrigerators([]);
        }
    }, []);

    // --- 2. CRÉER UN RÉFRIGÉRATEUR (POST /admin/blood-refrigerators) ---
    const createBloodRefrigerator = async (payload: BloodRefrigeratorPayload) => {
        try {
            setActionLoading(true);
            await api.post("/admin/blood-refrigerators", payload);
            toast.success("Réfrigérateur ajouté avec succès !");
            
            // Rafraîchir les listes (page 1)
            await getBloodRefrigerators(1); 
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de l'ajout du réfrigérateur");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 3. MODIFIER UN RÉFRIGÉRATEUR (PUT /admin/blood-refrigerators/{id}) ---
    const updateBloodRefrigerator = async (id: number, payload: Partial<BloodRefrigeratorPayload>) => {
        try {
            setActionLoading(true);
            await api.put(`/admin/blood-refrigerators/${id}`, payload);
            toast.success("Réfrigérateur mis à jour avec succès !");
            
            // Rafraîchir les listes
            await getBloodRefrigerators(pagination?.currentPage || 1); 
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

    // --- 4. SUPPRIMER UN RÉFRIGÉRATEUR (DELETE /admin/blood-refrigerators/{id}) ---
    const deleteBloodRefrigerator = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/blood-refrigerators/${id}`);
            toast.success("Réfrigérateur supprimé avec succès !");
            
            // Rafraîchir les listes
            await getBloodRefrigerators(pagination?.currentPage || 1); 
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
        bloodRefrigerators,
        allRefrigerators,
        pagination,
        loading,
        actionLoading,
        getBloodRefrigerators,
        getAllBloodRefrigerators,
        createBloodRefrigerator,
        updateBloodRefrigerator,
        deleteBloodRefrigerator
    };
};

export default useBloodRefrigeratorStore;