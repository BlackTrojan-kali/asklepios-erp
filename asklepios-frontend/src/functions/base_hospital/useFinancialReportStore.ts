import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api";
import type { FinancialReportFilters } from "../../types/FinancialReportTypes";

const useFinancialReportStore = () => {
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // --- GET /shared/reports/finance ---
    const generateFinancialReport = async (filters: FinancialReportFilters, forceDownload = false) => {
        try {
            setActionLoading(true);
            
            const res = await api.get("/shared/reports/finance", {
                params: filters,
                responseType: 'blob' // CRITIQUE pour lire le PDF
            });

            const fileUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));

            if (forceDownload) {
                const link = document.createElement('a');
                link.href = fileUrl;
                link.setAttribute('download', `Rapport_${filters.report_type}_${new Date().toISOString().split('T')[0]}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                window.open(fileUrl, '_blank');
            }

            toast.success("Rapport généré avec succès !");
            return true;

        } catch (error) {
            // Lecture de l'erreur JSON même si responseType est configuré en 'blob'
            if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
                const textError = await error.response.data.text();
                try {
                    const jsonError = JSON.parse(textError);
                    toast.error(jsonError.message || "Erreur lors de la génération du rapport.");
                } catch {
                    toast.error("Impossible de générer le rapport.");
                }
            } else {
                toast.error("Erreur serveur lors de la requête.");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        actionLoading,
        generateFinancialReport
    };
};

export default useFinancialReportStore;