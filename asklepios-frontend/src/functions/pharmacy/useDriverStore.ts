import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence

import type { DriverDto, DriverPayload } from "../../types/driverTypes";
import type { PaginatedResponse } from "../../types/types";

const useDriverStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES)
    // ======================================================
    const [drivers, setDrivers] = useState<DriverDto[]>([]);
    const [currentDriver, setCurrentDriver] = useState<DriverDto | null>(null);
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
    // 3. LOGISTIQUE & CRUD (API CHAUFFEURS)
    // ======================================================

    // LISTER AVEC FILTRES ET PAGINATION (GET /admin/drivers)
    const getDrivers = useCallback(async (params: any = {}) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<DriverDto>>("/admin/drivers", { params });
            
            setDrivers(res.data.data || []);
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                per_page: res.data.per_page,
                total: res.data.total
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des chauffeurs.");
            }
            setDrivers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // VOIR LES DÉTAILS D'UN CHAUFFEUR (GET /admin/drivers/{id})
    const getDriverById = useCallback(async (id: number) => {
        try {
            setLoading(true);
            const res = await api.get<DriverDto>(`/admin/drivers/${id}`);
            setCurrentDriver(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de charger les détails du chauffeur.");
            setCurrentDriver(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // CRÉER UN CHAUFFEUR (POST /admin/drivers)
    const createDriver = async (payload: DriverPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post("/admin/drivers", payload);
            toast.success(res.data?.message || "Chauffeur ajouté avec succès !");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de l'ajout du chauffeur.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // MODIFIER UN CHAUFFEUR (PUT /admin/drivers/{id})
    const updateDriver = async (id: number, payload: DriverPayload) => {
        try {
            setActionLoading(true);
            const res = await api.put(`/admin/drivers/${id}`, payload);
            toast.success(res.data?.message || "Informations du chauffeur mises à jour !");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la modification du chauffeur.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // SUPPRIMER UN CHAUFFEUR (DELETE /admin/drivers/{id})
    const deleteDriver = async (id: number) => {
        try {
            setActionLoading(true);
            const res = await api.delete(`/admin/drivers/${id}`);
            toast.success(res.data?.message || "Chauffeur supprimé avec succès.");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la suppression du chauffeur.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // ======================================================
    // 4. EXPORTATION EXCEL (BLOB binaire)
    // ======================================================
    const exportExcel = async (params: any = {}) => {
        try {
            setActionLoading(true);
            const response = await api.get("/admin/drivers/export/excel", {
                params,
                responseType: 'blob' 
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `liste_chauffeurs_${Date.now()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Extraction Excel réussie !");
        } catch (error) {
            toast.error("Échec du téléchargement du fichier Excel.");
        } finally {
            setActionLoading(false);
        }
    };

    // ======================================================
    // 5. IMPORTATION EXCEL (Multipart/Form-Data)
    // ======================================================
    const importExcel = async (file: File) => {
        try {
            setActionLoading(true);
            
            const formData = new FormData();
            formData.append("file", file);

            const res = await api.post("/admin/drivers/import", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            toast.success(res.data?.message || "Chauffeurs importés avec succès !");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de l'importation du fichier Excel.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        // États
        drivers,
        currentDriver,
        pagination,
        loading,
        actionLoading,

        // Méthodes CRUD
        getDrivers,
        getDriverById,
        createDriver,
        updateDriver,
        deleteDriver,
        
        // Méthodes Échanges Fichiers
        exportExcel,
        importExcel
    };
};

export default useDriverStore;