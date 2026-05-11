import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin
import type { AdminDto, AdminPayload, PaginatedResponse } from "../../types/types";

const useAdminStore = () => {
    // --- ÉTATS ---
    const [admins, setAdmins] = useState<AdminDto[]>([]);
    const [currentAdmin, setCurrentAdmin] = useState<AdminDto | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    
    // Pagination
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0
    });

    // --- 1. LISTER & RECHERCHER (GET /supa/admins) ---
    const getAdmins = useCallback(async (page: number = 1, search: string = '', perPage: number = 10) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<AdminDto>>("/admins", {
                params: { page, search, per_page: perPage }
            });
            
            setAdmins(res.data.data);
            setPagination({
                currentPage: res.data.current_page,
                lastPage: res.data.last_page,
                total: res.data.total
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des administrateurs");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 2. RÉCUPÉRER UN SEUL ADMIN (GET /supa/admins/{id}) ---
    const getAdmin = useCallback(async (id: number) => {
        try {
            setLoading(true);
            const res = await api.get<AdminDto>(`/admins/${id}`);
            setCurrentAdmin(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de trouver cet administrateur");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 3. CRÉER UN ADMIN (POST /supa/admins) ---
    const createAdmin = async (payload: AdminPayload) => {
        try {
            setLoading(true);
            
            // On envoie directement l'objet JSON (pas besoin de FormData ici car pas de fichier)
            const res = await api.post("/admins", payload);
            
            toast.success("Administrateur créé avec succès !");
            await getAdmins(1); // Rafraîchit la liste
            return res.data;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la création");
            }
            return false;
        } finally {
            setLoading(false);
        }
    };

    // --- 4. MODIFIER LES INFOS (PUT /supa/admins/{id}) ---
    const updateAdmin = async (id: number, payload: Omit<AdminPayload, 'password'>) => {
        try {
            setLoading(true);
            
            const res = await api.put(`/admins/${id}`, payload);
            
            toast.success("Informations mises à jour avec succès !");
            await getAdmins(pagination.currentPage); 
            return res.data;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la modification");
            }
            return false;
        } finally {
            setLoading(false);
        }
    };

    // --- 5. MODIFIER LE MOT DE PASSE (PATCH /supa/admins/{id}/password) ---
    const updatePassword = async (id: number, password: string) => {
        try {
            setLoading(true);
            
            await api.patch(`/admins/${id}/password`, { password });
            
            toast.success("Mot de passe mis à jour avec succès !");
            return true;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors du changement de mot de passe");
            }
            return false;
        } finally {
            setLoading(false);
        }
    };

    // --- 6. SUPPRIMER UN ADMIN (DELETE /supa/admins/{id}) ---
    const deleteAdmin = async (id: number) => {
        try {
            setLoading(true);
            await api.delete(`/admins/${id}`);
            
            toast.success("Administrateur supprimé avec succès !");
            await getAdmins(pagination.currentPage); 
            return true;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la suppression");
            }
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        admins,
        currentAdmin,
        loading,
        pagination,
        getAdmins,
        getAdmin,
        createAdmin,
        updateAdmin,
        updatePassword,
        deleteAdmin
    };
};

export default useAdminStore;