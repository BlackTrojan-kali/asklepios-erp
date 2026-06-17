import React, { useEffect, useState, useMemo } from 'react';
import { 
    Activity, RefreshCw, Loader2, Search, ArrowUpRight, ArrowDownLeft, Download
} from 'lucide-react';
import Select from 'react-select';

// Stores
import useMoveStore from '../../../../functions/pharmacy/useMoveStore';
import usePharmacyStore from '../../../../functions/pharmacy/usePharmacyStore'; 

// Modales
import { ExportMovementsModal } from '../../../../components/modals/Pharmacy/stock/ExportMovementsModal';

const AdminStockMovements = () => {
    // Stores
    const { movements, meta, loading, getMovements } = useMoveStore();
    const { pharmacyBranches, getPharmacyBranches } = usePharmacyStore();

    // --- FILTRES FRONTEND ---
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [type, setType] = useState<string>('');
    const [refType, setRefType] = useState<string>('');
    const [branchId, setBranchId] = useState<number | ''>(''); // Filtre Admin

    const [isExportOpen, setIsExportOpen] = useState(false);

    // Chargement initial des succursales
    useEffect(() => {
        getPharmacyBranches(1);
    }, [getPharmacyBranches]);

    // Déclencher le rechargement dès qu'un filtre change
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            getMovements({ 
                page, 
                search: search || undefined, 
                type: type || undefined, 
                reference_type: refType || undefined,
                branch_id: branchId || undefined
            });
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [getMovements, page, search, type, refType, branchId]);

    const handleRefresh = () => {
        getMovements({ page, search, type, reference_type: refType, branch_id: branchId });
    };

    // --- OPTIONS REACT-SELECT ---
    const branchOptions = useMemo(() => {
        return pharmacyBranches.map(b => ({ value: b.id, label: b.name }));
    }, [pharmacyBranches]);

    // --- DICTIONNAIRE ---
    const translateOperation = (refType: string) => {
        const types: Record<string, string> = {
            'PURCHASE': 'Réception Commande',
            'RETURN': 'Retour Fournisseur',
            'TRANSFER': 'Transfert',
            'INVENTORY': 'Ajustement Inventaire',
            'SALE': 'Vente',
            'OTHER': 'Autre'
        };
        return types[refType] || refType;
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-lg">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Audit des Mouvements</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Supervision globale des flux physiques de toutes les succursales.</p>
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

            {/* FILTRES AVANCÉS */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xs border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                
                {/* Succursale */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Succursale</label>
                    <Select 
                        options={branchOptions}
                        value={branchOptions.find(opt => opt.value === branchId) || null}
                        onChange={(selected) => {
                            setBranchId(selected ? selected.value : '');
                            setPage(1);
                        }}
                        placeholder="Toutes les pharmacies..."
                        isClearable
                        className="text-sm react-select-container"
                        classNamePrefix="react-select"
                    />
                </div>

                {/* Recherche */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Recherche (Article, Lot)</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input 
                            type="text" placeholder="Saisir un terme..."
                            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-[7px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-400 dark:text-white"
                        />
                    </div>
                </div>

                {/* Sens */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Sens du Flux</label>
                    <select
                        value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}
                        className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 dark:text-white"
                    >
                        <option value="">Tous les flux</option>
                        <option value="ENTRY">Entrées (+)</option>
                        <option value="EXIT">Sorties (-)</option>
                    </select>
                </div>

                {/* Nature */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Opération</label>
                    <select
                        value={refType} onChange={(e) => { setRefType(e.target.value); setPage(1); }}
                        className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 dark:text-white"
                    >
                        <option value="">Toutes opérations</option>
                        <option value="PURCHASE">Achats</option>
                        <option value="RETURN">Retours</option>
                        <option value="SALE">Ventes</option>
                        <option value="TRANSFER">Transferts</option>
                        <option value="INVENTORY">Ajustements</option>
                    </select>
                </div>
            </div>

            {/* TABLEAU DES FLUX */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date / Heure</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Succursale</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Sens</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nature / Doc.</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Désignation / Lot</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Qté</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Stock</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center">
                                        <Loader2 size={32} className="animate-spin text-slate-500 mx-auto mb-2" />
                                        <p className="text-gray-500 dark:text-gray-400 mt-2">Analyse globale des flux...</p>
                                    </td>
                                </tr>
                            ) : movements.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-gray-400">
                                        Aucun mouvement trouvé pour ces critères.
                                    </td>
                                </tr>
                            ) : (
                                movements.map((m) => (
                                    <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-gray-700/20 transition-colors">
                                        
                                        <td className="p-4 font-mono text-xs text-slate-600 dark:text-gray-400">
                                            {new Date(m.created_at).toLocaleString('fr-FR')}
                                        </td>

                                        <td className="p-4 font-bold text-slate-700 dark:text-gray-300">
                                            {m.pharmacyBranch?.name || 'N/A'}
                                        </td>

                                        <td className="p-4 text-center">
                                            {m.type === 'ENTRY' ? (
                                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-black text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                                                    <ArrowDownLeft size={10} /> ENTRÉE
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-black text-[10px] bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400">
                                                    <ArrowUpRight size={10} /> SORTIE
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-4">
                                            <span className="font-bold text-slate-700 dark:text-gray-200">
                                                {translateOperation(m.reference_type)}
                                            </span>
                                            {m.reference_id && (
                                                <div className="text-xs text-gray-400 font-mono">Doc: #{m.reference_id}</div>
                                            )}
                                        </td>

                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-gray-100">{m.batch?.article?.name}</div>
                                            <div className="text-xs text-gray-500">
                                                Lot: <span className="font-mono bg-slate-100 dark:bg-gray-800 px-1 rounded">{m.batch?.batch_number}</span>
                                            </div>
                                        </td>

                                        <td className={`p-4 text-right font-mono font-bold ${m.type === 'ENTRY' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {m.type === 'ENTRY' ? '+' : '-'}{m.qty}
                                        </td>

                                        <td className="p-4 text-right font-mono text-slate-600 dark:text-gray-300 font-medium">
                                            {m.qty_in_stock}
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

            {/* MODALE D'EXPORTATION AVEC BRANCH_ID */}
            <ExportMovementsModal 
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
                branchId={branchId} /* On passe la succursale sélectionnée ! */
            />

        </div>
    );
};

export default AdminStockMovements;