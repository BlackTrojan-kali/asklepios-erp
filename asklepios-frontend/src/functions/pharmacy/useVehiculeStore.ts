import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence

import type { VehiculeDto, VehiculePayload } from "../../types/vehiculeTypes";
import type { PaginatedResponse } from "../../types/types";

const useVehiculeStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES)
    // ======================================================
    const [vehicules, setVehicules] = useState<VehiculeDto[]>([]);
    const [currentVehicule, setCurrentVehicule] = useState<VehiculeDto | null>(null);
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
    // 3. LOGISTIQUE & CRUD (API AUTOMOBILE)
    // ======================================================

    // LISTER AVEC FILTRES ET PAGINATION (GET /admin/vehicules)
    const getVehicules = useCallback(async (params: any = {}) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<VehiculeDto>>("/admin/vehicules", { params });
            
            setVehicules(res.data.data || []);
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                per_page: res.data.per_page,
                total: res.data.total
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des véhicules.");
            }
            setVehicules([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // VOIR LES DÉTAILS D'UN VÉHICULE (GET /admin/vehicules/{id})
    const getVehiculeById = useCallback(async (id: number) => {
        try {
            setLoading(true);
            const res = await api.get<VehiculeDto>(`/admin/vehicules/${id}`);
            setCurrentVehicule(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de charger les détails du véhicule.");
            setCurrentVehicule(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // CRÉER UN VÉHICULE (POST /admin/vehicules)
    const createVehicule = async (payload: VehiculePayload) => {
        try {
            setActionLoading(true);
            const res = await api.post("/admin/vehicules", payload);
            toast.success(res.data?.message || "Véhicule ajouté avec succès !");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de l'ajout du véhicule.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // MODIFIER UN VÉHICULE (PUT /admin/vehicules/{id})
    const updateVehicule = async (id: number, payload: VehiculePayload) => {
        try {
            setActionLoading(true);
            const res = await api.put(`/admin/vehicules/${id}`, payload);
            toast.success(res.data?.message || "Véhicule mis à jour !");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la modification du véhicule.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // SUPPRIMER UN VÉHICULE DU PARC (DELETE /admin/vehicules/{id})
    const deleteVehicule = async (id: number) => {
        try {
            setActionLoading(true);
            const res = await api.delete(`/admin/vehicules/${id}`);
            toast.success(res.data?.message || "Véhicule supprimé du parc.");
            return true;
        } catch (error) {
            handleError(error, "Erreur lors de la suppression du véhicule.");
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
            const response = await api.get("/admin/vehicules/export/excel", {
                params,
                responseType: 'blob' // Indispensable pour éviter la corruption du fichier zip/xlsx
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `parc_vehicules_${Date.now()}.xlsx`);
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
            
            // Préparation de l'envoi de fichier asynchrone standard HTML5
            const formData = new FormData();
            formData.append("file", file);

            const res = await api.post("/admin/vehicules/import", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            toast.success(res.data?.message || "Données importées avec succès !");
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
        vehicules,
        currentVehicule,
        pagination,
        loading,
        actionLoading,

        // Méthodes CRUD
        getVehicules,
        getVehiculeById,
        createVehicule,
        updateVehicule,
        deleteVehicule,
        
        // Méthodes Échanges Fichiers
        exportExcel,
        importExcel
    };
};

export default useVehiculeStore;    