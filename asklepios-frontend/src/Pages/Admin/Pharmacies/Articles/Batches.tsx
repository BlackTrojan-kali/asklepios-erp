import React, { useEffect, useState } from 'react';
import { 
    Layers, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Calendar, 
    DollarSign,
    Package,
    AlertCircle,
    CheckCircle2,
    Infinity,
    Loader2,
    RefreshCw // <-- NOUVELLE ICÔNE POUR LA SYNCHRONISATION
} from 'lucide-react';
import Swal from 'sweetalert2';

// Stores
import useBatchStore from '../../../../functions/pharmacy/useBatchStore';
import useArticleStore from '../../../../functions/pharmacy/useArticleStore';  // Pour la liste des articles

// Modèles et Types
import type { BatchDto } from '../../../../types/PharmTypes';

// Modales
import { CreateBatchModal } from '../../../../components/modals/Pharmacy/Batch/CreateBatchModal';
import { UpdateBatchModal } from '../../../../components/modals/Pharmacy/Batch/UpdateBatchModal';

const Batches = () => {
    // Hooks des stores
    const { 
        batches, loading, actionLoading, // Ajout de actionLoading pour bloquer les boutons
        getBatches, deleteBatch,
        initializeAllStocks, initializeBatchStock // Nouveaux endpoints
    } = useBatchStore();

    const { 
        articles, 
        getArticles 
    } = useArticleStore();

    // États pour les filtres
    const [filters, setFilters] = useState({
        search: '',
        article_id: ''
    });

    // États pour les modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<BatchDto | null>(null);

    // Chargement initial des données
    useEffect(() => {
        getBatches({});
        getArticles({}); 
    }, [getBatches, getArticles]);

    // Soumission du formulaire de filtre
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        getBatches(filters);
    };

    // Réinitialisation des filtres
    const handleResetFilters = () => {
        setFilters({ search: '', article_id: '' });
        getBatches({});
    };

    // Action : Supprimer un lot
    const handleDelete = async (batch: BatchDto) => {
        if (batch.batch_number === 'STANDARD') {
            Swal.fire({
                title: 'Action non autorisée',
                text: "Il est déconseillé de supprimer le lot STANDARD. Si vous ne vendez plus cet article, supprimez plutôt l'article lui-même du catalogue.",
                icon: 'error',
                confirmButtonColor: '#00a896',
                customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Supprimer ce lot ?',
            text: "Cette action est irréversible et pourrait fausser l'inventaire si des articles de ce lot sont encore en stock.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, supprimer',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });
        
        if (result.isConfirmed) {
            await deleteBatch(batch.id);
        }
    };

    // Action : Synchroniser tous les stocks
    const handleSyncAll = async () => {
        const result = await Swal.fire({
            title: 'Synchroniser tous les stocks ?',
            text: "Cela créera les lignes de stock (à 0) pour tous les lots dans toutes les succursales où ils sont manquants.",
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, synchroniser',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });

        if (result.isConfirmed) {
            await initializeAllStocks();
        }
    };

    // Action : Synchroniser le stock d'un lot spécifique
    const handleSyncBatch = async (batch: BatchDto) => {
        const result = await Swal.fire({
            title: 'Synchroniser ce lot ?',
            text: `Voulez-vous générer les lignes de stock pour le lot ${batch.batch_number} dans toutes vos succursales ?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, synchroniser',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });

        if (result.isConfirmed) {
            await initializeBatchStock(batch.id);
        }
    };

    // Fonction utilitaire pour vérifier l'état de péremption
    const getExpirationStatus = (dateString: string | null) => {
        if (!dateString) {
            return { label: 'Non périssable', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50', icon: <Infinity size={14} /> };
        }

        const expireDate = new Date(dateString);
        const today = new Date();
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(today.getMonth() + 3);

        if (expireDate < today) {
            return { label: 'Périmé', color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50', icon: <AlertCircle size={14} /> };
        } else if (expireDate <= threeMonthsFromNow) {
            return { label: 'Expire bientôt', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/50', icon: <AlertCircle size={14} /> };
        } else {
            return { label: 'Valide', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50', icon: <CheckCircle2 size={14} /> };
        }
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                        <Layers size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Lots & Traçabilité</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez les numéros de lots, dates de péremption et prix d'achat.</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* BOUTON SYNCHRONISATION GLOBALE */}
                    <button 
                        onClick={handleSyncAll}
                        disabled={actionLoading}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70"
                    >
                        <RefreshCw size={18} className={actionLoading ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">Sync. globale</span>
                    </button>

                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#00a896] hover:bg-[#008f7e] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Nouveau Lot
                    </button>
                </div>
            </div>

            {/* BARRE DE FILTRES */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Recherche (Numéro de lot)</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="LOT-2026..."
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value})}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Filtrer par article</label>
                        <select 
                            value={filters.article_id}
                            onChange={(e) => setFilters({...filters, article_id: e.target.value})}
                            className="w-full p-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white transition-colors"
                        >
                            <option value="">Tous les articles</option>
                            {articles.map(article => (
                                <option key={article.id} value={article.id}>
                                    {article.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            type="submit" 
                            className="flex-1 bg-slate-800 hover:bg-slate-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex justify-center items-center gap-2"
                        >
                            <Search size={16} /> Filtrer
                        </button>
                        <button 
                            type="button"
                            onClick={handleResetFilters}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border dark:border-gray-600 rounded-lg font-medium transition-colors text-sm"
                        >
                            Réinitialiser
                        </button>
                    </div>
                </form>
            </div>

            {/* TABLEAU DES LOTS */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">N° de Lot</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Article</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Péremption</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prix d'Achat</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center">
                                        <Loader2 size={32} className="animate-spin text-[#00a896] mx-auto mb-2" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des lots...</p>
                                    </td>
                                </tr>
                            ) : batches.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Layers size={48} className="mb-3 opacity-50" />
                                            <p>Aucun lot trouvé.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                batches.map((batch) => {
                                    const status = getExpirationStatus(batch.expire_date);
                                    
                                    return (
                                        <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                            
                                            <td className="p-4">
                                                <div className="font-mono text-sm font-bold text-slate-800 dark:text-gray-200">
                                                    {batch.batch_number}
                                                </div>
                                            </td>
                                            
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-gray-300">
                                                    <Package size={16} className="text-gray-400" />
                                                    <span className="font-medium">{batch.article?.name || "Article inconnu"}</span>
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                                        <Calendar size={14} />
                                                        {batch.expire_date ? new Date(batch.expire_date).toLocaleDateString('fr-FR') : 'Date illimitée'}
                                                    </div>
                                                    <div className={`inline-flex items-center gap-1 w-max px-2 py-0.5 rounded text-xs font-medium border ${status.color}`}>
                                                        {status.icon}
                                                        {status.label}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <div className="flex items-center gap-1 font-medium text-slate-800 dark:text-gray-200">
                                                    <DollarSign size={14} className="text-gray-400" />
                                                    {batch.purchase_price.toLocaleString('fr-FR')} FCFA
                                                </div>
                                            </td>

                                            <td className="p-4 text-right">
                                                <div className="flex justify-end items-center gap-1">
                                                    {/* BOUTON SYNCHRONISATION INDIVIDUELLE */}
                                                    <button 
                                                        onClick={() => handleSyncBatch(batch)}
                                                        disabled={actionLoading}
                                                        title="Initialiser le stock pour ce lot" 
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        <RefreshCw size={18} />
                                                    </button>

                                                    <button 
                                                        onClick={() => setSelectedBatch(batch)} 
                                                        title="Modifier" 
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(batch)} 
                                                        title="Supprimer" 
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            batch.batch_number === 'STANDARD' 
                                                            ? 'text-gray-400 cursor-not-allowed' 
                                                            : 'text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30'
                                                        }`}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODALES */}
            <CreateBatchModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                articles={articles}
            />

            <UpdateBatchModal 
                isOpen={!!selectedBatch} 
                onClose={() => setSelectedBatch(null)} 
                batch={selectedBatch}
                articles={articles}
            />

        </div>
    );
};

export default Batches;