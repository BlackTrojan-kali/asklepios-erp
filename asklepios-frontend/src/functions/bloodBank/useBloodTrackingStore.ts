import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api";
import type { BloodTrackingDto, BloodTrackingFilters } from "../../types/BloodManageType";

// Type basique pour la pagination Laravel
interface PaginationState {
    currentPage: number;
    lastPage: number;
    total: number;
}

const useBloodTrackingStore = () => {
    const [trackings, setTrackings] = useState<BloodTrackingDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [pagination, setPagination] = useState<PaginationState | null>(null);

    // --- LISTER LES TRANSFUSIONS (SUIVI) ---
    const getTrackings = useCallback(async (page: number = 1, filters: BloodTrackingFilters = {}, perPage: number = 15) => {
        try {
            setLoading(true);
            const res = await api.get("/hospital/blood-tracking", { 
                params: { page, per_page: perPage, ...filters } 
            });
            
            setTrackings(res.data.data);
            setPagination({
                currentPage: res.data.current_page,
                lastPage: res.data.last_page,
                total: res.data.total,
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération du suivi des transfusions.");
            }
            setTrackings([]);
            setPagination(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- EXPORTER LE RAPPORT PDF ---
    const exportTrackingPdf = async (filters: BloodTrackingFilters = {}, action: 'stream' | 'download' = 'stream') => {
        try {
            setActionLoading(true);
            const toastId = toast.loading("Génération du rapport en cours...");

            const response = await api.get("/hospital/blood-tracking/export-pdf", {
                params: { ...filters, action },
                responseType: 'blob' // Indispensable pour recevoir un fichier
            });

            // Création d'une URL locale pour le fichier Blob
            const url = window.URL.createObjectURL(new Blob([response.data]));

            if (action === 'download') {
                // Forcer le téléchargement direct
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `Suivi_Transfusions_${new Date().toISOString().slice(0,10)}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                // Ouvrir dans un nouvel onglet pour prévisualiser
                window.open(url, '_blank');
            }

            toast.dismiss(toastId);
            toast.success("Rapport généré avec succès !");
            
        } catch (error) {
            toast.dismiss();
            toast.error("Erreur lors de la génération du rapport PDF.");
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    return {
        trackings,
        loading,
        actionLoading,
        pagination,
        getTrackings,
        exportTrackingPdf
    };
};

export default useBloodTrackingStore;