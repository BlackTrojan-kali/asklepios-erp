import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin
import type { 
    SubscriptionDto, 
    SubscriptionPayload, 
    SubscriptionPreviewDto,
    PaginatedResponse 
} from "../../types/types";

const useSubscriptionStore = () => {
    // --- ÉTATS ---
    const [subscriptions, setSubscriptions] = useState<SubscriptionDto[]>([]);
    const [currentSubscription, setCurrentSubscription] = useState<SubscriptionDto | null>(null);
    const [previewData, setPreviewData] = useState<SubscriptionPreviewDto | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false); // Pour les boutons (créer, modifier, renouveler)
    
    // Pagination
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0
    });

    // --- 1. LISTER & FILTRER (GET /supa/subscriptions) ---
    // On utilise un objet 'filters' pour passer facilement le pays, l'hôpital ou les dates
    const getSubscriptions = useCallback(async (
        page: number = 1, 
        filters: { country_id?: number | string, hospital_id?: number | string, from_date?: string, to_date?: string } = {}, 
        perPage: number = 10
    ) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<SubscriptionDto>>("/subscriptions", {
                params: { page, per_page: perPage, ...filters }
            });
            
            setSubscriptions(res.data.data);
            setPagination({
                currentPage: res.data.current_page,
                lastPage: res.data.last_page,
                total: res.data.total
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des souscriptions");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 2. RÉCUPÉRER UNE SOUSCRIPTION (GET /supa/subscriptions/{id}) ---
    const getSubscription = useCallback(async (id: number) => {
        try {
            setLoading(true);
            const res = await api.get<SubscriptionDto>(`/subscriptions/${id}`);
            setCurrentSubscription(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de trouver cette souscription");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 3. CRÉER UNE SOUSCRIPTION (POST /supa/subscriptions) ---
    const createSubscription = async (payload: SubscriptionPayload) => {
        try {
            setActionLoading(true);
            const res = await api.post("/subscriptions", payload);
            toast.success("Souscription créée avec succès !");
            await getSubscriptions(1); // Retour à la première page
            return res.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la création");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 4. MODIFIER UNE SOUSCRIPTION (PUT /supa/subscriptions/{id}) ---
    const updateSubscription = async (id: number, payload: SubscriptionPayload) => {
        try {
            setActionLoading(true);
            const res = await api.put(`/subscriptions/${id}`, payload);
            toast.success("Souscription mise à jour avec succès !");
            await getSubscriptions(pagination.currentPage); // Reste sur la même page
            return res.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la modification");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 5. SUPPRIMER (DELETE /supa/subscriptions/{id}) ---
    const deleteSubscription = async (id: number) => {
        try {
            setActionLoading(true);
            await api.delete(`/subscriptions/${id}`);
            toast.success("Souscription supprimée avec succès !");
            await getSubscriptions(pagination.currentPage); 
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

    // --- 6. PRÉVISUALISER LA FACTURE (GET /supa/subscriptions/{id}/preview) ---
    const previewSubscriptionInvoice = async (id: number) => {
        try {
            setActionLoading(true);
            const res = await api.get<SubscriptionPreviewDto>(`/subscriptions/${id}/preview`);
            setPreviewData(res.data);
            return res.data;
        } catch (error) {
            toast.error("Erreur lors du calcul de la facture");
            return null;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 7. RENOUVELER (+30 JOURS) (PATCH /supa/subscriptions/{id}/renew) ---
    const renewSubscription = async (id: number) => {
        try {
            setActionLoading(true);
            await api.patch(`/subscriptions/${id}/renew`);
            toast.success("Abonnement prolongé de 30 jours !");
            await getSubscriptions(pagination.currentPage); 
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors du renouvellement");
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // --- 8. TÉLÉCHARGER LE PDF (GET /supa/subscriptions/{id}/invoice) ---
    const downloadInvoicePDF = async (id: number, hospitalName: string) => {
        try {
            setActionLoading(true);
            toast.loading("Génération de la facture en cours...", { id: "pdf-toast" });

            // On précise à Axios qu'on attend un fichier binaire (Blob) et non du JSON
            const res = await api.get(`/subscriptions/${id}/invoice`, {
                responseType: 'blob' 
            });

            // Si le backend renvoie du JSON au lieu d'un PDF (ex: DomPDF n'est pas installé), 
            // Axios va quand même le traiter comme un Blob. On vérifie le type.
            if (res.data.type === 'application/json') {
                toast.error("Le module PDF n'est pas encore configuré sur le serveur.", { id: "pdf-toast" });
                return false;
            }

            // Création d'une URL temporaire pour forcer le téléchargement dans le navigateur
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            
            // Formatage propre du nom du fichier
            const safeName = hospitalName.replace(/[^A-Za-z0-9]/g, '_');
            link.setAttribute('download', `Facture_Asklepios_${safeName}.pdf`);
            
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success("Facture téléchargée !", { id: "pdf-toast" });
            return true;

        } catch (error) {
            toast.error("Échec du téléchargement de la facture", { id: "pdf-toast" });
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        subscriptions,
        currentSubscription,
        previewData,
        loading,
        actionLoading,
        pagination,
        getSubscriptions,
        getSubscription,
        createSubscription,
        updateSubscription,
        deleteSubscription,
        previewSubscriptionInvoice,
        renewSubscription,
        downloadInvoicePDF
    };
};

export default useSubscriptionStore;