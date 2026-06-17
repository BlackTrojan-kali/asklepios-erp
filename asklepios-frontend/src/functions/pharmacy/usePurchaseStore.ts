import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton projet

import type { 
    PurchaseOrderDto, 
    PurchaseOrderPayload, 
    ValidatePurchaseOrderPayload,
    PurchaseReturnDto,
    PurchaseReturnPayload
} from "../../types/PurchaseTypes";

// Interface générique pour la pagination Laravel
interface PaginationMeta {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

const usePurchaseStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES)
    // ======================================================
    const [orders, setOrders] = useState<PurchaseOrderDto[]>([]);
    const [ordersMeta, setOrdersMeta] = useState<PaginationMeta | null>(null);

    const [returns, setReturns] = useState<PurchaseReturnDto[]>([]);
    const [returnsMeta, setReturnsMeta] = useState<PaginationMeta | null>(null);

    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // ======================================================
    // 2. GESTION DES ERREURS
    // ======================================================
    const handleError = (error: unknown, defaultMessage: string) => {
        if (axios.isAxiosError(error)) {
            const responseData = error.response?.data;
            if (responseData?.errors) {
                // Affiche la première erreur de validation trouvée
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
    // 3. COMMANDES FOURNISSEURS (PURCHASE ORDERS)
    // ======================================================

    const getOrders = useCallback(async (params: any = {}) => {
        try {
            setLoading(true);
            const res = await api.get("/admin/purchase-orders", { params });
            // Laravel renvoie les données paginées dans `data.data` et les métadonnées autour
            setOrders(res.data.data || []);
            setOrdersMeta({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total,
                per_page: res.data.per_page
            });
        } catch (error) {
            toast.error("Erreur lors de la récupération des commandes.");
        } finally {
            setLoading(false);
        }
    }, []);

    const createOrder = async (payload: PurchaseOrderPayload) => {
        try {
            setActionLoading(true);
            await api.post("/admin/purchase-orders", payload);
            toast.success("Commande fournisseur créée avec succès !");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la création de la commande.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const updateOrder = async (id: number, payload: PurchaseOrderPayload) => {
        try {
            setActionLoading(true);
            await api.put(`/admin/purchase-orders/${id}`, payload);
            toast.success("Commande mise à jour avec succès !");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la modification.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const deleteOrder = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/purchase-orders/${id}`);
            toast.success("Commande supprimée.");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la suppression.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const cancelOrder = async (id: number) => {
        try {
            setActionLoading(true);
            await api.post(`/admin/purchase-orders/${id}/cancel`);
            toast.success("Commande annulée avec succès.");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de l'annulation.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const validateOrder = async (id: number, payload: ValidatePurchaseOrderPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post(`/admin/purchase-orders/${id}/validate`, payload);
            toast.success(res.data.message || "Commande réceptionnée et stock mis à jour !");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la réception de la commande.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // ======================================================
    // 4. RETOURS FOURNISSEURS (PURCHASE RETURNS)
    // ======================================================

    const getReturns = useCallback(async (params: any = {}) => {
        try {
            setLoading(true);
            const res = await api.get("/admin/purchase-returns", { params });
            setReturns(res.data.data || []);
            setReturnsMeta({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total,
                per_page: res.data.per_page
            });
        } catch (error) {
            toast.error("Erreur lors de la récupération des retours.");
        } finally {
            setLoading(false);
        }
    }, []);

    const createReturn = async (payload: PurchaseReturnPayload) => {
        try {
            setActionLoading(true);
            await api.post("/admin/purchase-returns", payload);
            toast.success("Retour initié avec succès !");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la création du retour.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const updateReturn = async (id: number, payload: PurchaseReturnPayload) => {
        try {
            setActionLoading(true);
            await api.put(`/admin/purchase-returns/${id}`, payload);
            toast.success("Retour mis à jour !");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la modification du retour.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const deleteReturn = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/purchase-returns/${id}`);
            toast.success("Retour supprimé.");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la suppression du retour.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const cancelReturn = async (id: number) => {
        try {
            setActionLoading(true);
            await api.post(`/admin/purchase-returns/${id}/cancel`);
            toast.success("Retour annulé.");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de l'annulation.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const validateReturn = async (id: number) => {
        try {
            setActionLoading(true);
            const res = await api.post(`/admin/purchase-returns/${id}/validate`);
            toast.success(res.data.message || "Retour validé, le stock a été déduit.");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la validation du retour. Vérifiez vos stocks.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // ======================================================
    // 5. EXPORTS (PDF & EXCEL)
    // ======================================================
    
    // Fonction utilitaire pour télécharger un fichier depuis l'API
    const downloadFile = async (endpoint: string, filename: string, params: any = {}) => {
        try {
            setActionLoading(true);
            const response = await api.get(endpoint, {
                params,
                responseType: 'blob' // CRITIQUE pour télécharger des fichiers
            });
            
            // Création d'un lien invisible pour forcer le téléchargement
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Échec du téléchargement du fichier.");
        } finally {
            setActionLoading(false);
        }
    };

    const exportOrdersPdf = (params: any = {}) => downloadFile('/admin/purchase-orders/export/pdf', 'commandes.pdf', params);
    const exportOrdersExcel = (params: any = {}) => downloadFile('/admin/purchase-orders/export/excel', 'commandes.xlsx', params);
    
    const exportReturnsPdf = (params: any = {}) => downloadFile('/admin/purchase-returns/export/pdf', 'retours.pdf', params);
    const exportReturnsExcel = (params: any = {}) => downloadFile('/admin/purchase-returns/export/excel', 'retours.xlsx', params);

    return {
        // États
        orders,
        ordersMeta,
        returns,
        returnsMeta,
        loading,
        actionLoading,

        // Méthodes Commandes
        getOrders,
        createOrder,
        updateOrder,
        deleteOrder,
        cancelOrder,
        validateOrder,
        
        // Méthodes Retours
        getReturns,
        createReturn,
        updateReturn,
        deleteReturn,
        cancelReturn,
        validateReturn,

        // Exports
        exportOrdersPdf,
        exportOrdersExcel,
        exportReturnsPdf,
        exportReturnsExcel
    };
};

export default usePurchaseStore;