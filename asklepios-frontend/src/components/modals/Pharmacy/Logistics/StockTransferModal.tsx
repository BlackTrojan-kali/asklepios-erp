import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, Truck, MapPin, Search, PackageCheck, Package, 
    CheckSquare, Square, CheckCircle2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import Select from 'react-select';

// Stores
import useStockTransferStore from '../../../../functions/pharmacy/useStockTransferStore';
import usePharmacyStore from '../../../../functions/pharmacy/usePharmacyStore'; 
import useDriverStore from '../../../../functions/pharmacy/useDriverStore';
import useVehiculeStore from '../../../../functions/pharmacy/useVehiculeStore';
import useStockStore from '../../../../functions/pharmacy/useStockStore'; // <-- VRAI STORE DE STOCK

// Types
import type { StockTransferPayload } from '../../../../types/transferTypes';
import type { StockDto } from '../../../../types/StockTypes'; 

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// ==========================================
// STYLES REACT-SELECT (Forcé Blanc/Noir)
// ==========================================
const customSelectStyles = {
    control: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: '#ffffff',
        color: '#000000',
        borderColor: state.isFocused ? '#6366f1' : '#e5e7eb',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        minHeight: '38px',
        boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
        '&:hover': { borderColor: '#6366f1' }
    }),
    menu: (provided: any) => ({
        ...provided,
        backgroundColor: '#ffffff',
        color: '#000000',
        zIndex: 9999, // Z-index élevé
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
    }),
    option: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#e0e7ff' : '#ffffff',
        color: state.isSelected ? '#ffffff' : '#000000',
        fontSize: '0.875rem',
        cursor: 'pointer',
        '&:active': { backgroundColor: '#4f46e5' }
    }),
    singleValue: (provided: any) => ({ ...provided, color: '#000000' }),
    input: (provided: any) => ({ ...provided, color: '#000000' }),
    placeholder: (provided: any) => ({ ...provided, color: '#6b7280', fontSize: '0.875rem' }),
    indicatorSeparator: () => ({ display: 'none' })
};

