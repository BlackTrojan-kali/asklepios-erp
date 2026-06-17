import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence
import type { PharmacyBranchDto, PharmacyBranchPayload } from "../../types/PharmTypes";

export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const usePharmacyStore = () => {
    const [pharmacyBranches, setPharmacyBranches] = useState<PharmacyBranchDto[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false); 
    const [actionLoading, setActionLoading] = useState<boolean>(false); 

    // --- 1. LISTER & FILTRER Paginé ---
    const getPharmacyBranches = useCallback(async (
        page: number = 1,
        filters: { search?: string, type?: string } = {}
    ) => {
        try {
            setLoading(true);
            const res = await api.get("/admin/pharmacy-branches", {
                params: { page, ...filters }
            });
            
            // SÉCURITÉ : Vérifie si la réponse est paginée (res.data.data) ou si c'est un tableau direct (res.data)
            const responseData = res.data;
            const branchesData = responseData.data !== undefined ? responseData.data : responseData;
            
            // On s'assure de toujours assigner un tableau
            setPharmacyBranches(Array.isArray(branchesData) ? branchesData : []);
            
            // Sécurisation de la pagination
            setPagination({
                currentPage: responseData.current_page || 1,
                lastPage: responseData.last_page || 1,
                total: responseData.total || (Array.isArray(branchesData) ? branchesData.length : 0)
            });

        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des succursales");
            }
            // En cas d'erreur, on évite le undefined
            setPharmacyBranches([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 2. CRÉER UNE SUCCURSALE ---
    const createPharmacyBranch = async (payload: PharmacyBranchPayload) => {
        try {
            setActionLoading(true);
            await api.post("/admin/pharmacy-branches", payload);
            toast.success("Succursale de pharmacie créée avec succès !");
            await getPharmacyBranches(1); 
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la création de la succursale");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 3. MODIFIER UNE SUCCURSALE ---
    const updatePharmacyBranch = async (id: number, payload: PharmacyBranchPayload) => {
        try {
            setActionLoading(true);
            await api.put(`/admin/pharmacy-branches/${id}`, payload);
            toast.success("Succursale mise à jour avec succès !");
            await getPharmacyBranches(1); 
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

    // --- 4. SUPPRIMER UNE SUCCURSALE ---
    const deletePharmacyBranch = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/pharmacy-branches/${id}`);
            toast.success("Succursale supprimée avec succès !");
            await getPharmacyBranches(1); 
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
        pharmacyBranches,
        pagination,
        loading,
        actionLoading,
        getPharmacyBranches,
        createPharmacyBranch,
        updatePharmacyBranch,
        deletePharmacyBranch
    };
};

export default usePharmacyStore;