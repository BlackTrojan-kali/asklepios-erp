import React, { useEffect, useState } from 'react';
import { 
    ShoppingCart, Plus, RefreshCw, Loader2, Edit, Trash2, 
    XCircle, CheckSquare, Search, Filter, Eye, Undo2
} from 'lucide-react';
import Swal from 'sweetalert2';

// Stores
import usePurchaseStore from '../../functions/pharmacy/usePurchaseStore'; 
import useProviderStore from '../../functions/pharmacy/useProviderStore';

// Modales
import { PurchaseOrderModal } from '../../components/modals/Pharmacy/purchase_order/PurchaseOrderModal';
import { ExportPurchaseModal } from '../../components/modals/Pharmacy/purchase/ExportPurchaseModal';
import { ReceiveOrderModal } from '../../components/modals/Pharmacy/purchase_order/ReceiveOrderModal';
import { ViewOrderModal } from '../../components/modals/Pharmacy/purchase_order/ViewOrderModal';
import { PurchaseReturnModal } from '../../components/modals/Pharmacy/purchase_return/PurchaseReturnModal'; // <-- IMPORT DE LA MODALE DE RETOUR

// Types
import type { PurchaseOrderDto } from '../../types/PurchaseTypes'; 

const PurchaseOrders = () => {
    const { 
        orders, ordersMeta, loading, actionLoading,
        getOrders, deleteOrder, cancelOrder 
    } = usePurchaseStore();
    const { providers, getProviders } = useProviderStore();

    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ status: '', provider_id: '' });
    
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);
    
    // Séparation claire des états de sélection
    const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<PurchaseOrderDto | null>(null);
    const [selectedOrderForView, setSelectedOrderForView] = useState<PurchaseOrderDto | null>(null);
    const [selectedOrderForReceive, setSelectedOrderForReceive] = useState<PurchaseOrderDto | null>(null);
    const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<PurchaseOrderDto | null>(null); // <-- NOUVEL ÉTAT POUR LE RETOUR

    useEffect(() => {
        getProviders({});
    }, [getProviders]);

    useEffect(() => {
        getOrders({ ...filters, page });
    }, [getOrders, filters, page]);

    const handleRefresh = () => {
        getOrders({ ...filters, page });
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer la commande ?',
            text: `Voulez-vous vraiment supprimer le bon de commande #${id} ?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, supprimer',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });
        
        if (result.isConfirmed) {
            const success = await deleteOrder(id);
            if (success) handleRefresh();
        }
    };

    const handleCancel = async (id: number) => {
        const result = await Swal.fire({
            title: 'Annuler la commande ?',
            text: `Le bon de commande #${id} sera marqué comme annulé.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            cancelButtonText: 'Fermer',
            confirmButtonText: 'Oui, annuler',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });
        
        if (result.isConfirmed) {
            const success = await cancelOrder(id);
            if (success) handleRefresh();
        }
    };

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
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 rounded-lg">
                        <ShoppingCart size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Commandes Fournisseurs</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez vos approvisionnements et réceptions de stock.</p>
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
                        className="flex flex-1 lg:flex-none justify-center items-center gap-2 bg-[#00a896] hover:bg-[#008f7e] text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Nouvelle Commande
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Filtrer par Fournisseur</label>
                    <select 
                        value={filters.provider_id}
                        onChange={(e) => { setFilters({...filters, provider_id: e.target.value}); setPage(1); }}
                        className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00a896] dark:text-white"
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
                        className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00a896] dark:text-white"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="PENDING">En attente</option>
                        <option value="PARTIALLY_RECEIVED">Partiellement Reçue</option>
                        <option value="RECEIVED">Totalement Reçue</option>
                        <option value="CANCELLED">Annulée</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Réf & Date</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fournisseur</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Montant Total</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Statut</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center">
                                        <Loader2 size={32} className="animate-spin text-[#00a896] mx-auto mb-2" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des commandes...</p>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <p className="text-gray-500 dark:text-gray-400">Aucune commande trouvée.</p>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white">#{order.id}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(order.created_at || '').toLocaleDateString('fr-FR')}
                                            </div>
                                        </td>
                                        
                                        <td className="p-4 font-medium text-slate-700 dark:text-gray-300">
                                            {order.provider?.name || 'Inconnu'}
                                        </td>
                                        
                                        <td className="p-4 text-right font-mono font-bold text-[#00a896]">
                                            {order.total_amount?.toLocaleString('fr-FR')} FCFA
                                        </td>
                                        
                                        <td className="p-4 text-center">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                
                                                {/* ÉDITION OU CONSULTATION SÉPARÉES */}
                                                {order.status === 'PENDING' ? (
                                                    <button 
                                                        onClick={() => setSelectedOrderForEdit(order)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                        title="Modifier la commande"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => setSelectedOrderForView(order)}
                                                        className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                        title="Consulter les détails et écarts"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                )}

                                                {/* Réception (Valable si PENDING ou PARTIALLY_RECEIVED) */}
                                                {['PENDING', 'PARTIALLY_RECEIVED'].includes(order.status) && (
                                                    <button 
                                                        onClick={() => setSelectedOrderForReceive(order)}
                                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                                                        title="Réceptionner la marchandise"
                                                    >
                                                        <CheckSquare size={18} />
                                                    </button>
                                                )}

                                                {/* INITIER UN RETOUR (Valable uniquement si on a déjà reçu quelque chose) */}
                                                {['PARTIALLY_RECEIVED', 'RECEIVED'].includes(order.status) && (
                                                    <button 
                                                        onClick={() => setSelectedOrderForReturn(order)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                        title="Initier un retour pour cette commande"
                                                    >
                                                        <Undo2 size={18} />
                                                    </button>
                                                )}

                                                {/* Annuler et Supprimer (Uniquement si PENDING) */}
                                                {order.status === 'PENDING' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleCancel(order.id)}
                                                            className="p-1.5 text-orange-500 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                                                            title="Annuler la commande"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(order.id)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                            title="Supprimer la commande"
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

            {/* MODALES */}
            
            <PurchaseOrderModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)}
                order={null}
                onSuccess={handleRefresh}
            />

            <PurchaseOrderModal 
                isOpen={!!selectedOrderForEdit} 
                onClose={() => setSelectedOrderForEdit(null)}
                order={selectedOrderForEdit}
                onSuccess={handleRefresh}
            />

            <ViewOrderModal 
                isOpen={!!selectedOrderForView} 
                onClose={() => setSelectedOrderForView(null)}
                order={selectedOrderForView}
            />

            <ReceiveOrderModal
                isOpen={!!selectedOrderForReceive}
                onClose={() => setSelectedOrderForReceive(null)}
                order={selectedOrderForReceive}
                onSuccess={handleRefresh}
            />

            {/* LA MODALE DE RETOUR INVOQUÉE DEPUIS LA COMMANDE */}
            <PurchaseReturnModal
                isOpen={!!selectedOrderForReturn}
                onClose={() => setSelectedOrderForReturn(null)}
                existingReturn={null}
                purchaseOrder={selectedOrderForReturn} // <-- Ajout essentiel
                onSuccess={handleRefresh}
            />

            <ExportPurchaseModal
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
                type="orders"
            />

        </div>
    );
};

export default PurchaseOrders;