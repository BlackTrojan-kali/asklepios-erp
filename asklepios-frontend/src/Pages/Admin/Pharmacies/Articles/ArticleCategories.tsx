import React, { useEffect, useState } from 'react';
import { 
    Tags, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    FolderTree, 
    CornerDownRight, 
    Loader2, 
    AlignLeft,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import Swal from 'sweetalert2';

// Stores
import useArticleCategoryStore from '../../../../functions/pharmacy/useArticleCategoryStore';

// Modèles et Types
import type { ArticleCategoryDto } from '../../../../types/PharmTypes';

// Modales
import { CreateArticleCategoryModal } from '../../../../components/modals/Pharmacy/Article_category/CreateArticleCategoryModal';
import { UpdateArticleCategoryModal } from '../../../../components/modals/Pharmacy/Article_category/UpdateArticleCategoryModal';

const ArticleCategories = () => {
    // Hook du store (Mise à jour avec la pagination et allCategories)
    const { 
        articleCategories, 
        allCategories,
        pagination,
        loading, 
        getArticleCategories, 
        getAllArticleCategories,
        deleteArticleCategory 
    } = useArticleCategoryStore();

    // États pour les filtres
    const [filters, setFilters] = useState({
        search: ''
    });

    // États pour les modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<ArticleCategoryDto | null>(null);

    // Chargement initial des données
    useEffect(() => {
        getArticleCategories(1, {}); // Page 1 par défaut
        getAllArticleCategories();   // Charge la liste complète pour les Selects des modales
    }, [getArticleCategories, getAllArticleCategories]);

    // Rafraîchir la liste en conservant la page et la recherche
    const handleRefresh = () => {
        getArticleCategories(pagination?.currentPage || 1, filters);
        getAllArticleCategories(); // On met aussi à jour la liste complète en arrière-plan
    };

    // Soumission du formulaire de filtre
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        getArticleCategories(1, filters); // Retour à la page 1 lors d'une recherche
    };

    // Réinitialisation des filtres
    const handleResetFilters = () => {
        setFilters({ search: '' });
        getArticleCategories(1, {});
    };

    // Action : Supprimer une catégorie
    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer cette catégorie ?',
            text: "Attention : Si cette catégorie possède des sous-catégories, elles seront également supprimées (cascade). Les articles liés pourraient perdre leur classification.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, supprimer',
            customClass: {
                popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200'
            }
        });
        
        if (result.isConfirmed) {
            await deleteArticleCategory(id);
        }
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg">
                        <FolderTree size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Catégories d'Articles</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Organisez et hiérarchisez les articles de la pharmacie et des stocks.</p>
                    </div>
                </div>
                
                {/* Actions (Rafraîchir & Ajouter) */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
                        title="Rafraîchir la liste"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin text-[#00a896]" : ""} />
                        <span className="hidden sm:inline">Rafraîchir</span>
                    </button>

                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center justify-center gap-2 bg-[#00a896] hover:bg-[#008f7e] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex-1 sm:flex-none"
                    >
                        <Plus size={18} />
                        Nouvelle Catégorie
                    </button>
                </div>
            </div>

            {/* BARRE DE FILTRES */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    
                    <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Recherche rapide</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Rechercher par nom ou description..."
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value})}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            type="submit" 
                            className="flex-1 bg-slate-800 hover:bg-slate-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex justify-center items-center gap-2 min-h-[40px]"
                        >
                            <Search size={16} /> Filtrer
                        </button>
                        <button 
                            type="button"
                            onClick={handleResetFilters}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border dark:border-gray-600 rounded-lg font-medium transition-colors text-sm min-h-[40px]"
                        >
                            Réinitialiser
                        </button>
                    </div>
                </form>
            </div>

            {/* TABLEAU DES CATÉGORIES */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Catégorie</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center">
                                        <Loader2 size={32} className="animate-spin text-[#00a896] mx-auto mb-2" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des catégories...</p>
                                    </td>
                                </tr>
                            ) : articleCategories?.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Tags size={48} className="mb-3 opacity-50" />
                                            <p>Aucune catégorie trouvée.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                articleCategories?.map((category) => (
                                    <tr key={category.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        
                                        {/* NOM & HIÉRARCHIE */}
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                {/* Affichage du parent si c'est une sous-catégorie */}
                                                {category.parentCategory && (
                                                    <div className="flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500">
                                                        <FolderTree size={12} />
                                                        {category.parentCategory.name}
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-center gap-2">
                                                    {category.article_category_id ? (
                                                        <CornerDownRight size={16} className="text-gray-300 dark:text-gray-600" />
                                                    ) : (
                                                        <Tags size={16} className="text-[#00a896]" />
                                                    )}
                                                    <span className={`font-bold ${category.article_category_id ? 'text-slate-600 dark:text-gray-300' : 'text-slate-800 dark:text-white'}`}>
                                                        {category.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        {/* DESCRIPTION */}
                                        <td className="p-4">
                                            <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-gray-400">
                                                <AlignLeft size={16} className="mt-0.5 flex-shrink-0 opacity-50" />
                                                <span className="line-clamp-2">{category.description || <span className="italic text-gray-400">Aucune description</span>}</span>
                                            </div>
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button 
                                                    onClick={() => setSelectedCategory(category)} 
                                                    title="Modifier" 
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(category.id)} 
                                                    title="Supprimer" 
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {!loading && articleCategories?.length > 0 && pagination && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Page <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.currentPage}</span> sur <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.lastPage}</span>
                            <span className="ml-2 hidden sm:inline">({pagination.total} catégories)</span>
                        </span>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => getArticleCategories(pagination.currentPage - 1, filters)}
                                disabled={pagination.currentPage === 1}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button 
                                onClick={() => getArticleCategories(pagination.currentPage + 1, filters)}
                                disabled={pagination.currentPage === pagination.lastPage}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALES */}
            {/* On passe la liste complète `allCategories` pour alimenter le React-Select des parents sans être limité par la pagination */}
            <CreateArticleCategoryModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)}
                categories={allCategories} 
            />

            <UpdateArticleCategoryModal 
                isOpen={!!selectedCategory} 
                onClose={() => setSelectedCategory(null)} 
                category={selectedCategory}
                categories={allCategories}
            />

        </div>
    );
};

export default ArticleCategories;