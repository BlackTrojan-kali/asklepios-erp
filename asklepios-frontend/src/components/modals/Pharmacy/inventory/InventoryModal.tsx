import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, ClipboardList, Search, AlertCircle, CopyCheck, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

// Stores
import useInventoryStore from '../../../../functions/pharmacy/useInventoryStore';
import useStockStore from '../../../../functions/pharmacy/useStockStore';

// Types
import type { InventoryDto } from '../../../../types/InventoryTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    existingInventory: InventoryDto | null;
    onSuccess: () => void;
}

interface LocalLine {
    batch_id: number;
    storage_location_id: number | null;
    article_name: string;
    batch_number: string;
    location_label: string;
    system_qty: number;
    physical_qty: number | '';
}

export const InventoryModal: React.FC<Props> = ({ isOpen, onClose, existingInventory, onSuccess }) => {
    const { createInventory, updateInventory, actionLoading } = useInventoryStore();
    const { stocks, getMyBranchStocks, loading: stockLoading } = useStockStore();

    // --- ÉTATS ---
    const [executionDate, setExecutionDate] = useState<string>(new Date().toISOString().substring(0, 10));
    const [comment, setComment] = useState<string>('');
    const [lines, setLines] = useState<LocalLine[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // --- CHARGEMENT INITIAL (SÉCURISÉ) ---
    useEffect(() => {
        if (isOpen && !existingInventory) {
            getMyBranchStocks({});
        }
    }, [isOpen, existingInventory, getMyBranchStocks]);

    useEffect(() => {
        if (!isOpen) return;

        if (existingInventory) {
            // MODE ÉDITION
            // .substring(0, 10) garantit qu'on extrait YYYY-MM-DD peu importe le format (avec ou sans "T")
            const safeDate = existingInventory.execution_date ? String(existingInventory.execution_date).substring(0, 10) : new Date().toISOString().substring(0, 10);
            setExecutionDate(safeDate);
            setComment(existingInventory.comment || '');
            
            const loadedLines: LocalLine[] = existingInventory.lines?.map(l => ({
                batch_id: Number(l.batch_id),
                storage_location_id: l.storage_location_id ? Number(l.storage_location_id) : null,
                article_name: l.batch?.article?.name || 'Article inconnu',
                batch_number: l.batch?.batch_number || 'N/A',
                location_label: l.storage_location ? `${l.storage_location.aisle}-${l.storage_location.shelf}` : 'Non rangé',
                system_qty: Number(l.system_qty),
                // On s'assure de bien convertir les "null" de l'API en champ vide ''
                physical_qty: (l.physical_qty === null || l.physical_qty === undefined) ? '' : Number(l.physical_qty)
            })) || [];
            
            setLines(loadedLines);
        } else if (stocks.length > 0 && lines.length === 0) {
            // MODE CRÉATION
            setExecutionDate(new Date().toISOString().substring(0, 10));
            setComment('');
            
            const initialLines: LocalLine[] = stocks.map(s => ({
                batch_id: Number(s.batch_id),
                storage_location_id: s.storage_location_id ? Number(s.storage_location_id) : null,
                article_name: s.batch?.article?.name || 'Article inconnu',
                batch_number: s.batch?.batch_number || 'N/A',
                location_label: s.storage_location ? `${s.storage_location.aisle}-${s.storage_location.shelf}` : 'Non rangé',
                system_qty: Number(s.qty),
                physical_qty: '' 
            }));
            
            setLines(initialLines);
        }
    // On écoute uniquement existingInventory?.id pour éviter la boucle d'écrasement infinie
    }, [isOpen, existingInventory?.id, stocks.length]); 

    // Nettoyage à la fermeture
    useEffect(() => {
        if (!isOpen) {
            setLines([]);
            setSearchTerm('');
        }
    }, [isOpen]);

    // --- LOGIQUE DE SAISIE ---
    const handleQtyChange = (batchId: number, locId: number | null, value: string) => {
        const parsedValue = value === '' ? '' : Math.max(0, Number(value)); 
        
        setLines(prev => prev.map(l => 
            // On force la comparaison en Number et String pour éviter les conflits de types (ex: "null" vs null)
            (Number(l.batch_id) === Number(batchId) && String(l.storage_location_id) === String(locId)) 
                ? { ...l, physical_qty: parsedValue } 
                : l
        ));
    };

    const handleCopySystemQty = () => {
        setLines(prev => prev.map(l => ({
            ...l,
            physical_qty: l.system_qty
        })));
        toast.success("Quantités théoriques recopiées !");
    };

    // --- FILTRAGE POUR LA RECHERCHE VISUELLE ---
    const filteredLines = useMemo(() => {
        if (!searchTerm) return lines;
        const lowerSearch = searchTerm.toLowerCase();
        return lines.filter(l => 
            l.article_name?.toLowerCase().includes(lowerSearch) || 
            l.batch_number?.toLowerCase().includes(lowerSearch) ||
            l.location_label?.toLowerCase().includes(lowerSearch)
        );
    }, [lines, searchTerm]);

    // --- SOUMISSION ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation stricte incluant null et undefined
        const uncounted = lines.filter(l => l.physical_qty === '' || l.physical_qty === null || l.physical_qty === undefined);
        if (uncounted.length > 0) {
            toast.error(`Il reste ${uncounted.length} ligne(s) non comptée(s). Saisissez 0 si le produit n'est plus là.`);
            return;
        }

        const payload = {
            execution_date: executionDate,
            comment: comment || null,
            lines: lines.map(l => ({
                batch_id: Number(l.batch_id),
                storage_location_id: l.storage_location_id ? Number(l.storage_location_id) : null,
                physical_qty: Number(l.physical_qty)
            }))
        };

        const success = existingInventory 
            ? await updateInventory(existingInventory.id, payload)
            : await createInventory(payload);

        if (success) {
            onSuccess();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-xs">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl border border-transparent dark:border-gray-800 animate-in fade-in zoom-in-95 duration-150">
                
                {/* EN-TÊTE FIXE */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/10 shrink-0 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                                {existingInventory ? `Modifier le brouillon N°${existingInventory.id}` : "Nouvelle Fiche d'Inventaire"}
                            </h2>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400">Renseignez les quantités physiquement présentes en rayon.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* CORPS : FORMULAIRE ET TABLEAU */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    
                    {/* Zone d'en-tête (Dates, Notes, Recherche) */}
                    <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Date d'exécution *</label>
                            <input 
                                type="date" 
                                value={executionDate}
                                onChange={(e) => setExecutionDate(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:text-white"
                                required
                            />
                        </div>
                        
                        <div className="md:col-span-5">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Note / Observations</label>
                            <input 
                                type="text" 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Ex: Inventaire trimestriel, présence de produits avariés..."
                                className="w-full bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:text-white"
                            />
                        </div>

                        <div className="md:col-span-4 flex flex-col justify-end">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Chercher un article, un lot..."
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-indigo-400 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Zone de contrôle rapide */}
                    <div className="px-5 py-3 bg-slate-50/80 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-800 shrink-0 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-bold text-slate-700 dark:text-gray-300">Progression :</span>
                            <span className="font-mono bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-bold">
                                {lines.filter(l => l.physical_qty !== '').length} / {lines.length}
                            </span>
                        </div>
                        <button 
                            type="button"
                            onClick={handleCopySystemQty}
                            className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 py-1.5 px-3 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800/50"
                        >
                            <CopyCheck size={14} /> Pré-remplir avec le système
                        </button>
                    </div>

                    {/* Zone du Tableau défilable */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                        {stockLoading && lines.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <AlertCircle size={32} className="animate-pulse mb-3 text-indigo-400" />
                                <p>Extraction du stock en cours...</p>
                            </div>
                        ) : lines.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <p>Aucun stock à inventorier dans cette succursale.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 dark:bg-gray-800 sticky top-0 z-10 shadow-sm border-b border-gray-200 dark:border-gray-700">
                                        <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Article</th>
                                        <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-center">Lot</th>
                                        <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-center">Emplacement</th>
                                        <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-center">Qté Système</th>
                                        <th className="p-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase text-center bg-indigo-50/50 dark:bg-indigo-900/20">Qté Physique</th>
                                        <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-center">Écart</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredLines.map((line) => {
                                        const isCounted = line.physical_qty !== '';
                                        const discrepancy = isCounted ? Number(line.physical_qty) - line.system_qty : 0;
                                        
                                        return (
                                            <tr key={`${line.batch_id}-${line.storage_location_id}`} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="p-3 font-semibold text-sm text-slate-800 dark:text-gray-200">
                                                    {line.article_name}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="font-mono text-xs bg-slate-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400">
                                                        {line.batch_number}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center text-xs text-gray-500 dark:text-gray-400">
                                                    {line.location_label}
                                                </td>
                                                <td className="p-3 text-center font-mono text-sm text-gray-500 dark:text-gray-400">
                                                    {line.system_qty}
                                                </td>
                                                
                                                {/* CHAMP DE SAISIE */}
                                                <td className="p-2 text-center bg-indigo-50/30 dark:bg-indigo-900/10">
                                                    <input 
                                                        type="number" min="0" step="any"
                                                        value={line.physical_qty}
                                                        onChange={(e) => handleQtyChange(line.batch_id, line.storage_location_id, e.target.value)}
                                                        className={`w-24 text-center mx-auto font-mono font-bold text-sm bg-white dark:bg-gray-900 border rounded-lg py-1.5 outline-none transition-colors ${
                                                            line.physical_qty === '' 
                                                                ? 'border-red-300 dark:border-red-800 focus:border-red-500' // Alerte visuelle si vide
                                                                : 'border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 text-indigo-700 dark:text-indigo-400'
                                                        }`}
                                                        placeholder="?"
                                                    />
                                                </td>

                                                {/* ÉCART */}
                                                <td className="p-3 text-center font-mono text-sm font-bold">
                                                    {!isCounted ? (
                                                        <span className="text-gray-300 dark:text-gray-600">-</span>
                                                    ) : discrepancy > 0 ? (
                                                        <span className="text-emerald-500">+{discrepancy}</span>
                                                    ) : discrepancy < 0 ? (
                                                        <span className="text-red-500">{discrepancy}</span>
                                                    ) : (
                                                        <span className="text-gray-400">0</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* PIED DE MODALE */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-900/80 shrink-0 flex justify-end items-center gap-3 rounded-b-2xl">
                    <button 
                        type="button" onClick={onClose} 
                        className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        type="button"
                        onClick={handleSubmit}
                        disabled={actionLoading || lines.length === 0}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md disabled:opacity-50"
                    >
                        <Save size={16} />
                        {actionLoading ? "Enregistrement..." : existingInventory ? "Mettre à jour le brouillon" : "Enregistrer le brouillon"}
                    </button>
                </div>
            </div>
        </div>
    );
};