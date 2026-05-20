import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence
import type { PharmacienDto, PharmacienPayload } from "../../types/PharmTypes";

const usePharmacienStore = () => {
    // --- ÉTATS ---
    const [pharmaciens, setPharmaciens] = useState<PharmacienDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // --- 1. LISTER & FILTRER (GET /admin/pharmaciens) ---
    const getPharmaciens = useCallback(async (
        filters: { search?: string, position?: string, branch_id?: number | string } = {}
    ) => {
        try {
            setLoading(true);
            const res = await api.get<PharmacienDto[]>("/admin/pharmaciens", {
                params: filters
            });
            
            setPharmaciens(res.data);
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
            
            // On s'assure que password est bien défini pour la création
            if (!payload.password) {
                toast.error("Le mot de passe est obligatoire pour la création.");
                return false;
            }

            await api.post("/admin/pharmaciens", payload);
            
            toast.success("Pharmacien enregistré avec succès !");
            await getPharmaciens(); 
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
            
            // Cloner le payload pour pouvoir le nettoyer
            const updateData = { ...payload };
            
            // Si le mot de passe est vide, on le retire de la requête pour ne pas l'écraser
            if (!updateData.password || updateData.password.trim() === "") {
                delete updateData.password;
            }

            await api.put(`/admin/pharmaciens/${id}`, updateData);
            
            toast.success("Pharmacien mis à jour avec succès !");
            await getPharmaciens(); 
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
            await getPharmaciens(); 
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
        loading,
        actionLoading,
        getPharmaciens,
        createPharmacien,
        updatePharmacien,
        deletePharmacien
    };
};

export default usePharmacienStore;