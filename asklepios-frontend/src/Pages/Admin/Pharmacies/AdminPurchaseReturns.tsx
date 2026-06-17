import React, { useEffect, useState, useMemo } from 'react';
import { 
    Undo2, RefreshCw, Loader2, Eye
} from 'lucide-react';
import Select from 'react-select';

// Stores
import usePurchaseStore from '../../../functions/pharmacy/usePurchaseStore'; 
import useProviderStore from '../../../functions/pharmacy/useProviderStore';
import usePharmacyStore from '../../../functions/pharmacy/usePharmacyStore'; 

// Modales (Uniquement Consultation et Exportation)
import { ViewReturnModal } from '../../../components/modals/Pharmacy/purchase_return/ViewReturnModal';
import { ExportPurchaseModal } from '../../../components/modals/Pharmacy/purchase/ExportPurchaseModal';

// Types
import type { PurchaseReturnDto } from '../../../types/PurchaseTypes';

const AdminPurchaseReturns = () => {
    // Stores
    const { returns, returnsMeta, loading, getReturns } = usePurchaseStore();
    const { providers, getProviders } = useProviderStore();
    const { pharmacyBranches, getPharmacyBranches } = usePharmacyStore();

    // États de la page
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<{status: string, provider_id: number | '', branch_id: number | ''}>({ 
        status: '', 
        provider_id: '',
        branch_id: '' 
    });
    
    // États des modales
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [selectedReturnForView, setSelectedReturnForView] = useState<PurchaseReturnDto | null>(null);

    // Chargement initial des filtres
    useEffect(() => {
        getProviders({});
        getPharmacyBranches(1); // Chargement des succursales
    }, [getProviders, getPharmacyBranches]);

    // Chargement des retours à chaque changement de filtre ou de page
    useEffect(() => {
        getReturns({ ...filters, page });
    }, [getReturns, filters, page]);

    const handleRefresh = () => {
        getReturns({ ...filters, page });
    };

    // --- OPTIONS POUR REACT-SELECT ---
    const providerOptions = useMemo(() => {
        return providers.map(p => ({ value: p.id, label: p.name }));
    }, [providers]);

    const branchOptions = useMemo(() => {
        return pharmacyBranches.map(b => ({ value: b.id, label: b.name }));
    }, [pharmacyBranches]);

    const statusOptions = [
        { value: 'PENDING', label: 'En attente' },
        { value: 'SHIPPED', label: 'Expédié (Validé)' },
        { value: 'CANCELLED', label: 'Annulé' }
    ];

    // --- UTILITAIRES UI ---
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">En attente</span>;
            case 'SHIPPED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Expédié</span>;
            case 'CANCELLED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Annulé</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-lg">
                        <Undo2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Suivi des Retours</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Consultez l'historique des renvois fournisseurs de toutes les pharmacies.</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <button 
                        onClick={() => setIsExportOpen(true)}
                        className="p-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm text-sm font-medium"
                    >
                        Exporter Historique
                    </button>

                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="p-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-70"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* BARRE DE FILTRES AVEC REACT-SELECT */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Filtre Succursale */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                        Pharmacie (Succursale)
                    </label>
                    <Select 
                        options={branchOptions}
                        value={branchOptions.find(opt => opt.value === filters.branch_id) || null}
                        onChange={(selected) => {
                            setFilters({ ...filters, branch_id: selected ? selected.value : '' });
                            setPage(1);
                        }}
                        placeholder="Toutes les pharmacies..."
                        isClearable
                        className="text-sm react-select-container"
                        classNamePrefix="react-select"
                    />
                </div>

                {/* Filtre Fournisseur */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                        Fournisseur
                    </label>
                    <Select 
                        options={providerOptions}
                        value={providerOptions.find(opt => opt.value === filters.provider_id) || null}
                        onChange={(selected) => {
                            setFilters({ ...filters, provider_id: selected ? selected.value : '' });
                            setPage(1);
                        }}
                        placeholder="Tous les fournisseurs..."
                        isClearable
                        className="text-sm react-select-container"
                        classNamePrefix="react-select"
                    />
                </div>

                {/* Filtre Statut */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                        Statut du retour
                    </label>
                    <Select 
                        options={statusOptions}
                        value={statusOptions.find(opt => opt.value === filters.status) || null}
                        onChange={(selected) => {
                            setFilters({ ...filters, status: selected ? selected.value : '' });
                            setPage(1);
                        }}
                        placeholder="Tous les statuts..."
                        isClearable
                        className="text-sm react-select-container"
                        classNamePrefix="react-select"
                    />
                </div>
            </div>

            {/* TABLEAU DES RETOURS */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">N° Retour & Date</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Succursale</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fournisseur</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lié à Cmd</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Statut</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center">
                                        <Loader2 size={32} className="animate-spin text-slate-500 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des données...</p>
                                    </td>
                                </tr>
                            ) : returns.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <p className="text-gray-500 dark:text-gray-400">Aucun retour trouvé.</p>
                                    </td>
                                </tr>
                            ) : (
                                returns.map((ret) => (
                                    <tr key={ret.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        
                                        {/* RÉFÉRENCE & DATE */}
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white">#{ret.id}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(ret.return_date || '').toLocaleDateString('fr-FR')}
                                            </div>
                                        </td>
                                        
                                        {/* SUCCURSALE (PHARMACIE) */}
                                        <td className="p-4 font-medium text-slate-700 dark:text-gray-300">
                                            {ret.sourcePharmacy?.name || 'N/A'}
                                        </td>

                                        {/* FOURNISSEUR */}
                                        <td className="p-4 text-slate-700 dark:text-gray-300">
                                            {ret.provider?.name || 'Inconnu'}
                                        </td>

                                        {/* LIÉ À LA COMMANDE */}
                                        <td className="p-4 text-slate-600 dark:text-gray-400">
                                            {ret.purchase_order_id ? (
                                                <span className="font-mono bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                                                    #{ret.purchase_order_id}
                                                </span>
                                            ) : (
                                                <span className="text-xs italic text-gray-400">Indépendant</span>
                                            )}
                                        </td>
                                        
                                        {/* STATUT */}
                                        <td className="p-4 text-center">
                                            {getStatusBadge(ret.status)}
                                        </td>
                                        
                                        {/* ACTIONS (LECTURE SEULE) */}
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => setSelectedReturnForView(ret)}
                                                className="p-2 text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                title="Consulter les détails"
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
                {returnsMeta && returnsMeta.last_page > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Page {returnsMeta.current_page} sur {returnsMeta.last_page} ({returnsMeta.total} retours)
                        </span>
                        <div className="flex gap-2">
                            <button 
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 disabled:opacity-50 text-slate-700 dark:text-gray-300"
                            >
                                Précédent
                            </button>
                            <button 
                                disabled={page === returnsMeta.last_page}
                                onClick={() => setPage(page + 1)}
                                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 disabled:opacity-50 text-slate-700 dark:text-gray-300"
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALES EN LECTURE SEULE */}
            <ViewReturnModal 
                isOpen={!!selectedReturnForView} 
                onClose={() => setSelectedReturnForView(null)}
                purchaseReturn={selectedReturnForView}
            />

            <ExportPurchaseModal
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
                type="returns"
            />

        </div>
    );
};

export default AdminPurchaseReturns;