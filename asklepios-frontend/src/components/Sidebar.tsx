import React, { useState, useMemo } from 'react';
import { 
    Globe, Hospital, Shield, NotebookText, Settings, 
    Menu, X, ChevronLeft, 
    HospitalIcon,
    Pill
} from 'lucide-react';
// import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SidebarItem from './SidebarItem';

// --- 1. DÉFINITION DES TYPES ---
type SubMenuItem = {
    title: string;
    path: string;
};

type MenuItem = {
    title: string;
    icon: React.ReactNode;
    path?: string;
    roles: string[]; // Les rôles autorisés à voir ce menu
    subItems?: SubMenuItem[];
};

// --- 2. CONFIGURATION GLOBALE DES MENUS ---
// On met TOUS les menus ici. Pas de "if" ! 
// C'est le tableau "roles" de chaque objet qui décide de la sécurité.
const MENU_CONFIG: MenuItem[] = [
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
    //onglets admin
    {
        title: "Centres",
        icon: <HospitalIcon size={20}/>,
        roles:["admin"],
        subItems:[
            {
                title:"centres",
                path:"/admin/centers"
            },{
                title:"Departements",
                path:"/admin/departments"
            }
        ]
    },{
        title:"Pharmacies",
        icon: <Pill size={20}/>,
        roles:["admin"],
        subItems:[
        {
            title:"",
            path:"/admin/pharmacy"
        },
        {
            title:"Ventes",
            path:"/admin/pharmacy/Ventes"
        },
        {
            title:"Versments",
            path:"admin/pharmacy/versements"
        },{
            title:"Pharmaciens",
            path:"admin/pharmacy/users"
        },{
            title:"Stocks",
            path:"admin/pharmacy/users"
        }
        ]
    }
];

// --- 3. COMPOSANT PRINCIPAL : LA SIDEBAR ---
const Sidebar = () => {
    // Le Hook useAuth DOIT être appelé à l'intérieur du composant
    const { profile } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const userRole = profile?.role || "";

    // OPTIMISATION : On ne recalcule le menu que si le rôle change (useMemo)
    const filteredMenu = useMemo(() => {
        if (!userRole) return []; // Sécurité si l'utilisateur n'est pas chargé
        return MENU_CONFIG.filter(item => item.roles.includes(userRole));
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
                    
                    {/* Bouton fermer (Mobile) */}
                    <button className="md:hidden text-gray-500" onClick={() => setIsMobileOpen(false)}>
                        <X size={20} />
                    </button>

                    {/* Bouton Rétracter (Desktop) */}
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