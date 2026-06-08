import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { 
    Search, 
    Layers, 
    MapPin, 
    Package, 
    Calendar, 
    AlertTriangle, 
    CheckCircle2, 
    XCircle,
    Infinity,
    Loader2,
    Barcode,
    Tags,
    RefreshCw
} from 'lucide-react';

// Stores
import useStockStore from '../../../../functions/pharmacy/useStockStore';
import useArticleStore from '../../../../functions/pharmacy/useArticleStore';
import usePharmacyStore from '../../../../functions/pharmacy/usePharmacyStore';

const Stocks = () => {
    // Hooks des stores
    const { 
        stocks, loading, 
        getGlobalStocks 
    } = useStockStore();

    const { 
        articles, 
        getArticles 
    } = useArticleStore();

    const { 
        pharmacyBranches: branches, 
        getPharmacyBranches: getBranches 
    } = usePharmacyStore();

    // États pour les filtres
    const [filters, setFilters] = useState({
        search: '',
        branch_id: '',
        article_id: ''
    });

    // Chargement initial des données
    useEffect(() => {
        getGlobalStocks({});
        getArticles({}); 
        getBranches({}); 
    }, [getGlobalStocks, getArticles, getBranches]);

    // Fonction de rafraîchissement manuel
    const handleRefresh = () => {
        getGlobalStocks(filters);
        getArticles({});
        getBranches({});
    };

    // Soumission du formulaire de filtre
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        getGlobalStocks(filters);
    };

    // Réinitialisation des filtres
    const handleResetFilters = () => {
        setFilters({ search: '', branch_id: '', article_id: '' });
        getGlobalStocks({});
    };

    // Fonction utilitaire pour l'état de péremption du lot
    const getExpirationStatus = (dateString?: string | null) => {
        if (!dateString) {
            return { label: 'Non périssable', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50', icon: <Infinity size={12} /> };
        }

        const expireDate = new Date(dateString);
        const today = new Date();
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(today.getMonth() + 3);

        if (expireDate < today) {
            return { label: 'Périmé', color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50', icon: <XCircle size={12} /> };
        } else if (expireDate <= threeMonthsFromNow) {
            return { label: 'Expire bientôt', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/50', icon: <AlertTriangle size={12} /> };
        } else {
            return { label: 'Valide', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50', icon: <CheckCircle2 size={12} /> };
        }
    };

    // Fonction utilitaire pour l'état de la quantité (Rupture, Alerte, OK)
    const getStockLevelStatus = (qty: number, minQty: number = 0) => {
        if (qty <= 0) {
            return { label: 'Rupture', color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle size={14} /> };
        } else if (qty <= minQty) {
            return { label: 'Stock Critique', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400', icon: <AlertTriangle size={14} /> };
        } else {
            return { label: 'En Stock', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <CheckCircle2 size={14} /> };
        }
    };

    // Options pour react-select
    const branchOptions = branches?.map(b => ({ value: b.id.toString(), label: b.name })) || [];
    const articleOptions = articles?.map(a => ({ value: a.id.toString(), label: a.name })) || [];
    
    // Styles pour s'assurer que le menu déroulant passe au-dessus du reste
    const selectStyles = {
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
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
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Inventaire Global</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Consultez les niveaux de stock à travers toutes vos succursales.</p>
                    </div>
                </div>

                <button 
                    onClick={handleRefresh}
                    disabled={loading}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70"
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    <span className="hidden sm:inline">Rafraîchir</span>
                </button>
            </div>

            {/* BARRE DE FILTRES */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
                    
                    <div className="md:col-span-2 lg:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Recherche (Article, Lot, Code-barres)</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Paracétamol, LOT-X1..."
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value})}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white transition-colors"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Filtrer par succursale</label>
                        <Select 
                            options={branchOptions}
                            value={branchOptions.find(opt => opt.value === filters.branch_id) || null}
                            onChange={(selected) => setFilters({ ...filters, branch_id: selected ? selected.value : '' })}
                            placeholder="Toutes..."
                            isClearable
                            menuPortalTarget={document.body}
                            styles={selectStyles}
                            className="react-select-container text-sm"
                            classNamePrefix="react-select"
                        />
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Filtrer par article</label>
                        <Select 
                            options={articleOptions}
                            value={articleOptions.find(opt => opt.value === filters.article_id) || null}
                            onChange={(selected) => setFilters({ ...filters, article_id: selected ? selected.value : '' })}
                            placeholder="Tous..."
                            isClearable
                            menuPortalTarget={document.body}
                            styles={selectStyles}
                            className="react-select-container text-sm"
                            classNamePrefix="react-select"
                        />
                    </div>

                    <div className="flex gap-2 lg:col-span-1">
                        <button 
                            type="submit" 
                            className="flex-1 bg-slate-800 hover:bg-slate-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex justify-center items-center gap-2"
                        >
                            <Search size={16} /> Filtrer
                        </button>
                        <button 
                            type="button"
                            onClick={handleResetFilters}
                            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border dark:border-gray-600 rounded-lg font-medium transition-colors text-sm"
                            title="Réinitialiser les filtres"
                        >
                            X
                        </button>
                    </div>
                </form>
            </div>

            {/* TABLEAU DES STOCKS */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Succursale</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Article concerné</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Informations du Lot</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Quantité en Rayon</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center">
                                        <Loader2 size={32} className="animate-spin text-[#00a896] mx-auto mb-2" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement de l'inventaire...</p>
                                    </td>
                                </tr>
                            ) : stocks.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Layers size={48} className="mb-3 opacity-50" />
                                            <p>Aucun stock trouvé pour ces critères.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                stocks.map((stock) => {
                                    const article = stock.batch?.article;
                                    const expStatus = getExpirationStatus(stock.batch?.expire_date);
                                    const qtyStatus = getStockLevelStatus(stock.qty, article?.global_min_qty);
                                    
                                    return (
                                        <tr key={stock.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                            
                                            {/* SUCCURSALE */}
                                            <td className="p-4 align-top">
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-gray-300">
                                                    <MapPin size={16} className="text-indigo-500" />
                                                    {stock.branch?.name || "Inconnue"}
                                                </div>
                                            </td>
                                            
                                            {/* ARTICLE */}
                                            <td className="p-4 align-top">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-gray-200">
                                                        <Package size={16} className="text-gray-400" />
                                                        {article?.name || "Article inconnu"}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                                            <Tags size={10} />
                                                            {article?.category?.name || "Sans catégorie"}
                                                        </div>
                                                        {article?.barcode && (
                                                            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                                                <Barcode size={10} />
                                                                {article.barcode}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* LOT ET PÉREMPTION */}
                                            <td className="p-4 align-top">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="font-mono text-sm font-bold text-slate-700 dark:text-gray-300">
                                                        Lot : {stock.batch?.batch_number}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400">
                                                        <Calendar size={12} />
                                                        {stock.batch?.expire_date ? new Date(stock.batch.expire_date).toLocaleDateString('fr-FR') : 'Date illimitée'}
                                                    </div>
                                                    <div className={`inline-flex items-center gap-1 w-max px-2 py-0.5 rounded text-[11px] font-medium border ${expStatus.color}`}>
                                                        {expStatus.icon}
                                                        {expStatus.label}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* QUANTITÉ */}
                                            <td className="p-4 text-right align-top">
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <div className="text-xl font-black text-slate-800 dark:text-white">
                                                        {stock.qty}
                                                    </div>
                                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${qtyStatus.color}`}>
                                                        {qtyStatus.icon}
                                                        {qtyStatus.label}
                                                    </div>
                                                    {article?.global_min_qty ? (
                                                        <div className="text-[10px] text-gray-400 dark:text-gray-500">
                                                            Seuil d'alerte : {article.global_min_qty}
                                                        </div>
                                                    ) : null}
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

        </div>
    );
};

export default Stocks;