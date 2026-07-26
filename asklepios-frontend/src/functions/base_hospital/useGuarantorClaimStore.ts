import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api";
import type { PaginatedResponse } from "../../types/types";
import type { 
    GuarantorClaimDto, 
    CreateGuarantorClaimPayload, 
    UpdateGuarantorClaimPayload,
    GuarantorClaimFilters
} from "../../types/GuarantorClaimTypes";

export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const useGuarantorClaimStore = () => {
    const [claims, setClaims] = useState<GuarantorClaimDto[]>([]);
    const [currentClaim, setCurrentClaim] = useState<GuarantorClaimDto | null>(null);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // --- GET /shared/guarantor-claims ---
    const getClaims = useCallback(async (
        page: number = 1,
        filters: GuarantorClaimFilters = {},
        perPage: number = 15
    ) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<GuarantorClaimDto>>("/shared/guarantor-claims", {
                params: { page, per_page: perPage, ...filters }
            });

            setClaims(res.data.data || []);
            setPagination({
                currentPage: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
                total: res.data.total || 0
            });
        } catch (error) {
            toast.error("Erreur lors de la récupération des bordereaux.");
            setClaims([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- GET /shared/guarantor-claims/{id} ---
    const getClaimById = useCallback(async (id: number) => {
        try {
            setLoading(true);
            const res = await api.get<GuarantorClaimDto>(`/shared/guarantor-claims/${id}`);
            setCurrentClaim(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de charger les détails du bordereau.");
            setCurrentClaim(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // --- POST /shared/guarantor-claims ---
    const createClaim = async (payload: CreateGuarantorClaimPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post("/shared/guarantor-claims", payload);
            toast.success(res.data.message || "Bordereau créé avec succès !");
            
            await getClaims(1); // Rafraîchit la liste
            return res.data.data as GuarantorClaimDto;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Impossible de créer le bordereau.");
            }
            return null;
        } finally {
            setActionLoading(false);
        }
    };

    // --- PUT /shared/guarantor-claims/{id} ---
    const updateClaim = async (id: number, payload: UpdateGuarantorClaimPayload) => {
        try {
            setActionLoading(true);
            const res = await api.put(`/shared/guarantor-claims/${id}`, payload);
            toast.success(res.data.message || "Bordereau mis à jour.");
            
            // Mise à jour de la liste locale si la pagination existe
            if (pagination) {
                await getClaims(pagination.currentPage);
            }
            // Mise à jour de l'élément courant s'il est affiché
            if (currentClaim && currentClaim.id === id) {
                setCurrentClaim({ ...currentClaim, ...res.data.data });
            }
            
            return res.data.data as GuarantorClaimDto;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur de mise à jour.");
            }
            return null;
        } finally {
            setActionLoading(false);
        }
    };

    // --- DELETE /shared/guarantor-claims/{id} ---
    const deleteClaim = async (id: number) => {
        try {
            setActionLoading(true);
            const res = await api.delete(`/shared/guarantor-claims/${id}`);
            toast.success(res.data.message || "Bordereau supprimé avec succès.");
            
            await getClaims(pagination?.currentPage || 1);
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Impossible de supprimer ce bordereau.");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- GET /shared/guarantor-claims/{id}/download ---
    const downloadClaimPdf = async (id: number, action: 'stream' | 'download' = 'stream') => {
        try {
            setActionLoading(true);
            const res = await api.get(`/shared/guarantor-claims/${id}/download`, {
                params: { action },
                responseType: 'blob' 
            });

            const fileUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));

            if (action === 'download') {
                const link = document.createElement('a');
                link.href = fileUrl;
                link.setAttribute('download', `Bordereau_${id}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                window.open(fileUrl, '_blank');
            }
            return true;
        } catch (error) {
            toast.error("Erreur lors de la génération de l'impression du bordereau.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        claims,
        currentClaim,
        pagination,
        loading,
        actionLoading,
        getClaims,
        getClaimById,
        createClaim,
        updateClaim,
        deleteClaim,
        downloadClaimPdf
    };
};

export default useGuarantorClaimStore;