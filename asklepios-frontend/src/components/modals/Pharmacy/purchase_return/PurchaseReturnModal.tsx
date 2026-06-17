import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { 
    X, Trash2, Undo2, Search, CheckSquare, AlertTriangle, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

// Stores
import usePurchaseStore from '../../../../functions/pharmacy/usePurchaseStore';
import useProviderStore from '../../../../functions/pharmacy/useProviderStore';
import useStockStore from '../../../../functions/pharmacy/useStockStore';

// Types
import type { PurchaseOrderDto, PurchaseReturnDto, PurchaseReturnLinePayload } from '../../../../types/PurchaseTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    existingReturn: PurchaseReturnDto | null;
    purchaseOrder?: PurchaseOrderDto | null; // <-- AJOUTER CECI
    onSuccess: () => void;
}

export const PurchaseReturnModal: React.FC<Props> = ({ isOpen, onClose, existingReturn, onSuccess,purchaseOrder }) => {
    const { createReturn, updateReturn, actionLoading } = usePurchaseStore();
    const { providers, getProviders } = useProviderStore();
    const { stocks, getMyBranchStocks } = useStockStore();

    // --- ÉTATS ---
    const [providerId, setProviderId] = useState<number | ''>('');
    const [purchaseOrderId, setPurchaseOrderId] = useState<number | ''>('');
    const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [lines, setLines] = useState<PurchaseReturnLinePayload[]>([]);
    
    // Filtres du stock (Compartiment Gauche)
    const [searchTerm, setSearchTerm] = useState('');

    // --- CHARGEMENT INITIAL ---
    useEffect(() => {
        if (isOpen) {
            getProviders({});
            getMyBranchStocks({}); // On charge les stocks réels de la succursale
        }
    }, [isOpen, getProviders, getMyBranchStocks]);

    useEffect(() => {
        if (isOpen && existingReturn) {
            setProviderId(existingReturn.provider_id);
            setPurchaseOrderId(existingReturn.purchase_order_id || '');
            setReturnDate(existingReturn.return_date.split('T')[0]);
            if (existingReturn.lines) {
                setLines(existingReturn.lines.map(l => ({
                    article_id: l.article_id,
                    batch_id: l.batch_id,
                    qty_returned: l.qty_returned,
                    reason: l.reason || ''
                })));
            }
  
        } else if (isOpen && !existingReturn) {
            // Si on passe une commande, on pré-remplit le fournisseur et l'ID
    setProviderId(purchaseOrder?.provider_id || '');
    setPurchaseOrderId(purchaseOrder?.id || '');
    setReturnDate(new Date().toISOString().split('T')[0]);
    setLines([]);
    setSearchTerm('');
        }
    }, [isOpen, existingReturn]);

    // --- LOGIQUE DU STOCK (COMPARTIMENT GAUCHE) ---
    
    const filteredStocks = useMemo(() => {
        if (!searchTerm) return stocks;
        const lowerSearch = searchTerm.toLowerCase();
        return stocks.filter(stock => 
            stock.batch?.article?.name.toLowerCase().includes(lowerSearch) ||
            stock.batch?.batch_number.toLowerCase().includes(lowerSearch)
        );
    }, [stocks, searchTerm]);

    // Sélectionner/Désélectionner un lot en stock
    const toggleStockSelection = (stock: any) => {
        const exists = lines.find(l => l.batch_id === stock.batch_id && l.article_id === stock.batch?.article_id);
        if (exists) {
            setLines(lines.filter(l => !(l.batch_id === stock.batch_id && l.article_id === stock.batch?.article_id)));
        } else {
            setLines([...lines, { 
                article_id: stock.batch.article_id, 
                batch_id: stock.batch_id, 
                qty_returned: '', 
                reason: '' 
            }]);
        }
    };

    // --- LOGIQUE DU PANIER DE RETOUR (COMPARTIMENT DROIT) ---

    const providerOptions = useMemo(() => {
        return providers.map(p => ({ value: p.id, label: p.name }));
    }, [providers]);

    const updateLineField = (batchId: number, field: keyof PurchaseReturnLinePayload, value: any) => {
        setLines(lines.map(l => l.batch_id === batchId ? { ...l, [field]: value } : l));
    };

    // --- SOUMISSION ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!providerId) {
            toast.error("Veuillez sélectionner un fournisseur.");
            return;
        }
        if (lines.length === 0) {
            toast.error("Votre panier de retour est vide.");
            return;
        }

        const cleanLines = lines.map(l => ({
            article_id: Number(l.article_id),
            batch_id: Number(l.batch_id),
            qty_returned: Number(l.qty_returned),
            reason: l.reason || 'Non précisé'
        }));

        // Validation stricte
        for (const l of cleanLines) {
            if (l.qty_returned <= 0) {
                toast.error("Veuillez vérifier les quantités retournées (doivent être > 0).");
                return;
            }
            // Vérifier que la quantité retournée ne dépasse pas le stock disponible
            const currentStock = stocks.find(s => s.batch_id === l.batch_id);
            if (currentStock && l.qty_returned > currentStock.qty) {
                toast.error(`Vous ne pouvez pas retourner plus que le stock disponible pour le lot sélectionné.`);
                return;
            }
        }

        const payload = { 
            provider_id: providerId, 
            purchase_order_id: purchaseOrderId || undefined,
            return_date: returnDate,
            lines: cleanLines 
        };

        const success = existingReturn 
            ? await updateReturn(existingReturn.id, payload)
            : await createReturn(payload);

        if (success) {
            onSuccess();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-xs">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl border border-transparent dark:border-gray-800 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                
                {/* EN-TÊTE FIXE */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-red-50 dark:bg-red-900/10 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
                            <Undo2 size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                                {existingReturn ? `Modifier le Retour #${existingReturn.id}` : "Nouveau Retour Fournisseur"}
                            </h2>
                            <p className="text-xs text-red-600 dark:text-red-400">Sélectionnez les lots en stock à gauche à retourner au fournisseur.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* CORPS : 2 COMPARTIMENTS */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                    
                    {/* GAUCHE : STOCKS DISPONIBLES */}
                    <div className="w-full lg:w-5/12 bg-slate-50/50 dark:bg-gray-900/30 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0">
                        
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-800/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Rechercher dans le stock (Article ou Lot)..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-gray-900 border border-transparent focus:border-red-400 rounded-lg text-sm outline-none dark:text-white transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {filteredStocks.length === 0 ? (
                                <p className="text-center text-sm text-gray-500 mt-10">Aucun stock disponible.</p>
                            ) : (
                                filteredStocks.map(stock => {
                                    const isSelected = !!lines.find(l => l.batch_id === stock.batch_id && l.article_id === stock.batch?.article_id);
                                    
                                    // S'il n'y a plus de stock pour ce lot et qu'il n'est pas sélectionné, on le grise
                                    const isDisabled = stock.qty <= 0 && !isSelected;

                                    return (
                                        <div 
                                            key={stock.id} 
                                            onClick={() => !isDisabled && toggleStockSelection(stock)}
                                            className={`p-3 rounded-xl border transition-all flex items-center gap-3 
                                                ${isDisabled ? 'opacity-50 bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : 'cursor-pointer hover:border-red-300'}
                                                ${isSelected ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50' : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'}
                                            `}
                                        >
                                            <div className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 ${isSelected ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                                {isSelected && <CheckSquare size={14} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-bold truncate ${isSelected ? 'text-red-800 dark:text-red-400' : 'text-slate-700 dark:text-gray-200'}`}>
                                                    {stock.batch?.article?.name}
                                                </p>
                                                <div className="flex justify-between items-center mt-1 text-[11px] text-gray-500">
                                                    <span className="font-mono bg-slate-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                                        Lot: {stock.batch?.batch_number}
                                                    </span>
                                                    <span className="font-bold text-slate-700 dark:text-gray-300">
                                                        Qté dispo: {stock.qty}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* DROITE : PANIER DE RETOUR */}
                    <div className="w-full lg:w-7/12 flex flex-col bg-white dark:bg-gray-900 shrink-0">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            
                            {/* DÉTAILS DU RETOUR */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-gray-800/40 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
                                <div className="col-span-full">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Fournisseur concerné *
                                    </label>
                                    <Select 
                                        options={providerOptions}
                                        value={providerOptions.find(opt => opt.value === providerId) || null}
                                        onChange={(selected) => setProviderId(selected ? selected.value : '')}
                                        placeholder="Sélectionner..."
                                        className="text-sm react-select-container"
                                        classNamePrefix="react-select"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        ID Commande (Optionnel)
                                    </label>
                                    <input 
                                        type="number" min="1" placeholder="Réf de la commande d'origine"
                                        value={purchaseOrderId}
                                        onChange={(e) => setPurchaseOrderId(e.target.value)}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Date du retour
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2 text-gray-400" size={16} />
                                        <input 
                                            type="date" 
                                            value={returnDate}
                                            onChange={(e) => setReturnDate(e.target.value)}
                                            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-red-400 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* LIGNES DE RETOUR */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-3">
                                    Lots à retourner ({lines.length})
                                </h3>
                                
                                {lines.length === 0 ? (
                                    <div className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-center">
                                        <p className="text-gray-400 dark:text-gray-500 text-sm">Sélectionnez les lots physiques dans le panneau de gauche.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {lines.map((line) => {
                                            // Retrouver les infos du stock pour affichage
                                            const stockInfo = stocks.find(s => s.batch_id === line.batch_id && s.batch?.article_id === line.article_id);
                                            
                                            return (
                                                <div key={`${line.article_id}-${line.batch_id}`} className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-red-50/20 dark:bg-gray-800/20 hover:border-red-200 transition-colors">
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800 dark:text-gray-200">
                                                                    {stockInfo?.batch?.article?.name || "Article inconnu"}
                                                                </p>
                                                                <span className="text-[10px] font-mono bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                                                                    Lot: {stockInfo?.batch?.batch_number}
                                                                </span>
                                                            </div>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => toggleStockSelection(stockInfo)}
                                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="flex gap-2 items-center text-xs text-orange-600 dark:text-orange-400">
                                                            <AlertTriangle size={12} /> Stock max: {stockInfo?.qty || 0}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Qté Renvoyée</label>
                                                            <input 
                                                                type="number" min="0.1" max={stockInfo?.qty} step="any"
                                                                value={line.qty_returned}
                                                                onChange={(e) => updateLineField(line.batch_id as number, 'qty_returned', e.target.value)}
                                                                className="w-full sm:w-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm font-bold outline-none focus:border-red-400 dark:text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Motif</label>
                                                            <input 
                                                                type="text" placeholder="Ex: Périmé"
                                                                value={line.reason}
                                                                onChange={(e) => updateLineField(line.batch_id as number, 'reason', e.target.value)}
                                                                className="w-full sm:w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 dark:text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* PIED DE MODALE */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-900/80 shrink-0 flex justify-end items-center gap-3">
                            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800 rounded-xl transition-colors">
                                Annuler
                            </button>
                            <button 
                                type="button"
                                onClick={handleSubmit}
                                disabled={actionLoading || lines.length === 0}
                                className="px-8 py-2.5 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none"
                            >
                                {actionLoading ? "Traitement..." : existingReturn ? "Mettre à jour" : "Initier le retour"}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};