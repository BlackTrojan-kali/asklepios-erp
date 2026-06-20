// ==========================================
// TYPES POUR LES NOTIFICATIONS
// ==========================================

/**
 * Contenu spécifique (payload) de la notification stocké dans la colonne `data` (JSON).
 * Ce format correspond exactement à ce qui est retourné par la méthode `toDatabase()` 
 * dans tes classes de Notification Laravel.
 */
export interface NotificationData {
    type: 'TRANSFER_SHIPPED' | 'ORDER_VALIDATED' | 'STOCK_ALERT' | string;
    title: string;
    message: string;
    action_url?: string;
    
    // Champs dynamiques spécifiques à l'événement (optionnels)
    transfer_id?: number;
    source_pharmacy_id?: number;
    purchase_order_id?: number;
    article_id?: number;
}

/**
 * Interface principale représentant une Notification Laravel.
 * Correspond au modèle DatabaseNotification de Laravel.
 */
export interface NotificationDto {
    id: string; // Les ID de notification Laravel sont des UUID
    type: string; // Ex: "App\Notifications\TransferShippedNotification"
    notifiable_type: string;
    notifiable_id: number;
    data: NotificationData;
    read_at: string | null; // Null si non lue, ISO Date string si lue
    created_at: string;
    updated_at: string;
}

/**
 * Interface de la réponse paginée de l'API /api/notifications
 */
export interface NotificationPaginatedResponse {
    data: NotificationDto[];
    current_page: number;
    last_page: number;
    total: number;
    unread_count: number;
}