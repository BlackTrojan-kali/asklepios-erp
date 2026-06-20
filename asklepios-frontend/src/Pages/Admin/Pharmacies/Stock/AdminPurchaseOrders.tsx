import React, { useEffect, useState, useMemo } from 'react';
import { 
    ShoppingCart, RefreshCw, Loader2, Eye, FileDown
} from 'lucide-react';
import Select from 'react-select';

// Stores
import usePurchaseStore from '../../../../functions/pharmacy/usePurchaseStore'; 
import useProviderStore from '../../../../functions/pharmacy/useProviderStore';
import usePharmacyStore from '../../../../functions/pharmacy/usePharmacyStore';

// Modales (Uniquement Consultation et Exportation)
import { ViewOrderModal } from '../../../../components/modals/Pharmacy/purchase_order/ViewOrderModal';
import { ExportPurchaseModal } from '../../../../components/modals/Pharmacy/purchase/ExportPurchaseModal';

// Types
import type { PurchaseOrderDto } from '../../../../types/PurchaseTypes'; 

const AdminPurchaseOrders = () => {
    // Stores
    const { orders, ordersMeta, loading, actionLoading, getOrders, downloadOrderFormPdf } = usePurchaseStore();
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
    const [selectedOrderForView, setSelectedOrderForView] = useState<PurchaseOrderDto | null>(null);

    // Chargement initial des filtres
    useEffect(() => {
        getProviders({});
        getPharmacyBranches(1); // Chargement des succursales (page 1)
    }, [getProviders, getPharmacyBranches]);

    // Chargement des commandes à chaque changement de filtre ou de page
    useEffect(() => {
        getOrders({ ...filters, page });
    }, [getOrders, filters, page]);

    const handleRefresh = () => {
        getOrders({ ...filters, page });
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
        { value: 'PARTIALLY_RECEIVED', label: 'Partiellement Reçue' },
        { value: 'RECEIVED', label: 'Totalement Reçue' },
        { value: 'CANCELLED', label: 'Annulée' }
    ];

    // --- UTILITAIRES UI ---
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">En attente</span>;
            case 'PARTIALLY_RECEIVED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Partielle</span>;
            case 'RECEIVED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Reçue</span>;
            case 'CANCELLED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Annulée</span>;
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
                        <ShoppingCart size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Suivi des Commandes</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Consultez l'historique des approvisionnements de toutes les pharmacies.</p>
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
                        Statut de la commande
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

            {/* TABLEAU DES COMMANDES */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Réf & Date</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Succursale</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fournisseur</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Montant Total</th>
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
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <p className="text-gray-500 dark:text-gray-400">Aucune commande trouvée.</p>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        
                                        {/* RÉFÉRENCE & DATE */}
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white">#{order.id}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(order.created_at || '').toLocaleDateString('fr-FR')}
                                            </div>
                                        </td>
                                        
                                        {/* SUCCURSALE (PHARMACIE) */}
                                        <td className="p-4 font-medium text-slate-700 dark:text-gray-300">
                                            {order.destinationPharmacy?.name || 'N/A'}
                                        </td>

                                        {/* FOURNISSEUR */}
                                        <td className="p-4 text-slate-700 dark:text-gray-300">
                                            {order.provider?.name || 'Inconnu'}
                                        </td>
                                        
                                        {/* MONTANT TOTAL */}
                                        <td className="p-4 text-right font-mono font-bold text-slate-700 dark:text-gray-300">
                                            {order.total_amount?.toLocaleString('fr-FR')} FCFA
                                        </td>
                                        
                                        {/* STATUT */}
                                        <td className="p-4 text-center">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        
                                        {/* ACTIONS (LECTURE SEULE + EXPORT PDF) */}
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                {/* BOUTON TÉLÉCHARGER LE BON DE COMMANDE (PDF) */}
                                                <button 
                                                    onClick={() => downloadOrderFormPdf(order.id)}
                                                    disabled={actionLoading}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Télécharger le bon de commande (PDF)"
                                                >
                                                    <FileDown size={18} />
                                                </button>

                                                {/* BOUTON CONSULTATION */}
                                                <button 
                                                    onClick={() => setSelectedOrderForView(order)}
                                                    className="p-2 text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                    title="Consulter les détails"
                                                >
                                                    <Eye size={18} />
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
                {ordersMeta && ordersMeta.last_page > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Page {ordersMeta.current_page} sur {ordersMeta.last_page} ({ordersMeta.total} commandes)
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
                                disabled={page === ordersMeta.last_page}
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
            <ViewOrderModal 
                isOpen={!!selectedOrderForView} 
                onClose={() => setSelectedOrderForView(null)}
                order={selectedOrderForView}
            />

            <ExportPurchaseModal
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
                type="orders"
            />

        </div>
    );
};

export default AdminPurchaseOrders;