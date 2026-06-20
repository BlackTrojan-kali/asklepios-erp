import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ajuste le chemin selon ton arborescence

import type { 
    NotificationDto, 
    NotificationPaginatedResponse 
} from "../../types/notificationTypes";

const useNotificationStore = () => {
    // ======================================================
    // 1. ÉTATS (STATES)
    // ======================================================
    const [notifications, setNotifications] = useState<NotificationDto[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [pagination, setPagination] = useState<{
        current_page: number;
        last_page: number;
        total: number;
    } | null>(null);

    const [loading, setLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // ======================================================
    // 2. RÉCUPÉRATION DES DONNÉES
    // ======================================================

    /**
     * Récupère l'historique complet des notifications avec pagination
     */
    const getNotifications = useCallback(async (page: number = 1) => {
        try {
            setLoading(true);
            const res = await api.get<NotificationPaginatedResponse>("/notifications", { 
                params: { page } 
            });
            
            setNotifications(res.data.data || []);
            setUnreadCount(res.data.unread_count || 0);
            
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                console.error("Erreur lors de la récupération des notifications", error);
                // On évite le toast d'erreur ici pour ne pas polluer l'UI en cas de micro-coupure réseau
            }
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Ping léger pour mettre à jour la "cloche" en arrière-plan
     */
    const getUnreadCount = useCallback(async () => {
        try {
            const res = await api.get<{count: number}>("/notifications/unread-count");
            setUnreadCount(res.data.count);
        } catch (error) {
            console.error("Erreur unread-count", error);
        }
    }, []);

    // ======================================================
    // 3. ACTIONS
    // ======================================================

    /**
     * Marquer une notification spécifique comme lue (Mise à jour Optimiste)
     */
    const markAsRead = async (id: string) => {
        // 1. Optimistic Update : On met à jour l'UI instantanément
        setNotifications(prev => 
            prev.map(notif => 
                notif.id === id && notif.read_at === null 
                    ? { ...notif, read_at: new Date().toISOString() } 
                    : notif
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        // 2. Appel API en arrière-plan
        try {
            await api.patch(`/notifications/${id}/read`);
            return true;
        } catch (error) {
            // Rollback en cas d'erreur serveur (rare)
            getNotifications(pagination?.current_page || 1); 
            return false;
        }
    };

    /**
     * Marquer toutes les notifications comme lues (Mise à jour Optimiste)
     */
    const markAllAsRead = async () => {
        try {
            setActionLoading(true);
            
            // Optimistic update
            setNotifications(prev => 
                prev.map(notif => ({ 
                    ...notif, 
                    read_at: notif.read_at || new Date().toISOString() 
                }))
            );
            setUnreadCount(0);

            // API Call
            await api.post("/notifications/read-all");
            toast.success("Toutes les notifications ont été marquées comme lues.");
            return true;
        } catch (error) {
            toast.error("Erreur lors de la mise à jour des notifications.");
            getNotifications(pagination?.current_page || 1); // Rollback
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        // États
        notifications,
        unreadCount,
        pagination,
        loading,
        actionLoading,

        // Méthodes
        getNotifications,
        getUnreadCount,
        markAsRead,
        markAllAsRead
    };
};

export default useNotificationStore;