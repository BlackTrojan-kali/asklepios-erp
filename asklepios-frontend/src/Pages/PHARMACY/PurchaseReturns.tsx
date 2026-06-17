import React, { useEffect, useState } from 'react';
import { 
    Undo2, Plus, RefreshCw, Loader2, Edit, Trash2, 
    XCircle, CheckSquare, Eye, AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';

// Stores
import usePurchaseStore from '../../functions/pharmacy/usePurchaseStore';
import useProviderStore from '../../functions/pharmacy/useProviderStore'; 
// Modales
import { PurchaseReturnModal } from '../../components/modals/Pharmacy/purchase_return/PurchaseReturnModal';
import { ViewReturnModal } from '../../components/modals/Pharmacy/purchase_return/ViewReturnModal';
import { ExportPurchaseModal } from '../../components/modals/Pharmacy/purchase/ExportPurchaseModal';

// Types
import type { PurchaseReturnDto } from '../../types/PurchaseTypes';

const PurchaseReturns = () => {
    // Stores
    const { 
        returns, returnsMeta, loading, actionLoading,
        getReturns, deleteReturn, cancelReturn, validateReturn 
    } = usePurchaseStore();
    const { providers, getProviders } = useProviderStore();

    // États de la page
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ status: '', provider_id: '' });
    
    // États des modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);
    
    // Retours sélectionnés pour action
    const [selectedReturnForEdit, setSelectedReturnForEdit] = useState<PurchaseReturnDto | null>(null);
    const [selectedReturnForView, setSelectedReturnForView] = useState<PurchaseReturnDto | null>(null);

    // Chargement initial
    useEffect(() => {
        getProviders({});
    }, [getProviders]);

    useEffect(() => {
        getReturns({ ...filters, page });
    }, [getReturns, filters, page]);

    const handleRefresh = () => {
        getReturns({ ...filters, page });
    };

    // --- ACTIONS DIRECTES ---

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer ce retour ?',
            text: `Voulez-vous vraiment supprimer le retour #${id} ?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, supprimer',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });
        
        if (result.isConfirmed) {
            const success = await deleteReturn(id);
            if (success) handleRefresh();
        }
    };

    const handleCancel = async (id: number) => {
        const result = await Swal.fire({
            title: 'Annuler ce retour ?',
            text: `Le retour #${id} sera marqué comme annulé. Aucun stock ne sera déduit.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            cancelButtonText: 'Fermer',
            confirmButtonText: 'Oui, annuler',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });
        
        if (result.isConfirmed) {
            const success = await cancelReturn(id);
            if (success) handleRefresh();
        }
    };

    const handleValidate = async (id: number) => {
        const result = await Swal.fire({
            title: 'Valider et expédier ?',
            text: `En validant ce retour, les quantités spécifiées seront définitivement DÉDUITES de votre stock. Cette action est irréversible.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444', // Rouge car c'est une sortie de stock
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, valider l\'expédition',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });
        
        if (result.isConfirmed) {
            const success = await validateReturn(id);
            if (success) handleRefresh();
        }
    };

    // Utilitaires UI
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
                    <div className="p-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
                        <Undo2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Retours Fournisseurs</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez les renvois de marchandises (périmés, cassés, erreurs).</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <button 
                        onClick={() => setIsExportOpen(true)}
                        className="p-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm text-sm font-medium"
                    >
                        Exporter
                    </button>

                    <button 
                        onClick={handleRefresh}
                        disabled={loading || actionLoading}
                        className="p-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-70"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>

                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="flex flex-1 lg:flex-none justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Nouveau Retour
                    </button>
                </div>
            </div>

            {/* ALERTE INFORMATIVE */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-400">
                    Les retours fournisseurs diminuent physiquement votre stock. Créez le document, puis cliquez sur <strong>Valider l'expédition</strong> lorsque la marchandise quitte réellement la pharmacie.
                </p>
            </div>

            {/* BARRE DE FILTRES */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Filtrer par Fournisseur</label>
                    <select 
                        value={filters.provider_id}
                        onChange={(e) => { setFilters({...filters, provider_id: e.target.value}); setPage(1); }}
                        className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 dark:text-white"
                    >
                        <option value="">Tous les fournisseurs</option>
                        {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Filtrer par Statut</label>
                    <select 
                        value={filters.status}
                        onChange={(e) => { setFilters({...filters, status: e.target.value}); setPage(1); }}
                        className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 dark:text-white"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="PENDING">En attente</option>
                        <option value="SHIPPED">Expédié (Validé)</option>
                        <option value="CANCELLED">Annulé</option>
                    </select>
                </div>
            </div>

            {/* TABLEAU DES RETOURS */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">N° Retour & Date</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fournisseur</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lié à Cmd</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Statut</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center">
                                        <Loader2 size={32} className="animate-spin text-red-500 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des retours...</p>
                                    </td>
                                </tr>
                            ) : returns.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <p className="text-gray-500 dark:text-gray-400">Aucun retour trouvé.</p>
                                    </td>
                                </tr>
                            ) : (
                                returns.map((ret) => (
                                    <tr key={ret.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white">#{ret.id}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(ret.return_date || '').toLocaleDateString('fr-FR')}
                                            </div>
                                        </td>
                                        
                                        <td className="p-4 font-medium text-slate-700 dark:text-gray-300">
                                            {ret.provider?.name || 'Inconnu'}
                                        </td>

                                        <td className="p-4 text-slate-600 dark:text-gray-400">
                                            {ret.purchase_order_id ? (
                                                <span className="font-mono bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                                                    #{ret.purchase_order_id}
                                                </span>
                                            ) : (
                                                <span className="text-xs italic text-gray-400">Indépendant</span>
                                            )}
                                        </td>
                                        
                                        <td className="p-4 text-center">
                                            {getStatusBadge(ret.status)}
                                        </td>
                                        
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                
                                                {/* ÉDITION OU CONSULTATION SÉPARÉES */}
                                                {ret.status === 'PENDING' ? (
                                                    <button 
                                                        onClick={() => setSelectedReturnForEdit(ret)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                        title="Modifier le retour"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => setSelectedReturnForView(ret)}
                                                        className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                        title="Consulter les détails"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                )}

                                                {/* Valider l'expédition (Uniquement si PENDING) */}
                                                {ret.status === 'PENDING' && (
                                                    <button 
                                                        onClick={() => handleValidate(ret.id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                        title="Valider l'expédition et déduire le stock"
                                                    >
                                                        <CheckSquare size={18} />
                                                    </button>
                                                )}

                                                {/* Annuler et Supprimer (Uniquement si PENDING) */}
                                                {ret.status === 'PENDING' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleCancel(ret.id)}
                                                            className="p-1.5 text-orange-500 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                                                            title="Annuler ce retour"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(ret.id)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                            title="Supprimer ce retour"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
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

            {/* MODALES */}
            
            <PurchaseReturnModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)}
                existingReturn={null}
                onSuccess={handleRefresh}
            />

            <PurchaseReturnModal 
                isOpen={!!selectedReturnForEdit} 
                onClose={() => setSelectedReturnForEdit(null)}
                existingReturn={selectedReturnForEdit}
                onSuccess={handleRefresh}
            />

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

export default PurchaseReturns;