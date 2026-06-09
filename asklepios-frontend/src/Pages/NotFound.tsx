import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, ShieldAlert } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 selection:bg-[#00a896] selection:text-white">
            <div className="max-w-md w-full text-center space-y-8">
                
                {/* ICONE ANIMÉE */}
                <div className="relative flex justify-center">
                    <div className="absolute inset-0 bg-[#00a896] blur-[60px] opacity-20 dark:opacity-30 rounded-full animate-pulse"></div>
                    <div className="relative bg-white dark:bg-gray-800 p-6 rounded-full shadow-xl border border-gray-100 dark:border-gray-700">
                        <ShieldAlert size={64} className="text-[#00a896] dark:text-teal-400" />
                    </div>
                </div>

                {/* TEXTE */}
                <div className="space-y-3">
                    <h1 className="text-7xl font-black text-slate-800 dark:text-white tracking-tighter">
                        404
                    </h1>
                    <h2 className="text-2xl font-bold text-slate-700 dark:text-gray-200">
                        Oups ! Page introuvable.
                    </h2>
                    <p className="text-slate-500 dark:text-gray-400 text-sm md:text-base">
                        La page que vous essayez d'atteindre n'existe pas, a été déplacée ou vous n'avez pas les droits nécessaires pour y accéder.
                    </p>
                </div>

                {/* BOUTONS D'ACTION */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors shadow-sm"
                    >
                        <ArrowLeft size={18} />
                        Retour
                    </button>
                    
                
                </div>
                
            </div>
        </div>
    );
};

export default NotFound;