export const StockTransferModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
    // --- STORES ---
    const { createTransfer, actionLoading } = useStockTransferStore();
    const { pharmacyBranches, getPharmacyBranches } = usePharmacyStore();
    const { drivers, getDrivers } = useDriverStore();
    const { vehicules, getVehicules } = useVehiculeStore();
    const { stocks, getMyBranchStocks, loading: stocksLoading } = useStockStore();

    // --- ÉTATS LOGISTIQUES ---
    const [destinationId, setDestinationId] = useState<number | ''>('');
    const [driverId, setDriverId] = useState<number | ''>('');
    const [vehiculeId, setVehiculeId] = useState<number | ''>('');

    // --- ÉTATS SÉLECTION & QUANTITÉS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBatches, setSelectedBatches] = useState<StockDto[]>([]);
    
    const [isGlobalQtyMode, setIsGlobalQtyMode] = useState(false);
    const [globalQty, setGlobalQty] = useState<number | ''>('');
    const [individualQuantities, setIndividualQuantities] = useState<Record<number, number>>({});

    // --- INITIALISATION ---
    useEffect(() => {
        if (isOpen) {
            getPharmacyBranches();
            getDrivers({ is_active: 'true' });
            getVehicules({ is_active: 'true' });
            // On demande un large per_page pour avoir tous les stocks locaux dans la modale
            getMyBranchStocks({ per_page: 1000 }); 
        } else {
            setDestinationId(''); setDriverId(''); setVehiculeId('');
            setSearchTerm(''); setSelectedBatches([]);
            setIsGlobalQtyMode(false); setGlobalQty(''); setIndividualQuantities({});
        }
    }, [isOpen, getPharmacyBranches, getDrivers, getVehicules, getMyBranchStocks]);

    // --- FORMATAGE DES OPTIONS POUR REACT-SELECT ---
    const pharmacyOptions = useMemo(() => pharmacyBranches.map(b => ({ value: b.id, label: b.name })), [pharmacyBranches]);
    const driverOptions = useMemo(() => drivers.map(d => ({ value: d.id, label: d.fullname })), [drivers]);
    const vehiculeOptions = useMemo(() => vehicules.map(v => ({ value: v.id, label: `${v.model} (${v.licence_plate})` })), [vehicules]);

    // --- FILTRAGE DES ARTICLES (Exclure ruptures de stock + Recherche) ---
    const filteredStocks = useMemo(() => {
        return stocks.filter(s => {
            // 1. Ignorer les stocks vides
            if (!s.qty || s.qty <= 0) return false;

            // 2. Filtre de recherche texte
            const articleName = s.batch?.article?.name?.toLowerCase() || '';
            const batchNumber = s.batch?.batch_number?.toLowerCase() || '';
            const term = searchTerm.toLowerCase();
            
            return articleName.includes(term) || batchNumber.includes(term);
        });
    }, [stocks, searchTerm]);

    // --- GESTION DE LA SÉLECTION (INDIVIDUELLE) ---
    const toggleBatchSelection = (stockItem: StockDto) => {
        const isSelected = selectedBatches.some(b => b.batch_id === stockItem.batch_id);
        if (isSelected) {
            setSelectedBatches(prev => prev.filter(b => b.batch_id !== stockItem.batch_id));
            const newQties = { ...individualQuantities };
            delete newQties[stockItem.batch_id];
            setIndividualQuantities(newQties);
        } else {
            setSelectedBatches(prev => [...prev, stockItem]);
            setIndividualQuantities(prev => ({ ...prev, [stockItem.batch_id]: 1 }));
        }
    };

    // --- GESTION DE LA SÉLECTION (TOUT SÉLECTIONNER) ---
    const isAllFilteredSelected = filteredStocks.length > 0 && filteredStocks.every(stock => 
        selectedBatches.some(b => b.batch_id === stock.batch_id)
    );

    const toggleSelectAll = () => {
        if (isAllFilteredSelected) {
            // Désélectionner
            const filteredIds = filteredStocks.map(s => s.batch_id);
            setSelectedBatches(prev => prev.filter(b => !filteredIds.includes(b.batch_id)));
            const newQties = { ...individualQuantities };
            filteredIds.forEach(id => delete newQties[id]);
            setIndividualQuantities(newQties);
        } else {
            // Sélectionner tout (uniquement ce qui est visible dans la recherche)
            const newSelected = [...selectedBatches];
            const newQties = { ...individualQuantities };
            
            filteredStocks.forEach(stock => {
                if (!newSelected.some(b => b.batch_id === stock.batch_id)) {
                    newSelected.push(stock);
                    newQties[stock.batch_id] = 1;
                }
            });
            
            setSelectedBatches(newSelected);
            setIndividualQuantities(newQties);
        }
    };

    // --- VALIDATION ET SOUMISSION ---
    const handleSubmit = async () => {
        if (!destinationId || !driverId || !vehiculeId) {
            toast.error("Veuillez remplir toutes les informations logistiques.");
            return;
        }
        if (selectedBatches.length === 0) {
            toast.error("Sélectionnez au moins un article à transférer.");
            return;
        }

        const linesToSubmit: { batch_id: number, qty: number }[] = [];
        let hasError = false;

        for (const stock of selectedBatches) {
            const qtyToTransfer = isGlobalQtyMode ? Number(globalQty) : individualQuantities[stock.batch_id];
            
            if (!qtyToTransfer || qtyToTransfer <= 0) {
                toast.error(`Quantité invalide pour ${stock.batch?.article?.name}`);
                hasError = true; break;
            }
            if (qtyToTransfer > stock.qty) {
                toast.error(`Stock insuffisant pour ${stock.batch?.article?.name} (Max: ${stock.qty})`);
                hasError = true; break;
            }

            linesToSubmit.push({ batch_id: stock.batch_id, qty: qtyToTransfer });
        }

        if (hasError) return;

        const payload: StockTransferPayload = {
            destination_pharmacy_id: Number(destinationId),
            driver_id: Number(driverId),
            vehicule_id: Number(vehiculeId),
            lines: linesToSubmit
        };

        const success = await createTransfer(payload);
        if (success) {
            onSuccess();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl border border-transparent dark:border-gray-800 animate-in fade-in zoom-in-95 duration-150">
                
                {/* --- EN-TÊTE --- */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50 rounded-t-2xl shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                            <Truck size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                                Initier un Transfert de Stock
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Expédiez des articles vers une autre succursale de l'hôpital.
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* --- CORPS DE LA MODALE --- */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-gray-800">
                    
                    {/* COLONNE GAUCHE */}
                    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900">
                        
                        {/* Zone 1: Logistique (REACT SELECT) */}
                        <div className="p-5 bg-slate-50/50 dark:bg-gray-800/30 shrink-0">
                            <h3 className="text-xs font-bold text-slate-800 dark:text-gray-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <MapPin size={16} className="text-indigo-500" /> Informations d'expédition
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Destinataire <span className="text-red-500">*</span></label>
                                    <Select 
                                        options={pharmacyOptions}
                                        styles={customSelectStyles}
                                        placeholder="Rechercher..."
                                        value={pharmacyOptions.find(o => o.value === destinationId) || null}
                                        onChange={(selected: any) => setDestinationId(selected?.value || '')}
                                        menuPosition="fixed" // <-- Empêche la coupure par le overflow-hidden
                                        isClearable
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Chauffeur <span className="text-red-500">*</span></label>
                                    <Select 
                                        options={driverOptions}
                                        styles={customSelectStyles}
                                        placeholder="Rechercher..."
                                        value={driverOptions.find(o => o.value === driverId) || null}
                                        onChange={(selected: any) => setDriverId(selected?.value || '')}
                                        menuPosition="fixed"
                                        isClearable
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Véhicule <span className="text-red-500">*</span></label>
                                    <Select 
                                        options={vehiculeOptions}
                                        styles={customSelectStyles}
                                        placeholder="Rechercher..."
                                        value={vehiculeOptions.find(o => o.value === vehiculeId) || null}
                                        onChange={(selected: any) => setVehiculeId(selected?.value || '')}
                                        menuPosition="fixed"
                                        isClearable
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Zone 2: Filtrage et Liste du stock */}
                        <div className="p-5 flex-1 flex flex-col min-h-0">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold text-slate-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
                                    <Package size={16} className="text-indigo-500" /> Mon Stock Réel
                                </h3>
                                
                                <button 
                                    onClick={toggleSelectAll}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                                >
                                    {isAllFilteredSelected ? (
                                        <><CheckSquare size={14} /> Tout désélectionner</>
                                    ) : (
                                        <><CheckCircle2 size={14} /> Tout sélectionner</>
                                    )}
                                </button>
                            </div>
                            
                            <div className="relative mb-4 shrink-0">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input 
                                    type="text" placeholder="Rechercher un article ou un N° de lot..."
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-indigo-500 dark:text-white"
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar border border-gray-100 dark:border-gray-800 rounded-xl relative">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 dark:bg-gray-800/50 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-3 text-xs font-semibold text-gray-500 uppercase w-10"></th>
                                            <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Article</th>
                                            <th className="p-3 text-xs font-semibold text-gray-500 uppercase text-center">Lot</th>
                                            <th className="p-3 text-xs font-semibold text-gray-500 uppercase text-right">Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {stocksLoading ? (
                                            <tr><td colSpan={4} className="p-6 text-center text-gray-500 text-sm">Chargement de votre stock...</td></tr>
                                        ) : filteredStocks.length === 0 ? (
                                            <tr><td colSpan={4} className="p-6 text-center text-gray-500 text-sm">Aucun article trouvé en stock.</td></tr>
                                        ) : (
                                            filteredStocks.map(stock => {
                                                const isSelected = selectedBatches.some(b => b.batch_id === stock.batch_id);
                                                return (
                                                    <tr key={stock.batch_id} 
                                                        onClick={() => toggleBatchSelection(stock)}
                                                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-gray-800/50'}`}
                                                    >
                                                        <td className="p-3 text-center">
                                                            {isSelected ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} className="text-gray-400" />}
                                                        </td>
                                                        <td className="p-3 text-sm font-medium text-slate-800 dark:text-gray-200">
                                                            {stock.batch?.article?.name || "Inconnu"}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <span className="text-xs font-mono bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">
                                                                {stock.batch?.batch_number || "N/A"}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-right text-sm font-bold text-slate-700 dark:text-gray-300">
                                                            {stock.qty}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* COLONNE DROITE : Configuration des quantités à expédier */}
                    <div className="w-full lg:w-[380px] bg-slate-50 dark:bg-gray-900/50 flex flex-col h-full shrink-0">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center justify-between">
                                <span>Panier de Transfert</span>
                                <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 text-indigo-300 px-2.5 py-0.5 rounded-full text-xs">
                                    {selectedBatches.length} articles
                                </span>
                            </h3>

                            {/* TOGGLE : Quantité globale vs individuelle */}
                            {selectedBatches.length > 0 && (
                                <div className="mt-4 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only" checked={isGlobalQtyMode} onChange={() => setIsGlobalQtyMode(!isGlobalQtyMode)} />
                                            <div className={`block w-10 h-6 rounded-full transition-colors ${isGlobalQtyMode ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isGlobalQtyMode ? 'translate-x-4' : ''}`}></div>
                                        </div>
                                        <div className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                                            Appliquer la même quantité à tous
                                        </div>
                                    </label>

                                    {isGlobalQtyMode && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <input 
                                                type="number" min="0.1" step="0.1" placeholder="Ex: 50"
                                                value={globalQty} onChange={e => setGlobalQty(e.target.value)}
                                                className="flex-1 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                                            />
                                            <span className="text-xs text-gray-500">unités / article</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Liste des articles sélectionnés avec gestion des quantités */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
                            {selectedBatches.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                                    <PackageCheck size={48} className="mb-3 opacity-20" />
                                    <p className="text-sm">Aucun article sélectionné.</p>
                                    <p className="text-xs mt-1">Cochez les articles dans la liste de gauche pour les ajouter à l'expédition.</p>
                                </div>
                            ) : (
                                selectedBatches.map(stock => {
                                    const error = (!isGlobalQtyMode && individualQuantities[stock.batch_id] > stock.qty) || 
                                                  (isGlobalQtyMode && Number(globalQty) > stock.qty);
                                    
                                    return (
                                        <div key={stock.batch_id} className={`p-3 rounded-xl border ${error ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/50' : 'bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700'} shadow-sm relative group`}>
                                            <button 
                                                onClick={() => toggleBatchSelection(stock)}
                                                className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                            
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-gray-200">{stock.batch?.article?.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">Lot: {stock.batch?.batch_number} • Stock dispo: <span className="font-bold text-indigo-500">{stock.qty}</span></p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number" 
                                                    min="0.1" 
                                                    step="0.1"
                                                    max={stock.qty} // <-- LIMITE STRICTE DE COMPORTEMENT NATIF
                                                    disabled={isGlobalQtyMode}
                                                    value={isGlobalQtyMode ? globalQty : (individualQuantities[stock.batch_id] || '')}
                                                    onChange={e => {
                                                        let val = Number(e.target.value);
                                                        // LIMITE D'INCRÉMENTATION AUTO-CORRECTRICE : 
                                                        // Si l'utilisateur tape un nombre supérieur au stock, on bloque à stock.qty
                                                        if (val > stock.qty) val = stock.qty; 
                                                        
                                                        setIndividualQuantities(prev => ({ ...prev, [stock.batch_id]: val }));
                                                    }}
                                                    className={`w-full ${isGlobalQtyMode ? 'bg-gray-100 dark:bg-gray-900 text-gray-400 cursor-not-allowed' : 'bg-slate-50 dark:bg-gray-900'} border ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500'} rounded-lg px-3 py-1.5 text-sm outline-none font-bold text-right`}
                                                />
                                            </div>
                                            {error && <p className="text-[10px] text-red-500 font-bold mt-1 text-right">Dépassement du stock !</p>}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* --- PIED DE MODALE --- */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-900/80 rounded-b-2xl shrink-0 flex justify-end items-center gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800 rounded-xl transition-colors">
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading || selectedBatches.length === 0}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md disabled:opacity-50"
                    >
                        {actionLoading ? 'Traitement...' : 'Initier l\'expédition'}
                    </button>
                </div>
                
            </div>
        </div>
    );
};