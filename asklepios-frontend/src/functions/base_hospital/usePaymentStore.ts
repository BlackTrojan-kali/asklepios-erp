import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api";
import type { PaginatedResponse } from "../../types/types";
import type { PaymentInvoiceDto, CreatePaymentPayload, UpdatePaymentPayload } from "../../types/PaymentTypes";
import type { PaginationData } from "./useInvoiceStore";

const usePaymentStore = () => {
    const [payments, setPayments] = useState<PaymentInvoiceDto[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // --- GET /shared/payments ---
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
            toast.error("Erreur lors de la récupération des paiements.");
            setPayments([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- POST /shared/payments ---
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

    // --- PUT /admin/payments/{id} ---
    const updatePayment = async (id: number, payload: UpdatePaymentPayload) => {
        try {
            setActionLoading(true);
            const res = await api.put(`/admin/payments/${id}`, payload);
            toast.success("Paiement modifié avec succès.");
            return res.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur de modification.");
            }
            return null;
        } finally {
            setActionLoading(false);
        }
    };

    // --- DELETE /admin/payments/{id} ---
    const deletePayment = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/payments/${id}`);
            toast.success("Paiement annulé. Facture recalculée.");
            
            await getPayments(pagination?.currentPage || 1);
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur d'annulation.");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        payments,
        pagination,
        loading,
        actionLoading,
        getPayments,
        createPayment,
        updatePayment,
        deletePayment
    };
};

export default usePaymentStore;