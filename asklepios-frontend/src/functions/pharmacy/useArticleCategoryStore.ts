import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence
import type { ArticleCategoryDto, ArticleCategoryPayload } from "../../types/PharmTypes";

const useArticleCategoryStore = () => {
    // --- ÉTATS ---
    const [articleCategories, setArticleCategories] = useState<ArticleCategoryDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false); // Chargement de la liste
    const [actionLoading, setActionLoading] = useState<boolean>(false); // Bloque les boutons pendant l'enregistrement

    // --- 1. LISTER & FILTRER (GET /admin/article-categories) ---
    const getArticleCategories = useCallback(async (
        filters: { search?: string } = {}
    ) => {
        try {
            setLoading(true);
            const res = await api.get<ArticleCategoryDto[]>("/admin/article-categories", {
                params: filters
            });
            
            setArticleCategories(res.data);
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des catégories");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 2. CRÉER UNE CATÉGORIE (POST /admin/article-categories) ---
    const createArticleCategory = async (payload: ArticleCategoryPayload) => {
        try {
            setActionLoading(true);
            await api.post("/admin/article-categories", payload);
            toast.success("Catégorie créée avec succès !");
            
            // Rafraîchir la liste automatiquement
            await getArticleCategories(); 
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la création");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 3. MODIFIER UNE CATÉGORIE (PUT /admin/article-categories/{id}) ---
    const updateArticleCategory = async (id: number, payload: ArticleCategoryPayload) => {
        try {
            setActionLoading(true);
            await api.put(`/admin/article-categories/${id}`, payload);
            toast.success("Catégorie mise à jour avec succès !");
            
            // Rafraîchir la liste automatiquement
            await getArticleCategories(); 
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la modification");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 4. SUPPRIMER UNE CATÉGORIE (DELETE /admin/article-categories/{id}) ---
    const deleteArticleCategory = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/article-categories/${id}`);
            toast.success("Catégorie supprimée avec succès !");
            
            // Rafraîchir la liste automatiquement
            await getArticleCategories(); 
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la suppression");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        articleCategories,
        loading,
        actionLoading,
        getArticleCategories,
        createArticleCategory,
        updateArticleCategory,
        deleteArticleCategory
    };
};

export default useArticleCategoryStore;