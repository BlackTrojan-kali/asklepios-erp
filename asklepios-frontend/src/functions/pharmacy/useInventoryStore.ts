import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence

import type { InventoryDto, InventoryPayload } from "../../types/InventoryTypes";

interface PaginationMeta {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

const useInventoryStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES)
    // ======================================================
    const [inventories, setInventories] = useState<InventoryDto[]>([]);
    const [currentInventory, setCurrentInventory] = useState<InventoryDto | null>(null);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // ======================================================
    // 2. FONCTION UTILITAIRE : Gestion des erreurs Laravel
    // ======================================================
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

    // ======================================================
    // 3. ACTIONS LOGISTIQUES & CRUD
    // ======================================================

    // LISTER AVEC FILTRES ET PAGINATION (GET /pharmacy/inventories)
    const getInventories = useCallback(async (params: any = {}) => {
        try {
            setLoading(true);
            const res = await api.get("/pharmacy/inventories", { params });
            setInventories(res.data.data || []);
            setMeta({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total,
                per_page: res.data.per_page
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des inventaires.");
            }
            setInventories([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // VOIR LES DÉTAILS D'UN INVENTAIRE (GET /pharmacy/inventories/{id})
    const getInventoryById = useCallback(async (id: number) => {
        try {
            setLoading(true);
            const res = await api.get<InventoryDto>(`/pharmacy/inventories/${id}`);
            setCurrentInventory(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de charger les lignes de cet inventaire.");
            setCurrentInventory(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // CRÉER UN BROUILLON D'INVENTAIRE (POST /pharmacy/inventories)
    const createInventory = async (payload: InventoryPayload) => {
        try {
            setActionLoading(true);
            await api.post("/pharmacy/inventories", payload);
            toast.success("Brouillon d'inventaire enregistré !");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la création de l'inventaire.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // MODIFIER UN BROUILLON EXISTANT (PUT /pharmacy/inventories/{id})
    const updateInventory = async (id: number, payload: InventoryPayload) => {
        try {
            setActionLoading(true);
            await api.put(`/pharmacy/inventories/${id}`, payload);
            toast.success("Inventaire mis à jour avec succès !");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la modification de l'inventaire.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // SUPPRIMER UN BROUILLON (DELETE /pharmacy/inventories/{id})
    const deleteInventory = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/pharmacy/inventories/${id}`);
            toast.success("Brouillon d'inventaire supprimé.");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la suppression de l'inventaire.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // VALIDER FINALEMENT L'INVENTAIRE ET AJUSTER LES STOCKS (POST /pharmacy/inventories/{id}/validate)
    const validateInventory = async (id: number) => {
        try {
            setActionLoading(true);
            const res = await api.post(`/pharmacy/inventories/${id}/validate`);
            toast.success(res.data?.message || "Inventaire validé, stocks ajustés !");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la validation de l'inventaire.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // ======================================================
    // 4. EXTRACTIONS ET EXPORTS (BLOB)
    // ======================================================
    const downloadFile = async (endpoint: string, filename: string, params: any = {}) => {
        try {
            setActionLoading(true);
            const response = await api.get(endpoint, {
                params,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("Échec du téléchargement du rapport d'inventaire.");
        } finally {
            setActionLoading(false);
        }
    };

    const exportPdf = (params: any = {}) => 
        downloadFile('/pharmacy/inventories/export/pdf', `rapport_inventaires_${Date.now()}.pdf`, params);

    const exportExcel = (params: any = {}) => 
        downloadFile('/pharmacy/inventories/export/excel', `journal_inventaires_${Date.now()}.xlsx`, params);

    return {
        // États
        inventories,
        currentInventory,
        meta,
        loading,
        actionLoading,

        // Méthodes
        getInventories,
        getInventoryById,
        createInventory,
        updateInventory,
        deleteInventory,
        validateInventory,
        exportPdf,
        exportExcel
    };
};

export default useInventoryStore;