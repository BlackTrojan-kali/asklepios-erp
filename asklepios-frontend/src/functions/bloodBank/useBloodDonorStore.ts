import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajustez le chemin selon votre arborescence
import type { 
    BloodDonorDto, 
    BloodDonorPayload,
    BloodDonorFilters 
} from "../../types/BloodManageType"; // Ajustez le chemin

export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const useBloodDonorStore = () => {
    // --- ÉTATS ---
    const [bloodDonors, setBloodDonors] = useState<BloodDonorDto[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    
    // Loadings spécifiques pour ne pas bloquer l'interface globale
    const [loading, setLoading] = useState<boolean>(false); 
    const [actionLoading, setActionLoading] = useState<boolean>(false); 
    const [exportLoading, setExportLoading] = useState<boolean>(false);
    const [importLoading, setImportLoading] = useState<boolean>(false);

    // --- 1. LISTER & FILTRER (GET /admin/blood-donors) ---
    const getBloodDonors = useCallback(async (
        page: number = 1,
        filters: BloodDonorFilters = {}
    ) => {
        try {
            setLoading(true);
            const res = await api.get("/admin/blood-donors", {
                params: { page, ...filters }
            });
            
            const responseData = res.data;
            const donorsData = responseData.data !== undefined ? responseData.data : responseData;
            
            setBloodDonors(Array.isArray(donorsData) ? donorsData : []);
            
            setPagination({
                currentPage: responseData.current_page || 1,
                lastPage: responseData.last_page || 1,
                total: responseData.total || (Array.isArray(donorsData) ? donorsData.length : 0)
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des donneurs");
            }
            setBloodDonors([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 2. CRÉER UN DONNEUR (POST /admin/blood-donors) ---
    const createBloodDonor = async (payload: BloodDonorPayload) => {
        try {
            setActionLoading(true);
            await api.post("/admin/blood-donors", payload);
            toast.success("Donneur ajouté avec succès !");
            await getBloodDonors(1); 
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de l'ajout du donneur");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 3. MODIFIER UN DONNEUR (PUT /admin/blood-donors/{id}) ---
    const updateBloodDonor = async (id: number, payload: Partial<BloodDonorPayload>) => {
        try {
            setActionLoading(true);
            await api.put(`/admin/blood-donors/${id}`, payload);
            toast.success("Donneur mis à jour avec succès !");
            await getBloodDonors(pagination?.currentPage || 1); 
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

    // --- 4. SUPPRIMER UN DONNEUR (DELETE /admin/blood-donors/{id}) ---
    const deleteBloodDonor = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/blood-donors/${id}`);
            toast.success("Donneur supprimé avec succès !");
            await getBloodDonors(pagination?.currentPage || 1); 
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

    // --- 5. EXPORTER LES DONNEURS (GET /admin/blood-donors/export) ---
    const exportBloodDonors = async (filters: BloodDonorFilters = {}) => {
        try {
            setExportLoading(true);
            // On spécifie blob pour dire à Axios qu'on attend un fichier physique
            const res = await api.get("/admin/blood-donors/export", {
                params: filters,
                responseType: 'blob' 
            });

            // Logique de téléchargement forcé dans le navigateur
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            
            // Format du nom : donneurs_sang_2026-08-02.xlsx
            const dateStr = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `donneurs_sang_${dateStr}.xlsx`);
            
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success("Exportation réussie");
        } catch (error) {
            toast.error("Erreur lors de l'exportation du fichier");
        } finally {
            setExportLoading(false);
        }
    };

    // --- 6. IMPORTER DES DONNEURS (POST /admin/blood-donors/import) ---
    const importBloodDonors = async (file: File, centerId: number | string) => {
        try {
            setImportLoading(true);
            
            // Pour envoyer un fichier, on doit obligatoirement utiliser FormData
            const formData = new FormData();
            formData.append('file', file);
            formData.append('center_id', centerId.toString());

            await api.post("/admin/blood-donors/import", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success("Fichier importé avec succès !");
            // On rafraîchit la liste pour afficher les nouveaux donneurs
            await getBloodDonors(1);
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de l'importation du fichier");
            }
            return false;
        } finally {
            setImportLoading(false);
        }
    };

    return {
        bloodDonors,
        pagination,
        loading,
        actionLoading,
        exportLoading,
        importLoading,
        getBloodDonors,
        createBloodDonor,
        updateBloodDonor,
        deleteBloodDonor,
        exportBloodDonors,
        importBloodDonors
    };
};

export default useBloodDonorStore;