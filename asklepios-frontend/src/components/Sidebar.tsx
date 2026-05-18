import React, { useState, useMemo } from 'react';
import { 
    Globe, Hospital, Shield, NotebookText, Settings, 
    Menu, X, ChevronLeft, 
    HospitalIcon,
    Pill
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SidebarItem from './SidebarItem';

// --- 1. DÉFINITION DES TYPES ---
// Type unique et récursif : un item peut contenir un tableau de ce même type
export type MenuItemType = {
    title: string;
    icon?: React.ReactNode; // L'icône est optionnelle pour les sous-menus
    path?: string;
    roles?: string[]; // Les rôles (généralement appliqués aux menus parents)
    subItems?: MenuItemType[]; // <- LA RÉCURSIVITÉ EST ICI
};

// --- 2. CONFIGURATION GLOBALE DES MENUS ---
const MENU_CONFIG: MenuItemType[] = [
    {
        title: "Pays",
        icon: <Globe size={20} />,
        path: "/countries",
        roles: ["super_admin"],
    },
    {
        title: "Hôpitaux",
        icon: <Hospital size={20} />,
        path: "/hospitals",
        roles: ["super_admin"],
    },
    {
        title: "Admins",
        icon: <Shield size={20}/>,
        path: "/admins",
        roles: ["super_admin"],
    },
    {
        title: "Licences & Souscriptions",
        icon: <NotebookText size={20} />,
        roles: ["super_admin"],
        subItems: [
            { title: "Licences", path: "/licences" },
            { title: "Souscriptions", path: "/subscriptions" },
        ]
    },
    {
        title: "Paramètres",
        icon: <Settings size={20} />,
        path: "/settings",
        roles: ["super_admin"],
    },
    // Onglets Admin
    {
        title: "Centres",
        icon: <HospitalIcon size={20}/>,
        roles:["admin"],
        subItems:[
            {
                title:"Centres",
                path:"/admin/centers"
            },
            {
                title:"Départements",
                path:"/admin/departments"
            }
        ]
    },
    {
        title:"Pharmacies",
        icon: <Pill size={20}/>,
        roles:["admin"],
        subItems:[
            {
                title:"Pharmacies",
                path:"/admin/pharmacies"
            },
            {
                title:"Articles",
                  subItems: [
                     { title: "Categories", path: "/admin/pharmacy/acticles-categories" },
                     { title: "Mouvements", path: "/admin/pharmacy/stocks/movements" }
                 ]
            },
            {
                title:"Versements",
                path:"/admin/pharmacy/versements"
            },
            {
                title:"Pharmaciens",
                path:"/admin/pharmacy/users"
            },
            {
                title:"Stocks",
                path:"/admin/pharmacy/users",
                // EXEMPLE DE SOUS-SOUS-MENU (Tu peux en rajouter à l'infini)
                // subItems: [
                //     { title: "Inventaire", path: "/admin/pharmacy/stocks/inventory" },
                //     { title: "Mouvements", path: "/admin/pharmacy/stocks/movements" }
                // ]
            }
        ]
    }
];

// --- 3. COMPOSANT PRINCIPAL : LA SIDEBAR ---
const Sidebar = () => {
    const { profile } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const userRole = profile?.role || "";

    const filteredMenu = useMemo(() => {
        if (!userRole) return []; 
        return MENU_CONFIG.filter(item => item.roles?.includes(userRole));
    }, [userRole]);

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
                            Menu - {userRole.replace('_', ' ')}
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
                        <p className="text-xs text-center text-gray-400 mt-4">Aucun accès défini.</p>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;