import React, { useEffect, useState } from 'react';
import { X, FileText, CheckCircle, Clock } from 'lucide-react';
import useInventoryStore from '../../../../functions/pharmacy/useInventoryStore';
import type { InventoryDto } from '../../../../types/InventoryTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    inventoryId: number | null;
}

export const ViewInventoryModal: React.FC<Props> = ({ isOpen, onClose, inventoryId }) => {
    const { getInventoryById, loading } = useInventoryStore();
    const [inventory, setInventory] = useState<InventoryDto | null>(null);

    useEffect(() => {
        if (isOpen && inventoryId) {
            getInventoryById(inventoryId).then(data => {
                if (data) setInventory(data);
            });
        }
    }, [isOpen, inventoryId, getInventoryById]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl border border-transparent dark:border-gray-800 animate-in fade-in zoom-in-95 duration-150">
                
                {/* EN-TÊTE */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50 shrink-0 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                                Détails de l'Inventaire #{inventory?.id || '...'}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Consultation de l'historique et des écarts.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* CORPS */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {loading || !inventory ? (
                        <div className="flex-1 flex justify-center items-center">
                            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : (
                        <>
                            {/* Infos Générales */}
                            <div className="p-5 border-b border-gray-100 dark:border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0 bg-white dark:bg-gray-900">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Date d'exécution</p>
                                    <p className="font-medium text-slate-800 dark:text-gray-200">{new Date(inventory.execution_date).toLocaleDateString('fr-FR')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Statut</p>
                                    <div className="mt-1">
                                        {inventory.status === 'VALIDATED' ? (
                                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded text-xs font-bold">
                                                <CheckCircle size={14} /> Validé
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded text-xs font-bold">
                                                <Clock size={14} /> Brouillon
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Note</p>
                                    <p className="font-medium text-slate-800 dark:text-gray-200 italic">{inventory.comment || 'Aucune note'}</p>
                                </div>
                            </div>

                            {/* Tableau des lignes */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-gray-800/50 sticky top-0 border-b border-gray-200 dark:border-gray-700">
                                            <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Article</th>
                                            <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-center">Lot</th>
                                            <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-center">Emplacement</th>
                                            <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-center">Théorique</th>
                                            <th className="p-3 text-xs font-bold text-slate-700 dark:text-gray-300 uppercase text-center">Physique</th>
                                            <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-center">Écart</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {inventory.lines?.map((line) => (
                                            <tr key={line.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="p-3 text-sm font-semibold text-slate-800 dark:text-gray-200">
                                                    {line.batch?.article?.name || 'Inconnu'}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="font-mono text-xs bg-slate-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400">
                                                        {line.batch?.batch_number || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center text-xs text-gray-500 dark:text-gray-400">
                                                    {line.storageLocation ? `${line.storageLocation.aisle}-${line.storageLocation.shelf}` : 'Non rangé'}
                                                </td>
                                                <td className="p-3 text-center font-mono text-sm text-gray-500 dark:text-gray-400">
                                                    {line.system_qty}
                                                </td>
                                                <td className="p-3 text-center font-mono text-sm font-bold text-slate-800 dark:text-gray-200">
                                                    {line.physical_qty}
                                                </td>
                                                <td className="p-3 text-center font-mono text-sm font-bold">
                                                    {line.descrepency > 0 ? (
                                                        <span className="text-emerald-500">+{line.descrepency}</span>
                                                    ) : line.descrepency < 0 ? (
                                                        <span className="text-red-500">{line.descrepency}</span>
                                                    ) : (
                                                        <span className="text-gray-400">0</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};