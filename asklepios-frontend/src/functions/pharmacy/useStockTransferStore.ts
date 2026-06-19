import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste selon ton arborescence

import type { StockTransferDto, StockTransferPayload } from "../../types/transferTypes";
import type { PaginatedResponse } from "../../types/types";

const useStockTransferStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES)
    // ======================================================
    const [transfers, setTransfers] = useState<StockTransferDto[]>([]);
    const [currentTransfer, setCurrentTransfer] = useState<StockTransferDto | null>(null);
    const [pagination, setPagination] = useState<{
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    } | null>(null);
    
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // ======================================================
    // 2. FONCTION UTILITAIRE : Gérer les erreurs Laravel
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
    // 3. LOGISTIQUE & OPÉRATIONS (API TRANSFERTS)
    // ======================================================

    /**
     * Lister les transferts avec filtres et pagination.
     * @param params Filtres (status, start_date, end_date, pharmacy_id...)
     * @param role 'pharmacy' (défaut) ou 'admin' pour taper sur la bonne route API
     */
    const getTransfers = useCallback(async (params: any = {}, role: 'pharmacy' | 'admin' = 'pharmacy') => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<StockTransferDto>>(`/${role}/stock-transfers`, { params });
            
            setTransfers(res.data.data || []);
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                per_page: res.data.per_page,
                total: res.data.total
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération de l'historique des transferts.");
            }
            setTransfers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Initier un nouveau transfert (Réservé au Magasinier)
     */
    const createTransfer = async (payload: StockTransferPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post("/pharmacy/stock-transfers", payload);
            toast.success(res.data?.message || "Transfert initié avec succès !");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de l'initiation du transfert.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    /**
     * Réceptionner un transfert (Réservé à la Pharmacie de destination)
     */
    const receiveTransfer = async (id: number) => {
        try {
            setActionLoading(true);
            const res = await api.post(`/pharmacy/stock-transfers/${id}/receive`);
            toast.success(res.data?.message || "Transfert réceptionné avec succès. Stocks mis à jour !");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la réception du transfert.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    /**
     * Annuler un transfert initié (Réservé à la Pharmacie source)
     */
    const cancelTransfer = async (id: number) => {
        try {
            setActionLoading(true);
            const res = await api.post(`/pharmacy/stock-transfers/${id}/cancel`);
            toast.success(res.data?.message || "Transfert annulé. Stocks restitués.");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de l'annulation du transfert.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // ======================================================
    // 4. EXPORTATION PDF
    // ======================================================
    
    /**
     * Exporter le rapport des transferts en PDF.
     * @param params Filtres appliqués à l'export
     * @param role 'pharmacy' ou 'admin'
     */
    const exportPdf = async (params: any = {}, role: 'pharmacy' | 'admin' = 'pharmacy') => {
        try {
            setActionLoading(true);
            const response = await api.get(`/${role}/stock-transfers/export/pdf`, {
                params,
                responseType: 'blob' // Indispensable pour la génération de fichiers
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Rapport_Transferts_Stock_${Date.now()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Rapport PDF généré avec succès !");
        } catch (error) {
            toast.error("Échec du téléchargement du rapport PDF.");
        } finally {
            setActionLoading(false);
        }
    };

    return {
        // États
        transfers,
        currentTransfer,
        pagination,
        loading,
        actionLoading,

        // Opérations
        getTransfers,
        createTransfer,
        receiveTransfer,
        cancelTransfer,
        exportPdf
    };
};

export default useStockTransferStore;