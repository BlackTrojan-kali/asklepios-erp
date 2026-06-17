import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence
import type { ArticleCategoryDto, ArticleCategoryPayload } from "../../types/PharmTypes";

// Interface pour la pagination
export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const useArticleCategoryStore = () => {
    // --- ÉTATS ---
    const [articleCategories, setArticleCategories] = useState<ArticleCategoryDto[]>([]);
    const [allCategories, setAllCategories] = useState<ArticleCategoryDto[]>([]); // Utile pour les selects (ex: parent_category_id)
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false); 
    const [actionLoading, setActionLoading] = useState<boolean>(false); 

    // --- 1. LISTER & FILTRER Paginé (GET /admin/article-categories) ---
    const getArticleCategories = useCallback(async (
        page: number = 1,
        filters: { search?: string } = {}
    ) => {
        try {
            setLoading(true);
            const res = await api.get("/admin/article-categories", {
                params: { page, ...filters }
            });
            
            // Sécurisation de la réponse (paginée ou non)
            const responseData = res.data;
            const categoriesData = responseData.data !== undefined ? responseData.data : responseData;
            
            setArticleCategories(Array.isArray(categoriesData) ? categoriesData : []);
            
            setPagination({
                currentPage: responseData.current_page || 1,
                lastPage: responseData.last_page || 1,
                total: responseData.total || (Array.isArray(categoriesData) ? categoriesData.length : 0)
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des catégories");
            }
            setArticleCategories([]); // Fallback de sécurité
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 1bis. RÉCUPÉRER TOUTES LES CATÉGORIES (GET /admin/article-categories/all) ---
    const getAllArticleCategories = useCallback(async () => {
        try {
            const res = await api.get("/admin/article-categories/all");
            setAllCategories(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Erreur lors de la récupération de la liste complète des catégories", error);
            setAllCategories([]);
        }
    }, []);

    // --- 2. CRÉER UNE CATÉGORIE (POST /admin/article-categories) ---
    const createArticleCategory = async (payload: ArticleCategoryPayload) => {
        try {
            setActionLoading(true);
            await api.post("/admin/article-categories", payload);
            toast.success("Catégorie créée avec succès !");
            
            // Rafraîchir les listes
            await getArticleCategories(1); 
            await getAllArticleCategories();
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
            
            // Rafraîchir les listes
            await getArticleCategories(1); 
            await getAllArticleCategories();
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
            
            // Rafraîchir les listes
            await getArticleCategories(1); 
            await getAllArticleCategories();
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
        allCategories, // Exporté pour les React-Select des modales
        pagination,
        loading,
        actionLoading,
        getArticleCategories,
        getAllArticleCategories,
        createArticleCategory,
        updateArticleCategory,
        deleteArticleCategory
    };
};

export default useArticleCategoryStore;