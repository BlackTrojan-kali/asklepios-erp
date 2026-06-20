import React, { useEffect } from 'react';
import { 
    X, CheckCheck, Bell, Loader2, Info, 
    Truck, ShoppingCart, AlertTriangle, ExternalLink 
} from 'lucide-react';
import useNotificationStore from '../../../functions/notifications/useNotificationStore';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationPanel: React.FC<Props> = ({ isOpen, onClose }) => {
    const { 
        notifications, unreadCount, loading, pagination, 
        getNotifications, markAsRead, markAllAsRead 
    } = useNotificationStore();

    // Charger les notifications à l'ouverture du panneau
    useEffect(() => {
        if (isOpen) {
            getNotifications(1);
        }
    }, [isOpen, getNotifications]);

    // Fermer si on clique sur l'overlay (l'arrière-plan sombre)
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    // Formateur de date intuitif
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'À l\'instant';
        if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
        return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
    };

    // Déterminer l'icône selon le type de notification
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'TRANSFER_SHIPPED': return <Truck size={18} className="text-indigo-500" />;
            case 'ORDER_VALIDATED': return <ShoppingCart size={18} className="text-emerald-500" />;
            case 'STOCK_ALERT': return <AlertTriangle size={18} className="text-orange-500" />;
            default: return <Info size={18} className="text-blue-500" />;
        }
    };

    // Action au clic sur une notification
    const handleNotificationClick = async (notif: any) => {
        if (!notif.read_at) {
            await markAsRead(notif.id);
        }
        if (notif.data.action_url) {
            window.location.href = notif.data.action_url; // Redirection
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            onClick={handleOverlayClick}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-50 flex justify-end animate-in fade-in duration-200"
        >
            <div className="w-full max-w-sm h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                
                {/* EN-TÊTE DU PANNEAU */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-slate-50/50 dark:bg-gray-900">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                            <Bell size={18} />
                        </div>
                        <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* BOUTONS D'ACTION RAPIDE */}
                {unreadCount > 0 && (
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                        <button 
                            onClick={markAllAsRead}
                            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                        >
                            <CheckCheck size={14} /> Tout marquer comme lu
                        </button>
                    </div>
                )}

                {/* CORPS : LISTE DES NOTIFICATIONS */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {loading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <Loader2 className="animate-spin mb-2" size={24} />
                            <span className="text-xs">Chargement...</span>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-500">
                            <Bell size={32} className="mb-2 opacity-20" />
                            <span className="text-sm font-medium">Aucune notification</span>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {notifications.map((notif) => {
                                const isUnread = !notif.read_at;
                                
                                return (
                                    <div 
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 relative group
                                            ${isUnread 
                                                ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30' 
                                                : 'bg-white border-transparent hover:bg-slate-50 dark:bg-gray-900 dark:hover:bg-gray-800'
                                            }
                                        `}
                                    >
                                        {/* Point non-lu */}
                                        {isUnread && (
                                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                        )}
                                        
                                        <div className={`mt-0.5 shrink-0 ${isUnread ? 'ml-2' : ''}`}>
                                            {getNotificationIcon(notif.data.type)}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm mb-0.5 ${isUnread ? 'font-bold text-slate-800 dark:text-gray-100' : 'font-semibold text-slate-700 dark:text-gray-300'}`}>
                                                {notif.data.title}
                                            </p>
                                            <p className={`text-xs mb-1.5 line-clamp-2 ${isUnread ? 'text-slate-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500'}`}>
                                                {notif.data.message}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                                    {formatTimeAgo(notif.created_at)}
                                                </span>
                                                {notif.data.action_url && (
                                                    <span className="text-[10px] flex items-center gap-1 font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Voir <ExternalLink size={10} />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {/* Bouton "Charger plus" pour la pagination */}
                    {pagination && pagination.current_page < pagination.last_page && (
                        <div className="mt-4 flex justify-center pb-4">
                            <button 
                                onClick={() => getNotifications(pagination.current_page + 1)}
                                disabled={loading}
                                className="text-xs font-semibold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                            >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : 'Charger les plus anciennes...'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationPanel;