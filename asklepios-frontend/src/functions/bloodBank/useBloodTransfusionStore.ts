import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api";
import type { BloodTransfusionDto, BloodTransfusionPayload, BloodTransfusionFilters } from "../../types/BloodManageType";

const useBloodTransfusionStore = () => {
    const [transfusions, setTransfusions] = useState<BloodTransfusionDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // --- LISTER LES TRANSFUSIONS (GET /doctor/transfusions) ---
    const getTransfusions = useCallback(async (filters: BloodTransfusionFilters = {}) => {
        try {
            setLoading(true);
            const res = await api.get("/doctor/transfusions", { params: filters });
            setTransfusions(res.data);
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des transfusions.");
            }
            setTransfusions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- INITIER UNE TRANSFUSION (POST /doctor/transfusions) ---
    const initiateTransfusion = async (payload: BloodTransfusionPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post("/doctor/transfusions", payload);
            toast.success(res.data.message || "Transfusion initiée avec succès !");
            await getTransfusions({ consultation_id: payload.consultation_id }); 
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                // Le backend renvoie des messages spécifiques si la poche n'est pas dispo ou non tarifée
                toast.error(error.response?.data?.message || "Impossible d'initier la transfusion.");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- TERMINER UNE TRANSFUSION (PUT /doctor/transfusions/{id}/finish) ---
    const finishTransfusion = async (id: number, consultationId?: number) => {
        try {
            setActionLoading(true);
            const res = await api.put(`/doctor/transfusions/${id}/finish`);
            toast.success(res.data.message || "Transfusion terminée.");
            // Si on a l'ID de la consultation, on rafraîchit la liste restreinte, sinon on rafraîchit tout
            await getTransfusions(consultationId ? { consultation_id: consultationId } : {});
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la clôture de la transfusion.");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        transfusions,
        loading,
        actionLoading,
        getTransfusions,
        initiateTransfusion,
        finishTransfusion
    };
};

export default useBloodTransfusionStore;