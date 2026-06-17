import React from 'react';
import { X, Eye, ShieldAlert } from 'lucide-react';
import type { PurchaseReturnDto } from '../../../../types/PurchaseTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    purchaseReturn: PurchaseReturnDto | null;
}

export const ViewReturnModal: React.FC<Props> = ({ isOpen, onClose, purchaseReturn }) => {
    if (!isOpen || !purchaseReturn) return null;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SHIPPED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Expédié</span>;
            case 'CANCELLED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Annulé</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{status}</span>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-transparent dark:border-gray-800 animate-in fade-in zoom-in-95">
                
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50 rounded-t-2xl shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                            <Eye size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                Détails du Retour #{purchaseReturn.id}
                                {getStatusBadge(purchaseReturn.status)}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Fournisseur : <strong className="text-slate-700 dark:text-gray-300">{purchaseReturn.provider?.name}</strong> | 
                                Date : {new Date(purchaseReturn.return_date).toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    
                    {purchaseReturn.status === 'SHIPPED' && (
                        <div className="mb-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 p-3 rounded-xl flex items-start gap-3">
                            <ShieldAlert size={18} className="text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-blue-800 dark:text-blue-400">
                                Ce retour a été validé et expédié. Les quantités affichées ci-dessous ont été définitivement <strong>déduites de votre stock</strong>.
                            </p>
                        </div>
                    )}

                    <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-gray-800/60 text-xs font-bold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                                <tr>
                                    <th className="p-3 w-[35%]">Article</th>
                                    <th className="p-3 w-[20%] text-center">Lot retourné</th>
                                    <th className="p-3 w-[15%] text-center">Qté Déduite</th>
                                    <th className="p-3 w-[30%]">Motif</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                {purchaseReturn.lines?.map((line) => (
                                    <tr key={line.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                        <td className="p-3 font-semibold text-slate-800 dark:text-gray-200">
    {/* CHANGEMENT ICI */}
    {line.batch?.article?.name || "Article inconnu"}
</td>
                                        <td className="p-3 text-center font-mono text-slate-600 dark:text-gray-400 bg-slate-50/50 dark:bg-gray-800/50">
                                            {line.batch?.batch_number || "N/A"}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="font-mono font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md">
                                                - {line.qty_returned}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400 italic">
                                            {line.reason || "Non précisé"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end items-center bg-slate-50 dark:bg-gray-900/50 rounded-b-2xl shrink-0">
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