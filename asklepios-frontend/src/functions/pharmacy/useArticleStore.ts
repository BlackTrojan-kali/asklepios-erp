import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence
import type { ArticleDto, ArticlePayload } from "../../types/PharmTypes";

// Interface pour la pagination
export interface PaginationData {
    currentPage: number;
    lastPage: number;
    total: number;
}

const useArticleStore = () => {
    // --- ÉTATS ---
    const [articles, setArticles] = useState<ArticleDto[]>([]);
    const [allArticles, setAllArticles] = useState<ArticleDto[]>([]); // Pour les select sans pagination
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // --- FONCTION UTILITAIRE : Convertir le Payload en FormData ---
    const createFormData = (payload: ArticlePayload, isUpdate: boolean = false) => {
        const formData = new FormData();
        
        // Astuce vitale pour Laravel : Si c'est une modification, on simule un PUT via POST
        if (isUpdate) {
            formData.append('_method', 'PUT');
        }

        formData.append('category_id', String(payload.category_id));
        formData.append('name', payload.name);
        
        // Ajout du nouveau champ : Conversion du booléen en chaîne de caractères
        formData.append('track_batches', payload.track_batches ? 'true' : 'false');
        
        if (payload.barcode) {
            formData.append('barcode', payload.barcode);
        }
        
        if (payload.global_min_qty !== "" && payload.global_min_qty !== undefined && payload.global_min_qty !== null) {
            formData.append('global_min_qty', String(payload.global_min_qty));
        }

        // On n'ajoute l'image que si l'utilisateur a réellement sélectionné un nouveau fichier
        if (payload.image instanceof File) {
            formData.append('image', payload.image);
        }

        return formData;
    };

    // --- 1. LISTER & FILTRER Paginé (GET /admin/articles) ---
    const getArticles = useCallback(async (
        page: number = 1,
        filters: { search?: string, category_id?: number | string } = {}
    ) => {
        try {
            setLoading(true);
            const res = await api.get("/admin/articles", {
                params: { page, ...filters }
            });
            
            // Sécurisation de la réponse (paginée ou non)
            const responseData = res.data;
            const articlesData = responseData.data !== undefined ? responseData.data : responseData;
            
            setArticles(Array.isArray(articlesData) ? articlesData : []);
            
            setPagination({
                currentPage: responseData.current_page || 1,
                lastPage: responseData.last_page || 1,
                total: responseData.total || (Array.isArray(articlesData) ? articlesData.length : 0)
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des articles");
            }
            setArticles([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 1bis. RÉCUPÉRER TOUS LES ARTICLES (GET /admin/articles/all) ---
    const getAllArticles = useCallback(async () => {
        try {
            const res = await api.get("/admin/articles/all");
            setAllArticles(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Erreur lors de la récupération du catalogue complet", error);
            setAllArticles([]);
        }
    }, []);

    // --- 2. CRÉER UN ARTICLE (POST /admin/articles) ---
    const createArticle = async (payload: ArticlePayload) => {
        try {
            setActionLoading(true);
            const formData = createFormData(payload, false);
            
            await api.post("/admin/articles", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success("Article créé avec succès !");
            
            // Rafraîchir les listes
            await getArticles(1); 
            await getAllArticles();
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la création de l'article");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 3. MODIFIER UN ARTICLE (POST /admin/articles/{id} avec _method=PUT) ---
    const updateArticle = async (id: number, payload: ArticlePayload) => {
        try {
            setActionLoading(true);
            const formData = createFormData(payload, true);
            
            // ⚠️ Attention : On utilise POST ici à cause du multipart/form-data
            await api.post(`/admin/articles/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success("Article mis à jour avec succès !");
            
            // Rafraîchir les listes
            await getArticles(1); 
            await getAllArticles();
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

    // --- 4. SUPPRIMER UN ARTICLE (DELETE /admin/articles/{id}) ---
    const deleteArticle = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/admin/articles/${id}`);
            toast.success("Article supprimé avec succès !");
            
            // Rafraîchir les listes
            await getArticles(1); 
            await getAllArticles();
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
        articles,
        allArticles, // Liste complète pour les futurs formulaires (entrées de stock, etc.)
        pagination,
        loading,
        actionLoading,
        getArticles,
        getAllArticles,
        createArticle,
        updateArticle,
        deleteArticle
    };
};

export default useArticleStore;