import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence
import type { PharmacyBranchDto, PharmacyBranchPayload } from "../../types/PharmTypes";

const usePharmacyStore = () => {
    // --- ÉTATS ---
    const [pharmacyBranches, setPharmacyBranches] = useState<PharmacyBranchDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false); // Pour le chargement initial/liste
    const [actionLoading, setActionLoading] = useState<boolean>(false); // Pour bloquer les boutons (Création/Modif/Suppr)

    // --- 1. LISTER & FILTRER (GET /admin/pharmacy-branches) ---
    const getPharmacyBranches = useCallback(async (
        filters: { search?: string, type?: string } = {}
    ) => {
        try {
            setLoading(true);
            const res = await api.get<PharmacyBranchDto[]>("/admin/pharmacy-branches", {
                params: filters
            });
            
            setPharmacyBranches(res.data);
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des succursales");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 2. CRÉER UNE SUCCURSALE (POST /admin/pharmacy-branches) ---
    const createPharmacyBranch = async (payload: PharmacyBranchPayload) => {
        try {
            setActionLoading(true);
            await api.post("/admin/pharmacy-branches", payload);
            toast.success("Succursale de pharmacie créée avec succès !");
            
            // On rafraîchit la liste
            await getPharmacyBranches(); 
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

    // --- 3. MODIFIER UNE SUCCURSALE (PUT /admin/pharmacy-branches/{id}) ---
    const updatePharmacyBranch = async (id: number, payload: PharmacyBranchPayload) => {
        try {
            setActionLoading(true);
            await api.put(`/admin/pharmacy-branches/${id}`, payload);
            toast.success("Succursale mise à jour avec succès !");
            
            // On rafraîchit la liste
            await getPharmacyBranches(); 
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

    // --- 4. SUPPRIMER UNE SUCCURSALE (DELETE /admin/pharmacy-branches/{id}) ---
    const deletePharmacyBranch = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/pharmacy-branches/${id}`);
            toast.success("Succursale supprimée avec succès !");
            
            // On rafraîchit la liste pour faire disparaître l'élément
            await getPharmacyBranches(); 
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
        loading,
        actionLoading,
        getPharmacyBranches,
        createPharmacyBranch,
        updatePharmacyBranch,
        deletePharmacyBranch
    };
};

export default usePharmacyStore;