import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence
import type { LicenceDto, LicencePayload, PaginatedResponse } from "../../types/types";

const useLicenceStore = () => {
    // --- ÉTATS ---
    const [licences, setLicences] = useState<LicenceDto[]>([]);
    const [currentLicence, setCurrentLicence] = useState<LicenceDto | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    
    // Pagination
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0
    });

    // --- 1. LISTER & RECHERCHER (GET /supa/licences) ---
    const getLicences = useCallback(async (page: number = 1, search: string = '', perPage: number = 10) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<LicenceDto>>("/licences", {
                params: { page, search, per_page: perPage }
            });
            
            setLicences(res.data.data);
            setPagination({
                currentPage: res.data.current_page,
                lastPage: res.data.last_page,
                total: res.data.total
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des licences");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 2. RÉCUPÉRER UNE SEULE LICENCE (GET /supa/licences/{id}) ---
    const getLicence = useCallback(async (id: number) => {
        try {
            setLoading(true);
            const res = await api.get<LicenceDto>(`/supa/licences/${id}`);
            setCurrentLicence(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de trouver cette licence");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 3. CRÉER UNE LICENCE (POST /supa/licences) ---
    const createLicence = async (payload: LicencePayload) => {
        try {
            setLoading(true);
            
            const res = await api.post("/licences", payload);
            
            toast.success("Licence créée avec succès !");
            await getLicences(1); // Rafraîchit la liste en revenant à la première page
            return res.data;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la création de la licence");
            }
            return false;
        } finally {
            setLoading(false);
        }
    };

    // --- 4. MODIFIER UNE LICENCE (PUT /supa/licences/{id}) ---
    const updateLicence = async (id: number, payload: LicencePayload) => {
        try {
            setLoading(true);
            
            const res = await api.put(`/licences/${id}`, payload);
            
            toast.success("Licence mise à jour avec succès !");
            await getLicences(pagination.currentPage); // Rafraîchit la page courante
            return res.data;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la modification de la licence");
            }
            return false;
        } finally {
            setLoading(false);
        }
    };

    // --- 5. SUPPRIMER UNE LICENCE (DELETE /supa/licences/{id}) ---
    const deleteLicence = async (id: number) => {
        try {
            setLoading(true);
            
            await api.delete(`/licences/${id}`);
            
            toast.success("Licence supprimée avec succès !");
            await getLicences(pagination.currentPage); // Rafraîchit la page courante
            return true;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la suppression de la licence");
            }
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        licences,
        currentLicence,
        loading,
        pagination,
        getLicences,
        getLicence,
        createLicence,
        updateLicence,
        deleteLicence
    };
};

export default useLicenceStore;