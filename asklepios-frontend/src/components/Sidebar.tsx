import React, { useState, useMemo, useEffect } from 'react';
import { Menu, X, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SidebarItem from './SidebarItem';
import { MENU_CONFIG } from '../config/menu.config';
import useSubscriptionStore from '../functions/subscriptions/useSubscriptionStore'; // Ajuste le chemin selon ton dossier

const Sidebar = () => {
    const { profile } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Récupération du statut d'abonnement
    const { mySubscriptionStatus, getMyRemainingDays } = useSubscriptionStore();

    // Extraction du rôle et de la position
    const userRole = profile?.role || "";
    const userPosition = (profile as any)?.profile_pharm?.position || "";

    // Appel API pour récupérer les licences au montage (sauf pour le Super Admin)
    useEffect(() => {
        if (userRole && userRole !== 'super_admin') {
            getMyRemainingDays();
        }
    }, [userRole, getMyRemainingDays]);

    // Extraction de la liste des noms de licences actives depuis le store
    const activeLicences = useMemo(() => {
        if (!mySubscriptionStatus?.licences) return [];
        return mySubscriptionStatus.licences.map(licence => licence.name);
    }, [mySubscriptionStatus]);

    const filteredMenu = useMemo(() => {
        if (!userRole) return []; 
        
        return MENU_CONFIG.filter(item => {
            // 1. Vérifie si l'utilisateur a le bon rôle de base
            const hasRole = item.roles?.includes(userRole);
            if (!hasRole) return false;

            // 2. VÉRIFICATION DE LA LICENCE (Si le menu exige une licence et qu'on n'est pas super_admin)
            if (item.requiredLicence && userRole !== 'super_admin') {
                if (!activeLicences.includes(item.requiredLicence)) {
                    return false; // On cache le menu
                }
            }

            // 3. S'il s'agit du rôle pharmacie ET que le menu cible une position spécifique
            if (userRole === "pharmacy" && item.positions && item.positions.length > 0) {
                return item.positions.includes(userPosition);
            }

            // Pour les autres rôles (admin, super_admin) ayant passé les vérifications précédentes
            return true;
        });
    }, [userRole, userPosition, activeLicences]);

    return (
        <>
            {/* Bouton Mobile (Hamburger) */}
            <button 
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden fixed bottom-4 right-4 z-50 p-3 bg-brand-blue text-white rounded-full shadow-lg"
            >
                <Menu size={24} />
            </button>

            {/* Overlay sombre pour mobile */}
            {isMobileOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Conteneur de la Sidebar */}
            <aside 
                className={`fixed md:relative z-50 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col shadow-sm
                ${isCollapsed ? 'w-20' : 'w-64'} 
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
            >
                {/* En-tête de la Sidebar */}
                <div className={`p-4 flex items-center border-b border-gray-100 dark:border-gray-800 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {!isCollapsed && (
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            Menu - {userRole === 'pharmacy' ? `Pharmacie (${userPosition})` : userRole.replace('_', ' ')}
                        </span>
                    )}
                    
                    <button className="md:hidden text-gray-500" onClick={() => setIsMobileOpen(false)}>
                        <X size={20} />
                    </button>

                    <button 
                        className="hidden md:block p-1 text-gray-400 hover:text-brand-blue dark:hover:text-[#00a896] transition-colors rounded"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>
                
                {/* Liste des menus */}
                <div className="p-3 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {filteredMenu.length > 0 ? (
                        filteredMenu.map((item, index) => (
                            <SidebarItem 
                                key={index} 
                                item={item} 
                                isCollapsed={isCollapsed} 
                                setExpanded={setIsCollapsed} 
                            />
                        ))
                    ) : (
                        <p className="text-xs text-center text-gray-400 mt-4">Aucun accès défini ou licence requise.</p>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;