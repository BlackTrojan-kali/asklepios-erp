import React, { useEffect, useState, useMemo } from 'react';
import { 
    Activity, RefreshCw, Loader2, Search, ArrowUpRight, ArrowDownLeft, Download
} from 'lucide-react';
import Select from 'react-select';

// Stores
import useMoveStore from '../../../../functions/pharmacy/useMoveStore';

// Modales
import { ExportMovementsModal } from '../../../../components/modals/Pharmacy/stock/ExportMovementsModal';

const StockMovements = () => {
    const { movements, meta, loading, getMovements } = useMoveStore();

    // --- FILTRES FRONTEND ---
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [type, setType] = useState<string>('');
    const [refType, setRefType] = useState<string>('');

    const [isExportOpen, setIsExportOpen] = useState(false);

    // Déclencher le rechargement dès qu'un filtre change
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            getMovements({ 
                page, 
                search: search || undefined, 
                type: type || undefined, 
                reference_type: refType || undefined 
            });
        }, 300); // Debounce pour la recherche textuelle

        return () => clearTimeout(delayDebounce);
    }, [getMovements, page, search, type, refType]);

    const handleRefresh = () => {
        getMovements({ page, search, type, reference_type: refType });
    };

    // --- DICTIONNAIRE DE TRADUCTION DES OPÉRATIONS ---
    const translateOperation = (refType: string) => {
        const types: Record<string, string> = {
            'PURCHASE': 'Réception Commande',
            'RETURN': 'Retour Fournisseur',
            'TRANSFER': 'Transfert Inter-Succursale',
            'INVENTORY': 'Ajustement Inventaire',
            'SALE': 'Vente / Dispensation',
            'OTHER': 'Autre Mouvement'
        };
        return types[refType] || refType;
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Piste d'Audit des Stocks</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Historique chronologique et immuable des entrées et sorties physiques.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto">
                    <button 
                        onClick={() => setIsExportOpen(true)}
                        className="flex items-center gap-2 p-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-xs text-sm font-semibold"
                    >
                        <Download size={16} /> Exporter
                    </button>
                    <button 
                        onClick={handleRefresh} disabled={loading}
                        className="p-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xs transition-colors"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* FILTRES DE RECHERCHE RAPIDE */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xs border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Rechercher</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input 
                            type="text" placeholder="Saisir un article, un code-barres ou un n° de lot..."
                            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-400 dark:text-white"
                        />
                    </div>
                </div>
                <div className="w-full md:w-48">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Flux</label>
                    <select
                        value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}
                        className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 dark:text-white"
                    >
                        <option value="">Tous les flux</option>
                        <option value="ENTRY">Entrées (+)</option>
                        <option value="EXIT">Sorties (-)</option>
                    </select>
                </div>
                <div className="w-full md:w-56">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Nature de l'opération</label>
                    <select
                        value={refType} onChange={(e) => { setRefType(e.target.value); setPage(1); }}
                        className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 dark:text-white"
                    >
                        <option value="">Toutes les opérations</option>
                        <option value="PURCHASE">Réceptions Commandes</option>
                        <option value="RETURN">Retours Fournisseurs</option>
                        <option value="SALE">Ventes / Dispensations</option>
                        <option value="TRANSFER">Transferts</option>
                        <option value="INVENTORY">Ajustements Inventaire</option>
                    </select>
                </div>
            </div>

            {/* TABLEAU RESPONSIVE */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date / Heure</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Sens</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nature / Document</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Désignation / Lot</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Quantité</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Stock Après</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Commentaire</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center">
                                        <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-2" />
                                        <p className="text-gray-500 dark:text-gray-400">Analyse de la base de connaissances des flux...</p>
                                    </td>
                                </tr>
                            ) : movements.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-gray-400">
                                        Aucun mouvement de stock enregistré avec ces critères.
                                    </td>
                                </tr>
                            ) : (
                                movements.map((m) => (
                                    <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-gray-700/20 transition-colors">
                                        
                                        {/* DATE & HEURE */}
                                        <td className="p-4 font-mono text-xs text-slate-600 dark:text-gray-400">
                                            {new Date(m.created_at).toLocaleString('fr-FR')}
                                        </td>

                                        {/* SENS DU FLUX */}
                                        <td className="p-4 text-center">
                                            {m.type === 'ENTRY' ? (
                                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-black text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50">
                                                    <ArrowDownLeft size={10} /> ENTRÉE
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-black text-[10px] bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50">
                                                    <ArrowUpRight size={10} /> SORTIE
                                                </span>
                                            )}
                                        </td>

                                        {/* NATURE / REF DOC */}
                                        <td className="p-4">
                                            <span className="font-bold text-slate-700 dark:text-gray-200">
                                                {translateOperation(m.reference_type)}
                                            </span>
                                            {m.reference_id && (
                                                <div className="text-xs text-gray-400 font-mono">Doc: #{m.reference_id}</div>
                                            )}
                                        </td>

                                        {/* ARTICLE & LOT */}
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-gray-100">{m.batch?.article?.name}</div>
                                            <div className="text-xs flex items-center gap-3 text-gray-500">
                                                <span>Lot: <span className="font-mono bg-slate-100 dark:bg-gray-800 px-1 rounded">{m.batch?.batch_number}</span></span>
                                                {m.storageLocation && <span>U: {m.storageLocation.aisle}-{m.storageLocation.shelf}</span>}
                                            </div>
                                        </td>

                                        {/* QUANTITÉ DU MOUVEMENT */}
                                        <td className={`p-4 text-right font-mono font-bold ${m.type === 'ENTRY' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {m.type === 'ENTRY' ? '+' : '-'}{m.qty}
                                        </td>

                                        {/* STOCK RÉSULTANT APPRÈS */}
                                        <td className="p-4 text-right font-mono text-slate-600 dark:text-gray-300 font-medium">
                                            {m.qty_in_stock}
                                        </td>

                                        {/* COMMENTAIRE */}
                                        <td className="p-4 text-xs text-gray-400 italic max-w-[200px] truncate" title={m.comment || ''}>
                                            {m.comment || '-'}
                                        </td>

                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {meta && meta.last_page > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Mouvements {((page - 1) * meta.per_page) + 1} à {Math.min(page * meta.per_page, meta.total)} sur {meta.total}
                        </span>
                        <div className="flex gap-2">
                            <button 
                                disabled={page === 1} onClick={() => setPage(page - 1)}
                                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 disabled:opacity-50 text-slate-700 dark:text-gray-300"
                            >
                                Précédent
                            </button>
                            <button 
                                disabled={page === meta.last_page} onClick={() => setPage(page + 1)}
                                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 disabled:opacity-50 text-slate-700 dark:text-gray-300"
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALE D'EXPORTATION */}
            <ExportMovementsModal 
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
            />

        </div>
    );
};

export default StockMovements;