import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin vers ton instance Axios
import type { HospitalDto, PaginatedResponse } from "../../types/types";

const useHospitalStore = () => {
    // --- ÉTATS ---
    const [hospitals, setHospitals] = useState<HospitalDto[]>([]);
    const [currentHospital, setCurrentHospital] = useState<HospitalDto | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    
    // Pagination
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0
    });

    // --- 1. LISTER & RECHERCHER (GET /supa/hospitals) ---
    const getHospitals = useCallback(async (page: number = 1, search: string = '', perPage: number = 10) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<HospitalDto>>("/hospitals", {
                params: { page, search, per_page: perPage }
            });
            
            setHospitals(res.data.data);
            setPagination({
                currentPage: res.data.current_page,
                lastPage: res.data.last_page,
                total: res.data.total
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des hôpitaux");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 2. RÉCUPÉRER UN SEUL HÔPITAL (GET /supa/hospitals/{id}) ---
    const getHospital = useCallback(async (id: number) => {
        try {
            setLoading(true);
            const res = await api.get<HospitalDto>(`/hospitals/${id}`);
            setCurrentHospital(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de trouver cet hôpital");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 3. CRÉER UN HÔPITAL (POST /supa/hospitals) ---
// --- 3. CRÉER UN HÔPITAL ---
const createHospital = async (payload: HospitalDto) => {
    try {
        setLoading(true);
        
        const formData = new FormData();
        formData.append('name', payload.name);
        if (payload.niu) formData.append('niu', payload.niu);
        if (payload.logo instanceof File) {
            formData.append('logo', payload.logo);
        }

        // ✅ AJOUT DES HEADERS ICI AUSSI
        const res = await api.post("/hospitals", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        toast.success("Hôpital ajouté avec succès !");
        await getHospitals(1); 
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
   // --- 4. MODIFIER UN HÔPITAL ---
// --- 4. MODIFIER UN HÔPITAL ---
const updateHospital = async (id: number, payload: HospitalDto) => {
    try {
        setLoading(true);
        
        // 1. On prépare le FormData
        const formData = new FormData();
        
        // L'astuce Laravel pour faire un PUT avec des fichiers
        formData.append('_method', 'PUT'); 
        formData.append('name', payload.name);
        
        if (payload.niu) {
            formData.append('niu', payload.niu);
        }
        
        // On ajoute le fichier
        if (payload.logo instanceof File) {
            formData.append('logo', payload.logo);
        }

        console.log("Fichier prêt :", formData.get("logo")); // Tu peux le laisser pour vérifier

        // ✅ LA CORRECTION EST ICI : On ajoute les headers pour forcer le format fichier !
        const res = await api.post(`/hospitals/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        toast.success("Hôpital mis à jour avec succès !");
        await getHospitals(pagination.currentPage); 
        return res.data;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            toast.error(error.response?.data?.message || "Erreur lors de la modification");
            console.error("Détails erreur 422 :", error.response?.data?.errors);
        }
        return false;
    } finally {
        setLoading(false);
    }
};
    // --- 5. SUPPRIMER UN HÔPITAL (DELETE /supa/hospitals/{id}) ---
    const deleteHospital = async (id: number) => {
        try {
            setLoading(true);
            await api.delete(`/hospitals/${id}`);
            
            toast.success("Hôpital supprimé avec succès !");
            await getHospitals(pagination.currentPage); // On rafraîchit la page courante
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
        hospitals,
        currentHospital,
        loading,
        pagination,
        getHospitals,
        getHospital,
        createHospital,
        updateHospital,
        deleteHospital
    };
};

export default useHospitalStore;