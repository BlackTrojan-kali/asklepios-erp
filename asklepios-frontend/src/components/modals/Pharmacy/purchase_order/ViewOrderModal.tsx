import React from 'react';
import { X, Eye, PackageCheck, AlertTriangle } from 'lucide-react';
import type { PurchaseOrderDto } from '../../../../types/PurchaseTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    order: PurchaseOrderDto | null;
}

export const ViewOrderModal: React.FC<Props> = ({ isOpen, onClose, order }) => {
    if (!isOpen || !order) return null;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PARTIALLY_RECEIVED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Partiellement Reçue</span>;
            case 'RECEIVED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Totalement Reçue</span>;
            case 'CANCELLED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Annulée</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{status}</span>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-transparent dark:border-gray-800 animate-in fade-in zoom-in-95">
                
                {/* EN-TÊTE */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50 rounded-t-2xl shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                            <Eye size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                Détails de la Commande #{order.id}
                                {getStatusBadge(order.status)}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Fournisseur : <strong className="text-slate-700 dark:text-gray-300">{order.provider?.name}</strong> | 
                                Créée le : {new Date(order.created_at || '').toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* CORPS : TABLEAU DES ÉCARTS */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    
                    {order.status === 'PARTIALLY_RECEIVED' && (
                        <div className="mb-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/50 p-3 rounded-xl flex items-start gap-3">
                            <AlertTriangle size={18} className="text-orange-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-orange-800 dark:text-orange-400">
                                Cette commande a été réceptionnée partiellement. Observez la colonne <strong>"Écart / Manquant"</strong> pour voir les articles non livrés. Vous pouvez toujours réceptionner le reste en cliquant sur l'icône de réception depuis la liste.
                            </p>
                        </div>
                    )}

                    <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-gray-800/60 text-xs font-bold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                                <tr>
                                    <th className="p-3">Article</th>
                                    <th className="p-3 text-center">Qté Demandée</th>
                                    <th className="p-3 text-center">Qté Reçue</th>
                                    <th className="p-3 text-center">Écart / Manquant</th>
                                    <th className="p-3 text-right">Prix Unitaire</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                {order.lines?.map((line) => {
                                    const missing = Math.max(0, line.qty_ordered - line.qty_received);
                                    const isFullyReceived = line.qty_received >= line.qty_ordered;

                                    return (
                                        <tr key={line.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                            <td className="p-3 font-semibold text-slate-800 dark:text-gray-200">
                                                {line.article?.name || "Article inconnu"}
                                            </td>
                                            
                                            <td className="p-3 text-center font-mono text-slate-600 dark:text-gray-400">
                                                {line.qty_ordered}
                                            </td>
                                            
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 rounded-md font-mono font-bold ${
                                                    line.qty_received > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                                                }`}>
                                                    {line.qty_received}
                                                </span>
                                            </td>
                                            
                                            <td className="p-3 text-center">
                                                {isFullyReceived ? (
                                                    <div className="flex justify-center text-emerald-500" title="Livraison complète">
                                                        <PackageCheck size={18} />
                                                    </div>
                                                ) : (
                                                    <span className="font-mono font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md">
                                                        - {missing}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="p-3 text-right font-mono text-slate-600 dark:text-gray-400">
                                                {line.unit_cost?.toLocaleString('fr-FR')} FCFA
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PIED DE MODALE */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50 rounded-b-2xl shrink-0">
                    <div className="text-right flex-1 mr-4">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Montant Total Initial</p>
                        <p className="text-xl font-black font-mono text-[#00a896]">
                            {order.total_amount?.toLocaleString('fr-FR')} <span className="text-xs">FCFA</span>
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};