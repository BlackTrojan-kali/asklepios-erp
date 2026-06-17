import React, { useEffect, useState } from 'react';
import { 
    Package, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Barcode, 
    AlertTriangle, 
    Image as ImageIcon,
    Loader2,
    Tags,
    Layers,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import Swal from 'sweetalert2';
import Select from 'react-select';

// Stores
import useArticleStore from '../../../../functions/pharmacy/useArticleStore'; 
import useArticleCategoryStore from '../../../../functions/pharmacy/useArticleCategoryStore';  // Pour la liste des catégories

// Modèles et Types
import type { ArticleDto } from '../../../../types/PharmTypes';

// Modales
import { CreateArticleModal } from '../../../../components/modals/Pharmacy/Article/CreateArticleModal';
import { UpdateArticleModal } from '../../../../components/modals/Pharmacy/Article/UpdateArticleModal';

const Articles = () => {
    // Hooks des stores
    const { 
        articles, loading, pagination,
        getArticles, deleteArticle 
    } = useArticleStore();

    // On utilise "allCategories" car le store des catégories a aussi été paginé
    // Cela garantit que le menu déroulant affiche toutes les catégories disponibles
    const { 
        allCategories, 
        getAllArticleCategories 
    } = useArticleCategoryStore();

    // États pour les filtres
    const [filters, setFilters] = useState({
        search: '',
        category_id: ''
    });

    // États pour les modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<ArticleDto | null>(null);

    // URL de base pour afficher les images
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // Chargement initial des données
    useEffect(() => {
        getArticles(1, {});
        getAllArticleCategories(); // On charge toutes les catégories pour le filtre et les modales
    }, [getArticles, getAllArticleCategories]);

    // Rafraîchir la liste en conservant la page et la recherche
    const handleRefresh = () => {
        getArticles(pagination?.currentPage || 1, filters);
        getAllArticleCategories();
    };

    // Soumission du formulaire de filtre
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        getArticles(1, filters);
    };

    // Réinitialisation des filtres
    const handleResetFilters = () => {
        setFilters({ search: '', category_id: '' });
        getArticles(1, {});
    };

    // Action : Supprimer un article
    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer cet article ?',
            text: "Cette action le retirera définitivement du catalogue. Les historiques de stocks pourraient être affectés.",
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
            await deleteArticle(id);
        }
    };

    // Préparation des options pour React-Select
    const categoryOptions = allCategories?.map(cat => ({
        value: cat.id.toString(),
        label: cat.parentCategory ? `${cat.parentCategory.name} > ${cat.name}` : cat.name
    })) || [];

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                        <Package size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Catalogue des Articles</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez vos médicaments, consommables et équipements.</p>
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
                        Nouvel Article
                    </button>
                </div>
            </div>

            {/* BARRE DE FILTRES */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Recherche (Nom ou Code-barres)</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Paracétamol, 3700000000000..."
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value})}
                                className="w-full pl-10 pr-4 py-2 min-h-[40px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white transition-colors"
                            />
                        </div>
                    </div>

                    {/* Sélecteur de Catégorie : Strictement forcé en Blanc & Noir via styles inline */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Filtrer par catégorie</label>
                        <Select 
                            options={categoryOptions}
                            value={categoryOptions.find(opt => opt.value === filters.category_id) || null}
                            onChange={(selected) => setFilters({...filters, category_id: selected ? selected.value : ''})}
                            placeholder="Toutes les catégories"
                            isClearable
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    backgroundColor: '#ffffff',
                                    borderColor: state.isFocused ? '#00a896' : '#e5e7eb',
                                    boxShadow: state.isFocused ? '0 0 0 1px #00a896' : 'none',
                                    minHeight: '40px',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer'
                                }),
                                menu: (base) => ({
                                    ...base,
                                    backgroundColor: '#ffffff',
                                    borderRadius: '0.5rem',
                                    zIndex: 50,
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isSelected 
                                        ? '#e6f6f4' 
                                        : state.isFocused 
                                            ? '#f3f4f6' 
                                            : '#ffffff',
                                    color: state.isSelected ? '#00a896' : '#000000', 
                                    cursor: 'pointer',
                                }),
                                singleValue: (base) => ({
                                    ...base,
                                    color: '#000000', 
                                }),
                                input: (base) => ({
                                    ...base,
                                    color: '#000000', 
                                }),
                                placeholder: (base) => ({
                                    ...base,
                                    color: '#6b7280', 
                                }),
                                indicatorSeparator: (base) => ({
                                    ...base,
                                    backgroundColor: '#e5e7eb',
                                }),
                            }}
                        />
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

            {/* TABLEAU DES ARTICLES */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Article</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code-Barres</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seuil d'Alerte</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center">
                                        <Loader2 size={32} className="animate-spin text-[#00a896] mx-auto mb-2" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement du catalogue...</p>
                                    </td>
                                </tr>
                            ) : articles?.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Package size={48} className="mb-3 opacity-50" />
                                            <p>Aucun article trouvé.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                articles?.map((article) => (
                                    <tr key={article.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        
                                        {/* IMAGE & NOM & CATÉGORIE & SUIVI */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {/* Miniature */}
                                                <div className="w-12 h-12 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden">
                                                    {article.image_url ? (
                                                        <img 
                                                            src={`${baseUrl}${article.image_url}`} 
                                                            alt={article.name} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <ImageIcon size={20} className="text-gray-300 dark:text-gray-600" />
                                                    )}
                                                </div>
                                                
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 dark:text-gray-200">{article.name}</span>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400">
                                                            <Tags size={12} />
                                                            {article.category?.name || "Sans catégorie"}
                                                        </div>
                                                        <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium border ${article.track_batches ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}>
                                                            <Layers size={10} />
                                                            {article.track_batches ? "Lots suivis" : "Matériel générique"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        {/* CODE BARRES */}
                                        <td className="p-4">
                                            {article.barcode ? (
                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-700 dark:text-gray-300">
                                                    <Barcode size={14} />
                                                    {article.barcode}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs italic">N/A</span>
                                            )}
                                        </td>

                                        {/* SEUIL D'ALERTE */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-gray-300">
                                                <AlertTriangle size={16} className={article.global_min_qty > 0 ? "text-amber-500" : "text-gray-300 dark:text-gray-600"} />
                                                {article.global_min_qty} unités
                                            </div>
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button 
                                                    onClick={() => setSelectedArticle(article)} 
                                                    title="Modifier" 
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(article.id)} 
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
                {!loading && articles?.length > 0 && pagination && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Page <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.currentPage}</span> sur <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.lastPage}</span>
                            <span className="ml-2 hidden sm:inline">({pagination.total} articles)</span>
                        </span>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => getArticles(pagination.currentPage - 1, filters)}
                                disabled={pagination.currentPage === 1}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button 
                                onClick={() => getArticles(pagination.currentPage + 1, filters)}
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
            <CreateArticleModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                categories={allCategories}
            />

            <UpdateArticleModal 
                isOpen={!!selectedArticle} 
                onClose={() => setSelectedArticle(null)} 
                article={selectedArticle}
                categories={allCategories}
            />

        </div>
    );
};

export default Articles;