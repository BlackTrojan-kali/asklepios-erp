import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence

import type { StockMovementDto } from "../../types/StockTypes";

// Interface alignée sur la pagination renvoyée par le contrôleur Laravel
interface PaginationMeta {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

const useMoveStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES)
    // ======================================================
    const [movements, setMovements] = useState<StockMovementDto[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // ======================================================
    // 2. RÉCUPÉRATION DES MOUVEMENTS (GET)
    // ======================================================
    const getMovements = useCallback(async (params: any = {}) => {
        try {
            setLoading(true);
            const res = await api.get("/admin/stock-movements", { params });
            
            // Le backend Laravel renvoie les résultats paginés dans res.data.data
            setMovements(res.data.data || []);
            setMeta({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total,
                per_page: res.data.per_page
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la récupération des mouvements de stock.");
            }
            setMovements([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // ======================================================
    // 3. EXPORTS BLOB (PDF & EXCEL)
    // ======================================================
    
    // Fonction générique pour gérer proprement le flux binaire (Blob)
    const downloadFile = async (endpoint: string, filename: string, params: any = {}) => {
        try {
            setActionLoading(true);
            const response = await api.get(endpoint, {
                params,
                responseType: 'blob' // Indispensable pour éviter la corruption du fichier
            });
            
            // Création d'un lien temporaire dans le DOM pour lancer le téléchargement
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("Échec du téléchargement du rapport.");
        } finally {
            setActionLoading(false);
        }
    };

    const exportPdf = (params: any = {}) => 
        downloadFile('/admin/stock-movements/export/pdf', `rapport_mouvements_${Date.now()}.pdf`, params);
        
    const exportExcel = (params: any = {}) => 
        downloadFile('/admin/stock-movements/export/excel', `journal_mouvements_${Date.now()}.xlsx`, params);

    return {
        // États
        movements,
        meta,
        loading,
        actionLoading,

        // Méthodes
        getMovements,
        exportPdf,
        exportExcel
    };
};

export default useMoveStore;