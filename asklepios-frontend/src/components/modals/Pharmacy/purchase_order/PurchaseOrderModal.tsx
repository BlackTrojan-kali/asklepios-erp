import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { 
    X, 
    Trash2, 
    ShoppingBag, 
    Calculator,
    AlertTriangle,
    Clock,
    Search,
    CheckSquare,
    Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

// Stores
import usePurchaseStore from '../../../../functions/pharmacy/usePurchaseStore';
import useArticleStore from '../../../../functions/pharmacy/useArticleStore';
import useProviderStore from '../../../../functions/pharmacy/useProviderStore';

// Types
import type { PurchaseOrderDto, PurchaseOrderLinePayload } from '../../../../types/PurchaseTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    order: PurchaseOrderDto | null;
    onSuccess: () => void;
}

export const PurchaseOrderModal: React.FC<Props> = ({ isOpen, onClose, order, onSuccess }) => {
    const { createOrder, updateOrder, actionLoading } = usePurchaseStore();
    const { articles, getArticles } = useArticleStore();
    const { providers, getProviders } = useProviderStore();

    // --- ÉTATS ---
    const [providerId, setProviderId] = useState<number | ''>('');
    const [lines, setLines] = useState<PurchaseOrderLinePayload[]>([]);
    
    // Filtres du catalogue (Compartiment Gauche)
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLowStock, setFilterLowStock] = useState(false);
    const [filterExpiring, setFilterExpiring] = useState(false);
    
    // Quantité générale (Bulk action)
    const [bulkQty, setBulkQty] = useState<string>('');

    // --- CHARGEMENT INITIAL ---
    useEffect(() => {
        if (isOpen) {
            getArticles({});
            getProviders({});
        }
    }, [isOpen, getArticles, getProviders]);

    useEffect(() => {
        if (isOpen && order) {
            setProviderId(order.provider_id);
            if (order.lines) {
                setLines(order.lines.map(l => ({
                    article_id: l.article_id,
                    qty_ordered: l.qty_ordered,
                    unit_cost: l.unit_cost || 0
                })));
            }
        } else if (isOpen && !order) {
            setProviderId('');
            setLines([]);
            setSearchTerm('');
            setFilterLowStock(false);
            setFilterExpiring(false);
        }
    }, [isOpen, order]);

    // --- LOGIQUE DU CATALOGUE (COMPARTIMENT GAUCHE) ---
    
    // Simuler le filtrage intelligent (Nécessite que ton backend renvoie ces infos dans ArticleDto)
    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            // Recherche textuelle
            const matchesSearch = article.name.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Filtre : Stock critique (Hypothèse : article possède stock_qty et global_min_qty)
            // Remplace par la vraie logique de ton DTO
            const isLowStock = article.global_min_qty ? (article.stock_qty || 0) <= article.global_min_qty : false;
            
            // Filtre : Péremption (Hypothèse : article possède un flag has_expiring_batches)
            const isExpiring = article.has_expiring_batches || false; 

            if (!matchesSearch) return false;
            if (filterLowStock && !isLowStock) return false;
            if (filterExpiring && !isExpiring) return false;

            return true;
        });
    }, [articles, searchTerm, filterLowStock, filterExpiring]);

    // Basculer la sélection d'un article
    const toggleArticleSelection = (articleId: number) => {
        const exists = lines.find(l => l.article_id === articleId);
        if (exists) {
            // Retirer
            setLines(lines.filter(l => l.article_id !== articleId));
        } else {
            // Ajouter
            setLines([...lines, { article_id: articleId, qty_ordered: '', unit_cost: '' }]);
        }
    };

    // Appliquer une quantité générale à TOUS les articles sélectionnés
    const applyBulkQuantity = () => {
        if (!bulkQty || Number(bulkQty) <= 0) {
            toast.error("Veuillez saisir une quantité valide.");
            return;
        }
        if (lines.length === 0) {
            toast.error("Veuillez d'abord sélectionner des articles.");
            return;
        }

        const newLines = lines.map(line => ({
            ...line,
            qty_ordered: Number(bulkQty)
        }));
        setLines(newLines);
        setBulkQty('');
        toast.success(`Quantité ${bulkQty} appliquée à ${lines.length} article(s).`);
    };

    // --- LOGIQUE DU PANIER (COMPARTIMENT DROIT) ---

    const providerOptions = useMemo(() => {
        return providers.map(p => ({ value: p.id, label: p.name }));
    }, [providers]);

    const updateLineField = (articleId: number | '', field: keyof PurchaseOrderLinePayload, value: any) => {
        setLines(lines.map(l => l.article_id === articleId ? { ...l, [field]: value } : l));
    };

    const globalTotal = useMemo(() => {
        return lines.reduce((sum, line) => {
            const qty = Number(line.qty_ordered) || 0;
            const cost = Number(line.unit_cost) || 0;
            return sum + (qty * cost);
        }, 0);
    }, [lines]);

    // --- SOUMISSION ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!providerId) {
            toast.error("Veuillez sélectionner un fournisseur.");
            return;
        }
        if (lines.length === 0) {
            toast.error("Votre bon de commande est vide.");
            return;
        }

        const cleanLines = lines.map(l => ({
            article_id: Number(l.article_id),
            qty_ordered: Number(l.qty_ordered),
            unit_cost: Number(l.unit_cost) || 0
        }));

        const hasInvalidLine = cleanLines.some(l => !l.article_id || l.qty_ordered <= 0);
        if (hasInvalidLine) {
            toast.error("Vérifiez les quantités : elles doivent être supérieures à 0.");
            return;
        }

        const payload = { provider_id: providerId, lines: cleanLines };

        const success = order 
            ? await updateOrder(order.id, payload)
            : await createOrder(payload);

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
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#00a896]/10 text-[#00a896] rounded-lg">
                            <ShoppingBag size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                                {order ? `Modifier la Commande #${order.id}` : "Nouveau Bon de Commande"}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Sélectionnez vos articles à gauche et ajustez les détails à droite.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* CORPS : 2 COMPARTIMENTS (SPLIT VIEW) */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                    
                    {/* ========================================================= */}
                    {/* COMPARTIMENT GAUCHE : CATALOGUE ET SÉLECTION              */}
                    {/* ========================================================= */}
                    <div className="w-full lg:w-5/12 bg-slate-50/50 dark:bg-gray-900/30 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0">
                        
                        {/* Barre de filtres */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3 shrink-0 bg-white dark:bg-gray-800/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Rechercher un article..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-gray-900 border border-transparent focus:border-[#00a896] rounded-lg text-sm outline-none dark:text-white transition-colors"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setFilterLowStock(!filterLowStock)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${filterLowStock ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}
                                >
                                    <AlertTriangle size={14} /> Stock Critique
                                </button>
                                <button 
                                    onClick={() => setFilterExpiring(!filterExpiring)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${filterExpiring ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}
                                >
                                    <Clock size={14} /> Péremption Proche
                                </button>
                            </div>
                        </div>

                        {/* Liste des articles */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {filteredArticles.length === 0 ? (
                                <p className="text-center text-sm text-gray-500 mt-10">Aucun article ne correspond à ces critères.</p>
                            ) : (
                                filteredArticles.map(article => {
                                    const isSelected = !!lines.find(l => l.article_id === article.id);
                                    return (
                                        <div 
                                            key={article.id} 
                                            onClick={() => toggleArticleSelection(article.id)}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${isSelected ? 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800/50' : 'bg-white border-gray-200 hover:border-teal-300 dark:bg-gray-800 dark:border-gray-700'}`}
                                        >
                                            <div className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 ${isSelected ? 'bg-[#00a896] border-[#00a896] text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                                {isSelected && <CheckSquare size={14} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-bold truncate ${isSelected ? 'text-teal-800 dark:text-teal-400' : 'text-slate-700 dark:text-gray-200'}`}>
                                                    {article.name}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                                                    <span>En stock: {article.stock_qty || 0}</span>
                                                    <span>Seuil: {article.global_min_qty || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Actions de masse (Bulk) */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shrink-0">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                                Appliquer une quantité à la sélection ({lines.length})
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    placeholder="Ex: 50"
                                    min="1"
                                    value={bulkQty}
                                    onChange={(e) => setBulkQty(e.target.value)}
                                    className="w-24 px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-[#00a896] dark:text-white"
                                />
                                <button 
                                    type="button"
                                    onClick={applyBulkQuantity}
                                    className="flex-1 bg-slate-800 text-white hover:bg-slate-700 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-bold transition-colors"
                                >
                                    Appliquer à tous
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ========================================================= */}
                    {/* COMPARTIMENT DROIT : PANIER ET DÉTAILS DE COMMANDE        */}
                    {/* ========================================================= */}
                    <div className="w-full lg:w-7/12 flex flex-col bg-white dark:bg-gray-900 shrink-0">
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            
                            {/* FOURNISSEUR */}
                            <div className="bg-slate-50 dark:bg-gray-800/40 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">
                                    Fournisseur / Grossiste *
                                </label>
                                <Select 
                                    options={providerOptions}
                                    value={providerOptions.find(opt => opt.value === providerId) || null}
                                    onChange={(selected) => setProviderId(selected ? selected.value : '')}
                                    placeholder="Sélectionner le destinataire de la commande..."
                                    isClearable
                                    className="text-sm react-select-container"
                                    classNamePrefix="react-select"
                                />
                            </div>

                            {/* LIGNES SÉLECTIONNÉES */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <Layers size={16} className="text-[#00a896]" />
                                    Lignes de la commande ({lines.length})
                                </h3>
                                
                                {lines.length === 0 ? (
                                    <div className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-center">
                                        <p className="text-gray-400 dark:text-gray-500 text-sm">Veuillez sélectionner des articles dans le catalogue à gauche.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {lines.map((line) => {
                                            const articleInfo = articles.find(a => a.id === line.article_id);
                                            const totalLine = (Number(line.qty_ordered) || 0) * (Number(line.unit_cost) || 0);
                                            
                                            return (
                                                <div key={line.article_id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-slate-50/50 dark:bg-gray-800/20 hover:border-teal-200 transition-colors group">
                                                    
                                                    {/* Nom & Suppression */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between">
                                                            <p className="text-sm font-bold text-slate-800 dark:text-gray-200 pr-2">
                                                                {articleInfo?.name || "Article inconnu"}
                                                            </p>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => toggleArticleSelection(line.article_id as number)}
                                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Inputs de quantité et prix individuels */}
                                                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                                                        <div className="w-24">
                                                            <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Qté demandée</label>
                                                            <input 
                                                                type="number" min="0.1" step="any" placeholder="0"
                                                                value={line.qty_ordered}
                                                                onChange={(e) => updateLineField(line.article_id, 'qty_ordered', e.target.value)}
                                                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm font-bold text-center outline-none focus:border-[#00a896] dark:text-white"
                                                            />
                                                        </div>
                                                        <div className="w-28">
                                                            <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Prix U. (FCFA)</label>
                                                            <input 
                                                                type="number" min="0" placeholder="0"
                                                                value={line.unit_cost}
                                                                onChange={(e) => updateLineField(line.article_id, 'unit_cost', e.target.value)}
                                                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-[#00a896] dark:text-white"
                                                            />
                                                        </div>
                                                        <div className="w-24 text-right">
                                                            <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Total Ligne</label>
                                                            <span className="font-mono font-bold text-slate-700 dark:text-gray-300">
                                                                {totalLine.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* PIED DE MODALE : TOTAL ET VALIDATION */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-900/80 shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4">
                            
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-200 dark:bg-gray-800 rounded-lg">
                                    <Calculator size={20} className="text-slate-600 dark:text-gray-300" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-bold tracking-wider">Montant Estimé</p>
                                    <p className="text-xl font-black font-mono text-[#00a896]">
                                        {globalTotal.toLocaleString('fr-FR')} <span className="text-xs text-slate-500">FCFA</span>
                                    </p>
                                </div>
                            </div>

                            <button 
                                type="button"
                                onClick={handleSubmit}
                                disabled={actionLoading || lines.length === 0}
                                className="w-full sm:w-auto px-8 py-3 text-sm font-bold bg-[#00a896] hover:bg-[#008f7e] text-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none"
                            >
                                {actionLoading ? "Enregistrement..." : order ? "Sauvegarder les modifications" : "Valider la commande"}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};