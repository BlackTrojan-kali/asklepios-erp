import React, { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ChevronRight, FileQuestion } from 'lucide-react';
import { MENU_CONFIG,type MenuItemType } from  "../config/menu.config"; // Ajuste le chemin selon ton projet
import { useAuth } from '../contexts/AuthContext';

export const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q')?.toLowerCase() || '';
    const { profile } = useAuth();
    const userRole = profile?.role || '';

    // Fonction récursive pour extraire les liens accessibles
    const getAccessibleLinks = (menu: MenuItemType[], role: string, parentTitle = ""): any[] => {
        let links: any[] = [];

        menu.forEach(item => {
            // Vérification des droits d'accès
            if (item.roles && !item.roles.includes(role)) return;

            const currentTitle = parentTitle ? `${parentTitle} > ${item.title}` : item.title;

            // Si c'est un lien direct
            if (item.path) {
                links.push({
                    title: item.title,
                    breadcrumb: currentTitle,
                    path: item.path,
                    icon: item.icon
                });
            }

            // Parcours des sous-menus
            if (item.subItems) {
                links = [...links, ...getAccessibleLinks(item.subItems, role, currentTitle)];
            }
        });

        return links;
    };

    // Filtrer les liens en fonction de la recherche
    const results = useMemo(() => {
        if (!query) return [];
        const allLinks = getAccessibleLinks(MENU_CONFIG, userRole);
        
        return allLinks.filter(link => 
            link.title.toLowerCase().includes(query) || 
            link.breadcrumb.toLowerCase().includes(query)
        );
    }, [query, userRole]);

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    <Search className="text-[#00a896]" size={28} />
                    Résultats pour "{query}"
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {results.length} résultat(s) trouvé(s) correspondant à vos droits d'accès.
                </p>
            </div>

            {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                    <FileQuestion size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-gray-300">Aucun module trouvé</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                        Nous n'avons trouvé aucune page correspondant à votre recherche ou vous n'avez pas les permissions nécessaires pour y accéder.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.map((result, idx) => (
                        <Link 
                            key={idx} 
                            to={result.path}
                            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-[#00a896] dark:hover:border-[#00a896] transition-all group hover:shadow-md"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-50 dark:bg-gray-900 rounded-lg text-slate-600 dark:text-gray-300 group-hover:text-[#00a896] group-hover:bg-[#00a896]/10 transition-colors">
                                    {result.icon || <Search size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white text-base">
                                        {result.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                                        {result.breadcrumb}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-gray-400 group-hover:text-[#00a896] transform group-hover:translate-x-1 transition-all" />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};