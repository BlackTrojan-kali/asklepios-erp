import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api";
import type { BagPricingDto, BagPricingPayload, BagPricingFilters } from "../../types/BloodManageType";

const useBagPricingStore = () => {
    const [pricings, setPricings] = useState<BagPricingDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // --- LISTER LES TARIFS (GET /admin/bag-pricings) ---
    const getPricings = useCallback(async (filters: BagPricingFilters = {}) => {
        try {
            setLoading(true);
            const res = await api.get("/admin/bag-pricings", { params: filters });
            setPricings(res.data);
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des tarifs.");
            }
            setPricings([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- CONFIGURER UN TARIF (POST /admin/bag-pricings) ---
    const savePricing = async (payload: BagPricingPayload) => {
        try {
            setActionLoading(true);
            await api.post("/admin/bag-pricings", payload);
            toast.success("Tarif enregistré avec succès !");
            await getPricings({ center_id: payload.center_id }); // Rafraîchir la liste du centre
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement du tarif.");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        pricings,
        loading,
        actionLoading,
        getPricings,
        savePricing
    };
};

export default useBagPricingStore;