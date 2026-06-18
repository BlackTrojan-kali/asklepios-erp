import React, { useEffect, useState, useMemo } from 'react';
import { 
    ClipboardList, RefreshCw, Loader2, Eye, 
    FileText, FileSpreadsheet, CheckCircle, Clock
} from 'lucide-react';
import Select from 'react-select';

// Stores & Types
import useInventoryStore from '../../../../functions/pharmacy/useInventoryStore';
import usePharmacyStore from '../../../../functions/pharmacy/usePharmacyStore'; 

// Modales (Uniquement la modale de lecture)
import { ViewInventoryModal } from '../../../../components/modals/Pharmacy/inventory/ViewInventoryModal';

const AdminInventories = () => {
    // --- STORES ---
    const { 
        inventories, meta, loading, actionLoading,
        getInventories, exportPdf, exportExcel 
    } = useInventoryStore();

    const { pharmacyBranches, getPharmacyBranches } = usePharmacyStore();

    // --- ÉTATS ---
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [branchId, setBranchId] = useState<number | ''>('');

    // État pour la modale de consultation
    const [selectedForView, setSelectedForView] = useState<number | null>(null);

    // --- CHARGEMENT INITIAL DES SUCCURSALES ---
    useEffect(() => {
        getPharmacyBranches(1); // Charge toutes les succursales (page 1, ou sans pagination selon ta config)
    }, [getPharmacyBranches]);

    // --- CHARGEMENT DES INVENTAIRES ---
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            getInventories({ 
                page, 
                status: status || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                branch_id: branchId || undefined
            });
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [getInventories, page, status, startDate, endDate, branchId]);

    const handleRefresh = () => {
        getInventories({ page, status, start_date: startDate, end_date: endDate, branch_id: branchId });
    };

    const handleExport = async (format: 'pdf' | 'excel') => {
        const params: any = {};
        if (status) params.status = status;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (branchId) params.branch_id = branchId;

        if (format === 'pdf') {
            await exportPdf(params);
        } else {
            await exportExcel(params);
        }
    };

    // --- OPTIONS REACT-SELECT ---
    const branchOptions = useMemo(() => {
        return pharmacyBranches.map(b => ({ value: b.id, label: b.name }));
    }, [pharmacyBranches]);

    // --- UTILITAIRES ---
    const getStatusBadge = (invStatus: string) => {
        if (invStatus === 'VALIDATED') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle size={12} /> Validé
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Clock size={12} /> Brouillon
            </span>
        );
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-lg">
                        <ClipboardList size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Supervision des Inventaires</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Consultez l'historique et les écarts de stocks par succursale.</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <button 
                        onClick={() => handleExport('pdf')} disabled={actionLoading}
                        className="flex items-center gap-2 p-2.5 bg-white hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-900/20 text-red-600 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 text-sm font-semibold"
                    >
                        <FileText size={16} /> Exporter PDF
                    </button>
                    <button 
                        onClick={() => handleExport('excel')} disabled={actionLoading}
                        className="flex items-center gap-2 p-2.5 bg-white hover:bg-emerald-50 dark:bg-gray-800 dark:hover:bg-emerald-900/20 text-emerald-600 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 text-sm font-semibold"
                    >
                        <FileSpreadsheet size={16} /> Exporter Excel
                    </button>

                    <button 
                        onClick={handleRefresh} disabled={loading || actionLoading}
                        className="p-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 ml-2"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* FILTRES AVANCÉS */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xs border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                
                {/* Succursale */}
                <div className="md:col-span-1">
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

                {/* Statut */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Statut</label>
                    <select 
                        value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:text-white"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="PENDING">Brouillons en cours</option>
                        <option value="VALIDATED">Inventaires Validés</option>
                    </select>
                </div>

                {/* Dates */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Date de début</label>
                    <input 
                        type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                        className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Date de fin</label>
                    <input 
                        type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                        className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:text-white"
                    />
                </div>
            </div>

            {/* TABLEAU DES INVENTAIRES */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">N° & Date</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Succursale</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Réalisé par</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Note</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Statut</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <Loader2 size={32} className="animate-spin text-slate-500 mx-auto mb-2" />
                                        <p className="text-gray-500 dark:text-gray-400">Analyse de l'historique global...</p>
                                    </td>
                                </tr>
                            ) : inventories.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-500 dark:text-gray-400">
                                        Aucun inventaire trouvé pour ces critères.
                                    </td>
                                </tr>
                            ) : (
                                inventories.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white">#{inv.id}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(inv.execution_date).toLocaleDateString('fr-FR')}
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-slate-700 dark:text-gray-300">
                                            {inv.pharmacyBranch?.name || 'N/A'}
                                        </td>
                                        <td className="p-4 font-medium text-slate-600 dark:text-gray-400">
                                            {inv.user?.first_name} {inv.user?.last_name}
                                        </td>
                                        <td className="p-4 text-gray-500 dark:text-gray-400 italic max-w-[200px] truncate">
                                            {inv.comment || '-'}
                                        </td>
                                        <td className="p-4 text-center">
                                            {getStatusBadge(inv.status)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => setSelectedForView(inv.id)}
                                                className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                title="Consulter le rapport détaillé"
                                            >
                                                <Eye size={18} />
                                            </button>
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
                            Inventaires {((page - 1) * meta.per_page) + 1} à {Math.min(page * meta.per_page, meta.total)} sur {meta.total}
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

            {/* MODALE DE CONSULTATION (Commune avec le Pharmacien) */}
            <ViewInventoryModal 
                isOpen={!!selectedForView}
                onClose={() => setSelectedForView(null)}
                inventoryId={selectedForView}
            />

        </div>
    );
};

export default AdminInventories;