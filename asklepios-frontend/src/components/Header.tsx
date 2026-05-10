import { Power, Moon, Sun, User } from 'lucide-react';
import React from 'react';
import { logout } from '../functions/auth/AuthMethods';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../contexts/AuthContext'; // On importe ton contexte !

const Header = () => {
    const { theme, switchTheme } = useTheme();
    const { profile } = useAuth(); // On récupère les infos de l'utilisateur

    // On garde juste ce booléen pour savoir quelle icône (Soleil/Lune) afficher
    const isDark = theme === "dark";

    const handleLogout = () => {
        logout();
    };

    // Petit formatage sympa pour le rôle (ex: "super_admin" devient "Super Admin")
    const formattedRole = profile?.role 
        ? profile.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
        : 'Utilisateur';

    return (
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

            {/* Centre : Titre Dynamique (Nom + Rôle) */}
            <div className="hidden md:flex items-center">
                <span className="text-xs font-medium px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-2 bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                    {/* Petit point vert pour dire "En ligne" */}
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="font-semibold">{profile?.first_name} {profile?.last_name}</span>
                    <span className="text-gray-400 dark:text-gray-500">|</span>
                    <span className="italic">{formattedRole}</span>
                </span>
            </div>

            {/* Côté Droit : Contrôles */}
            <div className="flex items-center gap-2">
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
    );
};

export default Header;