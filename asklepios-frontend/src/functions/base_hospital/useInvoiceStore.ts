import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api";
import type { PaginatedResponse } from "../../types/types";
import type { 
    InvoiceDto, 
    GenerateInvoicePayload, 
    InvoiceReportFilters,
    UnbilledPreviewDto // Nouvel import
} from "../../types/InvoiceTypes";

export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const useInvoiceStore = () => {
    const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
    const [currentInvoice, setCurrentInvoice] = useState<InvoiceDto | null>(null);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // --- GET /shared/invoices ---
    const getInvoices = useCallback(async (
        page: number = 1,
        filters: { center_id?: number; patient_id?: number; patient_code?: string; status?: string } = {},
        perPage: number = 15
    ) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<InvoiceDto>>("/shared/invoices", {
                params: { page, per_page: perPage, ...filters }
            });

            setInvoices(res.data.data || []);
            setPagination({
                currentPage: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
                total: res.data.total || 0
            });
        } catch (error) {
            toast.error("Erreur lors de la récupération des factures.");
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- GET /shared/invoices/{id} ---
    const getInvoiceById = useCallback(async (id: number) => {
        try {
            setLoading(true);
            const res = await api.get<InvoiceDto>(`/shared/invoices/${id}`);
            setCurrentInvoice(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de charger les détails de la facture.");
            setCurrentInvoice(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 👉 NOUVEAU : GET /shared/patients/{patientId}/unbilled-preview ---
    const previewUnbilledForPatient = async (patientId: number): Promise<UnbilledPreviewDto | null> => {
        try {
            setLoading(true);
            const res = await api.get<UnbilledPreviewDto>(`/shared/patients/${patientId}/unbilled-preview`);
            return res.data;
        } catch (error) {
            toast.error("Impossible de charger l'aperçu des soins non facturés.");
            return null;
        } finally {
            setLoading(false);
        }
    };

    // --- POST /shared/visits/{visitId}/generate-invoice ---
    const generateInvoice = async (visitId: number, payload: GenerateInvoicePayload) => {
        try {
            setActionLoading(true);
            const res = await api.post(`/shared/visits/${visitId}/generate-invoice`, payload);
            toast.success(res.data.message || "Facture générée avec succès !");
            return res.data.data as InvoiceDto;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Impossible de générer la facture.");
            }
            return null;
        } finally {
            setActionLoading(false);
        }
    };

    // --- POST /shared/patients/{patientId}/generate-invoice ---
    const generateInvoiceForPatient = async (patientId: number, payload: GenerateInvoicePayload) => {
        try {
            setActionLoading(true);
            const res = await api.post(`/shared/patients/${patientId}/generate-invoice`, payload);
            toast.success(res.data.message || "Facture générée avec succès !");
            
            await getInvoices(1); 
            
            return res.data.data as InvoiceDto;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Impossible de générer la facture.");
            }
            return null;
        } finally {
            setActionLoading(false);
        }
    };

    // --- DELETE /shared/invoices/{id} ---
    const cancelInvoice = async (id: number) => {
        try {
            setActionLoading(true);
            const res = await api.delete(`/shared/invoices/${id}`);
            toast.success(res.data.message || "Facture annulée avec succès.");
            
            await getInvoices(pagination?.currentPage || 1);
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Impossible d'annuler cette facture.");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- GET /shared/invoices/{id}/download ---
    const downloadInvoicePdf = async (id: number, action: 'stream' | 'download' = 'stream') => {
        try {
            setActionLoading(true);
            const res = await api.get(`/shared/invoices/${id}/download`, {
                params: { action },
                responseType: 'blob' 
            });

            const fileUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));

            if (action === 'download') {
                const link = document.createElement('a');
                link.href = fileUrl;
                link.setAttribute('download', `Facture_${id}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                window.open(fileUrl, '_blank');
            }
            return true;
        } catch (error) {
            toast.error("Erreur lors de la génération de l'impression.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- GET /shared/reports/invoices-pdf ---
    const downloadInvoicesReportPdf = async (filters: InvoiceReportFilters) => {
        try {
            setActionLoading(true);
            
            const res = await api.get("/shared/reports/invoices-pdf", {
                params: filters,
                responseType: 'blob'
            });

            const fileUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            
            window.open(fileUrl, '_blank');
            toast.success("Rapport généré avec succès !");
            
            return true;
        } catch (error) {
            toast.error("Impossible de générer le rapport. Vérifiez vos filtres.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        invoices,
        currentInvoice,
        pagination,
        loading,
        actionLoading,
        getInvoices,
        getInvoiceById,
        previewUnbilledForPatient, // 👉 NOUVEAU EXPORTÉ
        generateInvoice,
        cancelInvoice,
        downloadInvoicePdf,
        generateInvoiceForPatient,
        downloadInvoicesReportPdf
    };
};

export default useInvoiceStore;