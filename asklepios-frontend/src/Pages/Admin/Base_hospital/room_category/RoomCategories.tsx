import React, { useEffect, useState } from 'react';
import { 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Loader2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Building2,
    BedDouble,
    Coins
} from 'lucide-react';
import Swal from 'sweetalert2';

// --- STORES ---
import useRoomCategoryStore from '../../../../functions/base_hospital/useRoomCategoryStore';
import useCenterStore from '../../../../functions/center/useCenterStore'; 

// --- TYPES ---
import type { RoomCategoryDto } from '../../../../types/RoomCategoryTypes';

// --- MODALES ---
import { CreateRoomCategoryModal } from '../../../../components/modals/Base_hopital/RoomCategory/CreateRoomCategoryModal';
import { UpdateRoomCategoryModal } from '../../../../components/modals/Base_hopital/RoomCategory/UpdateRoomCategoryModal';

const RoomCategories = () => {
    // --- STORES ---
    const { 
        roomCategories, loading, pagination, 
        getRoomCategories, deleteRoomCategory 
    } = useRoomCategoryStore();

    const { centers, getCenters } = useCenterStore();

    // --- ÉTATS ---
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCenterFilter, setSelectedCenterFilter] = useState('');

    // États pour les modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<RoomCategoryDto | null>(null);

    // --- CHARGEMENT INITIAL ---
    useEffect(() => {
        // Chargement des centres pour le filtre (limite à 100 pour tout récupérer d'un coup)
        getCenters(1, {}, 100);
    }, [getCenters]);

    useEffect(() => {
        fetchCategories(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const fetchCategories = (targetPage: number = 1) => {
        getRoomCategories(targetPage, {
            search: searchQuery,
            center_id: selectedCenterFilter
        });
    };

    // Action : Rafraîchir la liste
    const handleRefresh = () => {
        fetchCategories(page);
    };

    // Soumission des filtres
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchCategories(1);
    };

    // Réinitialisation des filtres
    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedCenterFilter('');
        setPage(1);
        getRoomCategories(1, { search: '', center_id: '' });
    };

    // Action : Supprimer une catégorie
    const handleDelete = async (id: number, name: string) => {
        const result = await Swal.fire({
            title: 'Supprimer cette catégorie ?',
            text: `La catégorie "${name}" et ses configurations tarifaires seront définitivement supprimées.`,
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
            await deleteRoomCategory(id);
        }
    };

    // Formatage monétaire
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                        <BedDouble size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Catégories de Chambres</h1>
                            {pagination && (
                                <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                                    {pagination.total} {pagination.total > 1 ? 'catégories' : 'catégorie'}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configurez les types de chambres d'hospitalisation et leurs tarifs par nuitée.</p>
                    </div>
                </div>
                
                {/* Boutons d'actions rapides */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 flex-1 sm:flex-none"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin text-indigo-600" : ""} />
                        <span className="hidden sm:inline">Rafraîchir</span>
                    </button>

                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex-1 sm:flex-none"
                    >
                        <Plus size={18} />
                        Nouvelle Catégorie
                    </button>
                </div>
            </div>

            {/* SECTION DE FILTRES */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    
                    {/* Recherche par nom */}
                    <div className="relative md:col-span-2">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Rechercher une catégorie (ex: VIP, Standard...)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 p-2 min-h-[42px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-sm text-slate-800 dark:text-white transition-colors"
                        />
                    </div>

                    {/* Filtre Centre */}
                    <div>
                        <select
                            value={selectedCenterFilter}
                            onChange={(e) => setSelectedCenterFilter(e.target.value)}
                            className="w-full p-2 min-h-[42px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-sm text-slate-800 dark:text-white transition-colors"
                        >
                            <option value="">Tous les centres</option>
                            {centers.map(center => (
                                <option key={center.id} value={center.id}>{center.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Boutons d'action des filtres */}
                    <div className="flex gap-2">
                        <button 
                            type="submit" 
                            className="flex-1 bg-slate-800 hover:bg-slate-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 min-h-[42px] rounded-lg font-medium transition-colors text-sm shadow-sm"
                        >
                            Filtrer
                        </button>
                        {(searchQuery || selectedCenterFilter) && (
                            <button 
                                type="button"
                                onClick={handleResetFilters}
                                className="px-4 py-2 min-h-[42px] bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border dark:border-gray-600 rounded-lg font-medium transition-colors text-sm"
                            >
                                Effacer
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* LISTE / TABLEAU DES CATÉGORIES */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Catégorie</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Centre Médical</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prix par nuitée</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-2" />
                                        <p className="text-gray-500 dark:text-gray-400">Chargement des catégories...</p>
                                    </td>
                                </tr>
                            ) : roomCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <BedDouble size={48} className="mb-3 opacity-40 text-indigo-500" />
                                            <p className="font-medium">Aucune catégorie de chambre configurée.</p>
                                            <p className="text-xs text-gray-400 mt-1">Créez votre première catégorie pour commencer à tarifer les hospitalisations.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                roomCategories.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        
                                        {/* NOM DE LA CATÉGORIE */}
                                        <td className="p-4 font-bold text-slate-800 dark:text-gray-200">
                                            {item.name}
                                        </td>

                                        {/* CENTRE MÉDICAL AFFECTÉ */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                                                <Building2 size={16} className="text-gray-400" />
                                                <span className="font-medium">{item.center?.name || 'Non spécifié'}</span>
                                            </div>
                                        </td>

                                        {/* TARIF PAR NUITÉE */}
                                        <td className="p-4 font-semibold text-emerald-600 dark:text-emerald-400">
                                            <div className="flex items-center gap-1.5">
                                                <Coins size={16} className="text-gray-400" />
                                                <span>{formatPrice(item.price_per_night)}</span>
                                            </div>
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button 
                                                    onClick={() => setSelectedCategory(item)} 
                                                    title="Modifier la catégorie" 
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id, item.name)} 
                                                    title="Supprimer la catégorie" 
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PIED DE PAGE / PAGINATION */}
                {!loading && roomCategories.length > 0 && pagination && pagination.lastPage > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Page <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.currentPage}</span> sur <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.lastPage}</span>
                        </span>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPage(page - 1)}
                                disabled={pagination.currentPage === 1}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button 
                                onClick={() => setPage(page + 1)}
                                disabled={pagination.currentPage === pagination.lastPage}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* RENDU DES MODALES */}
            <CreateRoomCategoryModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                centers={centers}
            />

            <UpdateRoomCategoryModal 
                isOpen={!!selectedCategory} 
                onClose={() => setSelectedCategory(null)} 
                category={selectedCategory}
                centers={centers}
            />

        </div>
    );
};

export default RoomCategories;