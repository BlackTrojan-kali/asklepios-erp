import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence
import type { PharmacienDto, PharmacienPayload } from "../../types/PharmTypes";

// Interface pour typage des métadonnées de pagination de Laravel
export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const usePharmacienStore = () => {
    // --- ÉTATS ---
    const [pharmaciens, setPharmaciens] = useState<PharmacienDto[]>([]);
    
    // Nouvel état pour gérer la pagination
    const [pagination, setPagination] = useState<PaginationMeta>({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0
    });

    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // --- 1. LISTER & FILTRER (GET /admin/pharmaciens/paginated) ---
    const getPharmaciens = useCallback(async (
        filters: { search?: string, position?: string, branch_id?: number | string, page?: number, per_page?: number } = {}
    ) => {
        try {
            setLoading(true);
            // Utilisation du nouvel endpoint paginé
            const res = await api.get("/admin/pharmaciens/paginated", {
                params: filters
            });
            
            // Laravel retourne le tableau d'items dans la propriété "data"
            setPharmaciens(res.data.data);
            
            // Mise à jour des informations de pagination
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                per_page: res.data.per_page,
                total: res.data.total
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des pharmaciens");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 2. CRÉER UN PHARMACIEN (POST /admin/pharmaciens) ---
    const createPharmacien = async (payload: PharmacienPayload) => {
        try {
            setActionLoading(true);
            
            if (!payload.password) {
                toast.error("Le mot de passe est obligatoire pour la création.");
                return false;
            }

            await api.post("/admin/pharmaciens", payload);
            
            toast.success("Pharmacien enregistré avec succès !");
            // Rafraîchir la liste en restant sur la première page
            await getPharmaciens({ page: 1 }); 
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la création du pharmacien");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 3. MODIFIER UN PHARMACIEN (PUT /admin/pharmaciens/{id}) ---
    const updatePharmacien = async (id: number, payload: PharmacienPayload) => {
        try {
            setActionLoading(true);
            
            const updateData = { ...payload };
            
            if (!updateData.password || updateData.password.trim() === "") {
                delete updateData.password;
            }

            await api.put(`/admin/pharmaciens/${id}`, updateData);
            
            toast.success("Pharmacien mis à jour avec succès !");
            // Rafraîchir la liste en conservant la page actuelle
            await getPharmaciens({ page: pagination.current_page }); 
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

    // --- 4. SUPPRIMER UN PHARMACIEN (DELETE /admin/pharmaciens/{id}) ---
    const deletePharmacien = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/pharmaciens/${id}`);
            
            toast.success("Pharmacien supprimé avec succès !");
            // Rafraîchir la liste sur la page actuelle
            await getPharmaciens({ page: pagination.current_page }); 
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
        pharmaciens,
        pagination, // <-- On exporte l'état de la pagination pour l'utiliser dans le composant
        loading,
        actionLoading,
        getPharmaciens,
        createPharmacien,
        updatePharmacien,
        deletePharmacien
    };
};

export default usePharmacienStore;