import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence
import type { ProviderDto, ProviderPayload } from "../../types/ProviderTypes";

const useProviderStore = () => {
    // --- ÉTATS ---
    const [providers, setProviders] = useState<ProviderDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // --- FONCTION UTILITAIRE : Gérer les erreurs Laravel ---
    const handleError = (error: unknown, defaultMessage: string) => {
        if (axios.isAxiosError(error)) {
            const responseData = error.response?.data;
            if (responseData?.errors) {
                const firstError = Object.values(responseData.errors)[0] as string[];
                toast.error(firstError[0]);
            } else {
                toast.error(responseData?.message || defaultMessage);
            }
        } else {
            toast.error(defaultMessage);
        }
    };

    // --- 1. LISTER & FILTRER (GET /admin/providers) ---
    const getProviders = useCallback(async (
        filters: { search?: string } = {}
    ) => {
        try {
            setLoading(true);
            const res = await api.get<ProviderDto[]>("/admin/providers", {
                params: filters
            });
            setProviders(res.data);
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des fournisseurs");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 2. CRÉER UN FOURNISSEUR (POST /admin/providers) ---
    const createProvider = async (payload: ProviderPayload) => {
        try {
            setActionLoading(true);
            await api.post("/admin/providers", payload);
            toast.success("Fournisseur enregistré avec succès !");
            await getProviders(); 
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la création du fournisseur");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 3. MODIFIER UN FOURNISSEUR (PUT /admin/providers/{id}) ---
    const updateProvider = async (id: number, payload: ProviderPayload) => {
        try {
            setActionLoading(true);
            await api.put(`/admin/providers/${id}`, payload);
            toast.success("Fournisseur mis à jour avec succès !");
            await getProviders(); 
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la modification");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 4. SUPPRIMER UN FOURNISSEUR (DELETE /admin/providers/{id}) ---
    const deleteProvider = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/providers/${id}`);
            toast.success("Fournisseur supprimé avec succès !");
            await getProviders(); 
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la suppression");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // ==========================================
    // EXPORTATION & IMPORTATION
    // ==========================================

    // --- 5. TÉLÉCHARGER LE PDF ---
    const exportPdf = async () => {
        try {
            setActionLoading(true);
            toast.loading("Génération du PDF en cours...", { id: "export-pdf" });
            
            const response = await api.get('/admin/providers/export/pdf', {
                responseType: 'blob', // Indispensable pour traiter un fichier
            });
            
            // Création d'un lien temporaire pour forcer le téléchargement
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `fournisseurs_${new Date().getTime()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success("PDF téléchargé !", { id: "export-pdf" });
        } catch (error) {
            handleError(error, "Erreur lors de l'exportation PDF");
        } finally {
            setActionLoading(false);
        }
    };

    // --- 6. TÉLÉCHARGER L'EXCEL ---
    const exportExcel = async () => {
        try {
            setActionLoading(true);
            toast.loading("Génération du fichier Excel en cours...", { id: "export-excel" });
            
            const response = await api.get('/admin/providers/export/excel', {
                responseType: 'blob',
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `fournisseurs_${new Date().getTime()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success("Fichier Excel téléchargé !", { id: "export-excel" });
        } catch (error) {
            handleError(error, "Erreur lors de l'exportation Excel");
        } finally {
            setActionLoading(false);
        }
    };

    // --- 7. IMPORTER UN FICHIER EXCEL ---
    const importExcel = async (file: File) => {
        try {
            setActionLoading(true);
            toast.loading("Importation en cours, veuillez patienter...", { id: "import-excel" });
            
            // L'envoi de fichier nécessite un FormData
            const formData = new FormData();
            formData.append('file', file);

            await api.post('/admin/providers/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            toast.success("Importation terminée avec succès !", { id: "import-excel" });
            await getProviders(); // On rafraîchit la liste pour voir les nouveaux fournisseurs
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de l'importation. Vérifiez le format de votre fichier.");
            return false;
        } finally {
            toast.dismiss("import-excel");
            setActionLoading(false);
        }
    };

    return {
        providers,
        loading,
        actionLoading,
        getProviders,
        createProvider,
        updateProvider,
        deleteProvider,
        exportPdf,
        exportExcel,
        importExcel
    };
};

export default useProviderStore;