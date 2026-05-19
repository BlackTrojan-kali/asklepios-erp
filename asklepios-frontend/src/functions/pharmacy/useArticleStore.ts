import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence
import type { ArticleDto, ArticlePayload } from "../../types/PharmTypes";

const useArticleStore = () => {
    // --- ÉTATS ---
    const [articles, setArticles] = useState<ArticleDto[]>([]);
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
        
        if (payload.global_min_qty !== "") {
            formData.append('global_min_qty', String(payload.global_min_qty));
        }

        // On n'ajoute l'image que si l'utilisateur a réellement sélectionné un nouveau fichier
        if (payload.image instanceof File) {
            formData.append('image', payload.image);
        }

        return formData;
    };

    // --- 1. LISTER & FILTRER (GET /admin/articles) ---
    const getArticles = useCallback(async (
        filters: { search?: string, category_id?: number | string } = {}
    ) => {
        try {
            setLoading(true);
            const res = await api.get<ArticleDto[]>("/admin/articles", {
                params: filters
            });
            
            setArticles(res.data);
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des articles");
            }
        } finally {
            setLoading(false);
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
            await getArticles(); 
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
            await getArticles(); 
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
            await getArticles(); 
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
        loading,
        actionLoading,
        getArticles,
        createArticle,
        updateArticle,
        deleteArticle
    };
};

export default useArticleStore;