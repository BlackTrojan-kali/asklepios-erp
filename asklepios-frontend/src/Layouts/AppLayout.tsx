import React, { useEffect, type ReactNode } from 'react';
import Header from '../components/Header'; // Ajuste le chemin si besoin
import Sidebar from '../components/Sidebar'; // <-- Import de ta nouvelle Sidebar
import { useTheme } from '../hooks/useTheme'; // Ajuste le chemin si besoin
import { useAuth } from '../contexts/AuthContext';  // Ajuste le chemin si besoin
import { Outlet } from 'react-router-dom';

const AppLayout = ({ children }: { children: ReactNode }) => {
    // 1. On récupère le thème pour activer le Dark Mode Tailwind
    const { theme } = useTheme();
    

    // 2. Activation de la classe 'dark' sur la balise <html>
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    return (
        /* Conteneur principal : prend 100% de l'écran et empêche le scroll global */
        <div className="flex flex-col h-screen overflow-hidden bg-[#faf8f1] dark:bg-gray-900 transition-colors duration-300">
            
            {/* EN-TÊTE (Fixe en haut) */}
            <header className="flex-shrink-0 z-20">
                <Header />
            </header>

            {/* CORPS DE L'APPLICATION (Sidebar à gauche + Contenu à droite) */}
            {/* Ajout de 'relative' pour la gestion de l'overlay mobile de la Sidebar */}
            <div className="flex flex-1 overflow-hidden relative">
                
                {/* INTÉGRATION DE LA SIDEBAR DYNAMIQUE */}
                <Sidebar />

                {/* ZONE DE CONTENU (C'est la seule partie qui va scroller) */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50 dark:bg-gray-950 transition-colors duration-300">
                    {/* Un conteneur central pour limiter la largeur sur les très grands écrans */}
                    <div className="mx-auto max-w-7xl">
                        <Outlet/>
                    </div>
                </main>

            </div>
        </div>
    );
};

export default AppLayout;