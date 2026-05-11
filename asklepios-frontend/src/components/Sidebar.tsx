import React, { useState } from 'react';
import {  Users, Activity, Pill, 
    TestTube, CalendarDays, Settings, 
 Menu, X, ChevronLeft, 
 Globe,
 Hospital
} from 'lucide-react';
 // Ajuste le chemin
// import { Link, useLocation } from 'react-router-dom'; // Décommente si tu utilises React Router
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
    path?: string; // Optionnel si on a des subItems
    roles: string[]; // Les rôles autorisés à voir ce menu
    subItems?: SubMenuItem[];
};

// --- 2. CONFIGURATION DES MENUS (Le tableau de données) ---
const menuData: MenuItem[] = [
    {
        title: "Pays",
        icon: <Globe size={20} />,
        path: "/countries",
        roles: ["super_admin", "admin", "doctor", "pharmacy", "reception", "laboratory"],
    },
    {
        title: "Hopitals",
        icon: <Hospital size={20} />,
        roles: ["super_admin", "admin"],
        path:"/hospitals"
    },
    {
        title: "Consultations",
        icon: <Activity size={20} />,
        roles: ["super_admin", "doctor"],
        subItems: [
            { title: "Dossiers Patients", path: "/medical/patients" },
            { title: "Ordonnances", path: "/medical/prescriptions" },
        ]
    },
    {
        title: "Laboratoire",
        icon: <TestTube size={20} />,
        roles: ["super_admin", "laboratory", "doctor"],
        path: "/lab/results"
    },
    {
        title: "Pharmacie",
        icon: <Pill size={20} />,
        roles: ["super_admin", "pharmacy"],
        subItems: [
            { title: "Inventaire", path: "/pharmacy/inventory" },
            { title: "Ventes", path: "/pharmacy/sales" },
        ]
    },
    {
        title: "Rendez-vous",
        icon: <CalendarDays size={20} />,
        roles: ["super_admin", "admin", "reception", "doctor"],
        path: "/appointments"
    },
    {
        title: "Paramètres",
        icon: <Settings size={20} />,
        roles: ["super_admin"],
        path: "/settings"
    }
];


// --- 4. COMPOSANT PRINCIPAL : LA SIDEBAR ---
const Sidebar = () => {
    const { profile } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false); // Pour les petits écrans

    // On filtre les menus en fonction du rôle de l'utilisateur
    // Si pas de profil, on retourne un tableau vide par sécurité
    const userRole = profile?.role || "";
    const filteredMenu = menuData.filter(item => item.roles.includes(userRole));

    return (
        <>
            {/* Bouton Mobile (Hamburger) - Visible uniquement sur petit écran */}
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
                {/* En-tête de la Sidebar (Bouton pour rétracter) */}
                <div className={`p-4 flex items-center border-b border-gray-100 dark:border-gray-800 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {!isCollapsed && (
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            Menu - {profile?.role?.replace('_', ' ')}
                        </span>
                    )}
                    
                    {/* Bouton fermer (Mobile) */}
                    <button className="md:hidden text-gray-500" onClick={() => setIsMobileOpen(false)}>
                        <X size={20} />
                    </button>

                    {/* Bouton Rétracter (Desktop) */}
                    <button 
                        className="hidden md:block p-1 text-gray-400 hover:text-brand-blue dark:hover:text-brand-teal transition-colors rounded"
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