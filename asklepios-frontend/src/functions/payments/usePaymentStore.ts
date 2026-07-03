import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api";
import type { PaginatedResponse } from "../../types/types";

// Importation des types depuis ton fichier PaymentTypes existant
import type { 
    PaymentInvoiceDto, 
    CreatePaymentPayload, 
    UpdatePaymentPayload,
    PaymentReportFilters // 👉 Nouvel import
} from "../../types/PaymentTypes";

export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const usePaymentStore = () => {
    // ======================================================
    // ÉTATS (STATES)
    // ======================================================
    const [payments, setPayments] = useState<PaymentInvoiceDto[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // ======================================================
    // ACTIONS API
    // ======================================================

    // --- LISTER LES PAIEMENTS (Historique de caisse) ---
    // GET /shared/payments
    const getPayments = useCallback(async (
        page: number = 1,
        filters: { invoice_id?: number; center_id?: number } = {},
        perPage: number = 15
    ) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<PaymentInvoiceDto>>("/shared/payments", {
                params: { page, per_page: perPage, ...filters }
            });

            setPayments(res.data.data || []);
            setPagination({
                currentPage: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
                total: res.data.total || 0
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération de l'historique des paiements.");
            }
            setPayments([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- ENREGISTRER UN PAIEMENT ---
    // POST /shared/payments
    const createPayment = async (payload: CreatePaymentPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post("/shared/payments", payload);
            
            toast.success("Paiement enregistré avec succès.");
            
            return res.data; 
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de l'encaissement.");
            }
            return null;
        } finally {
            setActionLoading(false);
        }
    };

    // --- MODIFIER UN PAIEMENT (Admin uniquement) ---
    // PUT /admin/payments/{id}
    const updatePayment = async (id: number, payload: UpdatePaymentPayload) => {
        try {
            setActionLoading(true);
            const res = await api.put(`/admin/payments/${id}`, payload);
            
            toast.success("Paiement modifié avec succès.");
            
            // Rafraîchir la liste localement
            await getPayments(pagination?.currentPage || 1);
            
            return res.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la modification du paiement.");
            }
            return null;
        } finally {
            setActionLoading(false);
        }
    };

    // --- SUPPRIMER UN PAIEMENT (Admin uniquement) ---
    // DELETE /admin/payments/{id}
    const deletePayment = async (id: number) => {
        try {
            setActionLoading(true);
            const res = await api.delete(`/admin/payments/${id}`);
            
            toast.success(res.data.message || "Paiement annulé. La facture a été recalculée.");
            
            // Rafraîchir la liste localement
            await getPayments(pagination?.currentPage || 1);
            
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de l'annulation du paiement.");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // 👉 NOUVEAU : EXPORTER LE RAPPORT DES PAIEMENTS (POINT DE CAISSE)
    // GET /shared/reports/payments-pdf
    const downloadPaymentsReportPdf = async (filters: PaymentReportFilters) => {
        try {
            setActionLoading(true);
            
            const res = await api.get("/shared/reports/payments-pdf", {
                params: filters,
                responseType: 'blob' // Indispensable pour récupérer un fichier (PDF)
            });

            // Création d'une URL locale pour ouvrir le PDF
            const fileUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            
            // Ouverture dans un nouvel onglet
            window.open(fileUrl, '_blank');
            toast.success("Point de caisse généré avec succès !");
            
            return true;
        } catch (error) {
            toast.error("Impossible de générer le rapport. Vérifiez vos filtres.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        // États
        payments,
        pagination,
        loading,
        actionLoading,

        // Actions
        getPayments,
        createPayment,
        updatePayment,
        deletePayment,
        downloadPaymentsReportPdf // 👉 Export de la nouvelle fonction
    };
};

export default usePaymentStore;