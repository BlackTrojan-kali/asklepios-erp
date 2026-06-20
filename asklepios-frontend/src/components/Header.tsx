import { Power, Moon, Sun, Bell, Calendar, AlertTriangle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { logout } from '../functions/auth/AuthMethods';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../contexts/AuthContext';

// Imports Notifications
import useNotificationStore from '../functions/notifications/useNotificationStore';
import { NotificationPanel } from '../components/modals/Notifications/NotificationPanel';

// Imports Souscriptions
import useSubscriptionStore from '../functions/subscriptions/useSubscriptionStore';

const Header = () => {
    const { theme, switchTheme } = useTheme();
    const { profile } = useAuth();
    
    // Store Notifications
    const { unreadCount, getUnreadCount } = useNotificationStore();
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    // Store Souscriptions
    const { mySubscriptionStatus, getMyRemainingDays } = useSubscriptionStore();

    const isDark = theme === "dark";

    // Polling pour actualiser le compteur de notifications régulièrement
    useEffect(() => {
        getUnreadCount(); // Chargement initial
        const interval = setInterval(() => {
            getUnreadCount();
        }, 60000); // Actualise la cloche toutes les minutes (60000 ms)
        
        return () => clearInterval(interval);
    }, [getUnreadCount]);

    // Récupération de l'état de l'abonnement au montage du Header
    useEffect(() => {
        if (profile?.role && profile.role !== 'super_admin') {
            getMyRemainingDays();
        }
    }, [profile?.role, getMyRemainingDays]);

    const handleLogout = async () => {
        await logout();
        location.reload();
    };

    const formattedRole = profile?.role 
        ? profile.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
        : 'Utilisateur';

    // --- RENDU DU BADGE D'ABONNEMENT ---
    const renderSubscriptionBadge = () => {
        if (profile?.role === 'super_admin') return null; // Pas de badge pour le SUPA
        if (!mySubscriptionStatus) return null;

        const { days_remaining, is_expired } = mySubscriptionStatus;

        if (is_expired) {
            return (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800 shadow-sm transition-colors">
                    <AlertTriangle size={12} /> Expiré
                </span>
            );
        }

        const isWarning = days_remaining <= 7;

        return (
            <span 
                className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md border shadow-sm transition-colors cursor-default
                ${isWarning 
                    ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-800'
                    : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                }`}
                title={`Expiration le ${new Date(mySubscriptionStatus.ending_date).toLocaleDateString('fr-FR')}`}
            >
                <Calendar size={12} /> {days_remaining} {days_remaining > 1 ? 'jours restants' : 'jour restant'}
            </span>
        );
    };

    return (
        <>
            <div className="w-full py-2 px-6 shadow-sm border-b transition-colors duration-300 flex justify-between items-center bg-[#faf8f1] border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                
                {/* Côté Gauche : Logo et Nom */}
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Asclépios Logo" className="h-8 w-auto" />
                    <div className="flex flex-col leading-tight">
                        <span className="text-lg font-bold tracking-tight text-[#003366] dark:text-white">
                            Asclépios
                        </span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[#00a896] dark:text-teal-400">
                            ERP - Hospital Management
                        </span>
                    </div>
                </div>

                {/* Centre : Titre Dynamique (Nom + Rôle) ET Abonnement */}
                <div className="hidden md:flex items-center gap-4">
                    <span className="text-xs font-medium px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-2 bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="font-semibold">{profile?.first_name} {profile?.last_name}</span>
                        <span className="text-gray-400 dark:text-gray-500">|</span>
                        <span className="italic">{formattedRole}</span>
                    </span>

                    {/* Affichage des jours restants ici */}
                    {renderSubscriptionBadge()}
                </div>

                {/* Côté Droit : Contrôles */}
                <div className="flex items-center gap-2">
                    
                    {/* BOUTON NOTIFICATIONS */}
                    <button 
                        onClick={() => setIsNotifOpen(true)}
                        className="relative cursor-pointer p-1.5 rounded-full transition-colors text-slate-600 hover:bg-slate-200 dark:text-gray-300 dark:hover:bg-gray-800 mr-1"
                        title="Notifications"
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-[#faf8f1] dark:border-gray-900 shadow-sm animate-in zoom-in">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Bouton Dark Mode */}
                    <button 
                        onClick={switchTheme} 
                        className="cursor-pointer p-1.5 rounded-full transition-colors text-[#003366] hover:bg-[#d1f7f5] dark:text-yellow-400 dark:hover:bg-gray-800"
                        title={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    {/* Séparateur vertical */}
                    <div className="w-px h-5 mx-1 bg-gray-300 dark:bg-gray-700"></div>

                    {/* Bouton Déconnexion */}
                    <button 
                        onClick={handleLogout} 
                        className="cursor-pointer p-1.5 rounded-md transition-colors flex items-center gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
                        title="Se déconnecter"
                    >
                        <Power size={18} />
                        <span className="text-xs font-medium hidden sm:block">Quitter</span>
                    </button>
                </div>
            </div>

            {/* Rendu du Panneau de Notifications */}
            <NotificationPanel 
                isOpen={isNotifOpen} 
                onClose={() => setIsNotifOpen(false)} 
            />
        </>
    );
};

export default Header;