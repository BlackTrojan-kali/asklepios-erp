import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { X, CheckCircle, PackageOpen, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import usePurchaseStore from '../../../../functions/pharmacy/usePurchaseStore';
import useStorageLocationStore from '../../../../functions/pharmacy/useStorageLocationStore';
import type { PurchaseOrderDto, ValidatePurchaseOrderLinePayload } from '../../../../types/PurchaseTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    order: PurchaseOrderDto | null;
    onSuccess: () => void;
}

export const ReceiveOrderModal: React.FC<Props> = ({ isOpen, onClose, order, onSuccess }) => {
    const { validateOrder, actionLoading } = usePurchaseStore();
    const { locations, getLocations } = useStorageLocationStore();

    const [lines, setLines] = useState<ValidatePurchaseOrderLinePayload[]>([]);

    useEffect(() => {
        if (isOpen) {
            getLocations({});
        }
    }, [isOpen, getLocations]);

    useEffect(() => {
        if (isOpen && order && order.lines) {
            setLines(order.lines.map(l => ({
                line_id: l.id,
                qty_received: Math.max(0, l.qty_ordered - l.qty_received),
                batch_number: '',
                expire_date: '',
                storage_location_id: null
            })));
        }
    }, [isOpen, order]);

    const locationOptions = useMemo(() => {
        return locations.map(loc => ({
            value: loc.id,
            label: [loc.aisle, loc.shelf].filter(Boolean).join(' - ') || `Zone #${loc.id}`
        }));
    }, [locations]);

    const updateLine = (index: number, field: keyof ValidatePurchaseOrderLinePayload, value: any) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setLines(newLines);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!order || !order.lines) return;

        const activeLines = lines.filter(l => Number(l.qty_received) > 0);

        if (activeLines.length === 0) {
            toast.error("Veuillez saisir au moins une quantité reçue.");
            return;
        }

        // Vérification intelligente : Le lot est-il obligatoire pour les articles reçus ?
        const hasInvalidLine = activeLines.some(activeLine => {
            // Retrouver l'article d'origine via le line_id
            const originalLine = order.lines!.find(ol => ol.id === activeLine.line_id);
            const tracksBatches = originalLine?.article?.track_batches;
            
            // Si l'article trace les lots ET que le champ est vide => Erreur
            if (tracksBatches && !activeLine.batch_number.trim()) {
                return true;
            }
            return false;
        });

        if (hasInvalidLine) {
            toast.error("Le numéro de lot est obligatoire pour les médicaments et produits tracés.");
            return;
        }

        const success = await validateOrder(order.id, { lines: activeLines });
        if (success) {
            onSuccess();
            onClose();
        }
    };

    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-5xl flex flex-col max-h-[90vh] shadow-2xl border border-transparent dark:border-gray-800 animate-in fade-in zoom-in-95">
                
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-teal-50 dark:bg-teal-900/10 rounded-t-2xl shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 rounded-lg">
                            <PackageOpen size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Réceptionner la commande #{order.id}</h2>
                            <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">Fournisseur : {order.provider?.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 p-3 rounded-lg text-sm flex items-start gap-2 mb-4">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <p>Saisissez les quantités reçues. Laissez à 0 les articles non reçus. Pour la parapharmacie (ex: biberons), laissez simplement le champ Lot vide.</p>
                    </div>

                    <div className="space-y-4">
                        {order.lines?.map((line, index) => {
                            const formLine = lines[index];
                            if (!formLine) return null;

                            const isComplete = line.qty_received >= line.qty_ordered;
                            const isBatchRequired = line.article?.track_batches; // Vérifie la nécessité du lot

                            return (
                                <div key={line.id} className={`p-4 border rounded-xl ${isComplete ? 'bg-gray-50 border-gray-200 opacity-60 dark:bg-gray-800/50 dark:border-gray-700' : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-gray-200">
                                                {line.article?.name}
                                                {!isBatchRequired && <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 dark:bg-gray-800 px-2 py-0.5 rounded">Sans traçabilité requise</span>}
                                            </p>
                                            <p className="text-xs text-gray-500">Commandé : {line.qty_ordered} | Déjà reçu : {line.qty_received}</p>
                                        </div>
                                        {isComplete && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded font-bold">Complété</span>}
                                    </div>

                                    {!isComplete && (
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Qté reçue *</label>
                                                <input 
                                                    type="number" min="0" step="any"
                                                    value={formLine.qty_received}
                                                    onChange={(e) => updateLine(index, 'qty_received', e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm outline-none focus:border-teal-400 dark:text-white font-bold"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                                    N° de Lot {isBatchRequired ? '*' : '(Optionnel)'}
                                                </label>
                                                <input 
                                                    type="text" placeholder={isBatchRequired ? "Ex: LOT-123" : "Laisser vide"}
                                                    value={formLine.batch_number}
                                                    onChange={(e) => updateLine(index, 'batch_number', e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm outline-none focus:border-teal-400 dark:text-white uppercase font-mono"
                                                    required={isBatchRequired && Number(formLine.qty_received) > 0}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Péremption</label>
                                                <input 
                                                    type="date"
                                                    value={formLine.expire_date}
                                                    onChange={(e) => updateLine(index, 'expire_date', e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm outline-none focus:border-teal-400 dark:text-white"
                                                    disabled={!isBatchRequired} // On peut désactiver la péremption si non tracé
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ranger sur (Optionnel)</label>
                                                <Select 
                                                    options={locationOptions}
                                                    value={locationOptions.find(opt => opt.value === formLine.storage_location_id) || null}
                                                    onChange={(selected) => updateLine(index, 'storage_location_id', selected ? selected.value : null)}
                                                    placeholder="Étagère..."
                                                    isClearable
                                                    className="text-sm react-select-container"
                                                    classNamePrefix="react-select"
                                                    menuPortalTarget={document.body}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </form>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-slate-50 dark:bg-gray-900/50 rounded-b-2xl shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors">
                        Annuler
                    </button>
                    <button 
                        type="button" onClick={handleSubmit} disabled={actionLoading}
                        className="px-6 py-2 text-sm font-bold bg-[#00a896] hover:bg-[#008f7e] text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <CheckCircle size={16} />
                        {actionLoading ? "Enregistrement..." : "Valider l'entrée en stock"}
                    </button>
                </div>
            </div>
        </div>
    );
};