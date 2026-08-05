import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajustez selon votre arborescence
import type { 
    BloodBagDto, 
    BloodBagPayload,
    BloodBagFilters,
    PaginationData // Peut être importé depuis l'un des autres stores si vous l'avez exporté
} from "../../types/BloodManageType"; 

const useBloodBagStore = () => {
    // --- ÉTATS ---
    const [bloodBags, setBloodBags] = useState<BloodBagDto[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    
    const [loading, setLoading] = useState<boolean>(false); 
    const [actionLoading, setActionLoading] = useState<boolean>(false); 
    const [exportLoading, setExportLoading] = useState<boolean>(false);

    // --- 1. LISTER & FILTRER (GET /admin/blood-bags) ---
    const getBloodBags = useCallback(async (
        page: number = 1,
        filters: BloodBagFilters = {}
    ) => {
        try {
            setLoading(true);
            const res = await api.get("/admin/blood-bags", {
                params: { page, ...filters }
            });
            
            const responseData = res.data;
            const bagsData = responseData.data !== undefined ? responseData.data : responseData;
            
            setBloodBags(Array.isArray(bagsData) ? bagsData : []);
            
            setPagination({
                currentPage: responseData.current_page || 1,
                lastPage: responseData.last_page || 1,
                total: responseData.total || (Array.isArray(bagsData) ? bagsData.length : 0)
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération du stock de sang.");
            }
            setBloodBags([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 2. CRÉER UNE POCHE DE SANG (POST /admin/blood-bags) ---
    const createBloodBag = async (payload: BloodBagPayload) => {
        try {
            setActionLoading(true);
            await api.post("/admin/blood-bags", payload);
            toast.success("Poche de sang enregistrée avec succès !");
            await getBloodBags(1); 
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement de la poche.");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 3. MODIFIER UNE POCHE (PUT /admin/blood-bags/{id}) ---
    const updateBloodBag = async (id: number, payload: Partial<BloodBagPayload>) => {
        try {
            setActionLoading(true);
            await api.put(`/admin/blood-bags/${id}`, payload);
            toast.success("Poche de sang mise à jour !");
            await getBloodBags(pagination?.currentPage || 1); 
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la modification.");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 4. SUPPRIMER UNE POCHE (DELETE /admin/blood-bags/{id}) ---
    const deleteBloodBag = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/blood-bags/${id}`);
            toast.success("Poche de sang supprimée du stock !");
            await getBloodBags(pagination?.currentPage || 1); 
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Impossible de supprimer cette poche.");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 5. EXPORTER LE PDF (GET /admin/blood-bags/export-pdf) ---
    const exportBloodBagsPdf = async (filters: BloodBagFilters = {}) => {
        try {
            setExportLoading(true);
            // Spécifie 'blob' pour indiquer que l'on télécharge un fichier binaire (le PDF)
            const res = await api.get("/admin/blood-bags/export-pdf", {
                params: filters,
                responseType: 'blob' 
            });

            // Création d'une URL temporaire pour forcer le téléchargement
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            
            const dateStr = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `rapport_stock_sang_${dateStr}.pdf`);
            
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success("Rapport PDF généré avec succès.");
        } catch (error) {
            toast.error("Erreur lors de la génération du PDF.");
        } finally {
            setExportLoading(false);
        }
    };

    return {
        bloodBags,
        pagination,
        loading,
        actionLoading,
        exportLoading,
        getBloodBags,
        createBloodBag,
        updateBloodBag,
        deleteBloodBag,
        exportBloodBagsPdf
    };
};

export default useBloodBagStore;