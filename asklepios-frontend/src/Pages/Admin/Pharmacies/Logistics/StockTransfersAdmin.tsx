import React, { useEffect, useState, useMemo } from 'react';
import { 
    Truck, RefreshCw, Loader2, FileText, 
    CheckCircle2, XCircle, MapPin, Calendar, 
    ChevronDown, ChevronUp, Package, Eye, Building2
} from 'lucide-react';
import Select from 'react-select';

// Stores
import useStockTransferStore from '../../../../functions/pharmacy/useStockTransferStore';
import usePharmacyStore from '../../../../functions/pharmacy/usePharmacyStore';
import type { StockTransferDto } from '../../../../types/transferTypes';

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
        zIndex: 50,
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

const StockTransfersAdmin = () => {
    // --- STORES ---
    const { 
        transfers, pagination, loading, actionLoading,
        getTransfers, exportPdf 
    } = useStockTransferStore();
    
    const { pharmacyBranches, getPharmacyBranches } = usePharmacyStore();

    // --- ÉTATS & FILTRES ---
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>(''); 
    const [pharmacyFilter, setPharmacyFilter] = useState<string>(''); // Spécifique Admin
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [expandedTransferId, setExpandedTransferId] = useState<number | null>(null);

    // --- INITIALISATION ---
    useEffect(() => {
        getPharmacyBranches();
    }, [getPharmacyBranches]);

    // --- FORMATAGE DES OPTIONS POUR REACT-SELECT ---
    const pharmacyOptions = useMemo(() => {
        return pharmacyBranches.map(branch => ({
            value: String(branch.id),
            label: branch.name
        }));
    }, [pharmacyBranches]);

    const statusOptions = [
        { value: 'INITIATED', label: 'En Transit' },
        { value: 'TERMINATED', label: 'Réceptionnés' },
        { value: 'CANCELLED', label: 'Annulés' }
    ];

    // --- CHARGEMENT DES DONNÉES (Debounced) ---
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            getTransfers({ 
                page, 
                status: statusFilter || undefined,
                pharmacy_id: pharmacyFilter || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined
            }, 'admin');
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [getTransfers, page, statusFilter, pharmacyFilter, startDate, endDate]);

    const handleRefresh = () => {
        getTransfers({ 
            page, status: statusFilter, pharmacy_id: pharmacyFilter, start_date: startDate, end_date: endDate 
        }, 'admin');
    };

    // --- UTILITAIRES D'AFFICHAGE ---
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'INITIATED':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"><Truck size={14} /> En Transit</span>;
            case 'TERMINATED':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 size={14} /> Réceptionné</span>;
            case 'CANCELLED':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><XCircle size={14} /> Annulé</span>;
            default:
                return <span className="text-gray-500">{status}</span>;
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '---';
        return new Intl.DateTimeFormat('fr-FR', { 
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
        }).format(new Date(dateString));
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg shadow-sm">
                        <Truck size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Supervision des Transferts</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Vue globale des mouvements inter-pharmacies de l'hôpital.</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <button 
                        onClick={() => exportPdf({ status: statusFilter, pharmacy_id: pharmacyFilter, start_date: startDate, end_date: endDate }, 'admin')} 
                        disabled={actionLoading}
                        className="flex items-center gap-2 p-2.5 bg-white hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-900/20 text-red-600 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 text-sm font-semibold"
                        title="Télécharger le rapport PDF global"
                    >
                        <FileText size={16} /> <span className="hidden sm:inline">Rapport PDF</span>
                    </button>

                    <button 
                        onClick={handleRefresh} 
                        disabled={loading || actionLoading}
                        className="p-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 ml-2"
                        title="Rafraîchir"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* BARRE DE FILTRES AVANCÉE (Avec React Select) */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col lg:flex-row gap-4 items-end">
                
                <div className="w-full lg:w-[30%]">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                        <Building2 size={14}/> Pharmacie Impliquée
                    </label>
                    <Select 
                        options={pharmacyOptions}
                        styles={customSelectStyles}
                        placeholder="Rechercher une pharmacie..."
                        value={pharmacyOptions.find(o => o.value === pharmacyFilter) || null}
                        onChange={(selected: any) => { 
                            setPharmacyFilter(selected?.value || ''); 
                            setPage(1); 
                        }}
                        isClearable
                    />
                </div>

                <div className="w-full lg:w-[20%]">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Statut</label>
                    <Select 
                        options={statusOptions}
                        styles={customSelectStyles}
                        placeholder="Tous les statuts"
                        value={statusOptions.find(o => o.value === statusFilter) || null}
                        onChange={(selected: any) => { 
                            setStatusFilter(selected?.value || ''); 
                            setPage(1); 
                        }}
                        isClearable
                        isSearchable={false} // Pas besoin de recherche pour 3 options
                    />
                </div>

                <div className="w-full lg:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Du (Création)</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                className="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-indigo-500 dark:text-white h-[38px]"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Au (Création)</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                className="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-indigo-500 dark:text-white h-[38px]"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* TABLEAU DES TRANSFERTS (Lecture Seule) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase w-10"></th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Trajet (Source ➔ Dest.)</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Logistique</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Dates</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Statut</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Détails</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {loading && transfers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-2" />
                                        <p className="text-gray-500">Chargement des transferts...</p>
                                    </td>
                                </tr>
                            ) : transfers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-500">
                                        Aucun transfert trouvé pour ces critères.
                                    </td>
                                </tr>
                            ) : (
                                transfers.map((transfer: StockTransferDto) => (
                                    <React.Fragment key={transfer.id}>
                                        {/* LIGNE PRINCIPALE */}
                                        <tr className={`hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors ${expandedTransferId === transfer.id ? 'bg-slate-50 dark:bg-gray-800/50' : ''}`}>
                                            <td className="p-4 text-center cursor-pointer" onClick={() => setExpandedTransferId(expandedTransferId === transfer.id ? null : transfer.id)}>
                                                <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                                                    {expandedTransferId === transfer.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-slate-800 dark:text-gray-200 font-semibold">
                                                        <MapPin size={14} className="text-red-500" />
                                                        {transfer.sourcePharmacy?.name || `Pharmacie #${transfer.source_pharmacy_id}`}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-800 dark:text-gray-200 font-semibold">
                                                        <MapPin size={14} className="text-emerald-500" />
                                                        {transfer.destinationPharmacy?.name || `Pharmacie #${transfer.destination_pharmacy_id}`}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-slate-600 dark:text-gray-400 flex flex-col gap-1">
                                                    <span className="flex items-center gap-1.5"><Truck size={14}/> {transfer.driver?.fullname || 'N/A'}</span>
                                                    <span className="text-xs opacity-75">{transfer.vehicule?.licence_plate || 'Véhicule N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-600 dark:text-gray-400">
                                                <div className="flex flex-col gap-1 text-xs">
                                                    <span><strong className="text-slate-800 dark:text-gray-200">Exp:</strong> {formatDate(transfer.shipped_at)}</span>
                                                    <span><strong className="text-slate-800 dark:text-gray-200">Réc:</strong> {formatDate(transfer.received_at)}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                {getStatusBadge(transfer.status)}
                                            </td>
                                            <td className="p-4 text-right">
                                                {/* BOUTON LECTURE SEULE */}
                                                <button 
                                                    onClick={() => setExpandedTransferId(expandedTransferId === transfer.id ? null : transfer.id)}
                                                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg text-xs font-bold transition-colors"
                                                >
                                                    <Eye size={14} /> {expandedTransferId === transfer.id ? 'Fermer' : 'Inspecter'}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* LIGNE EXTENSIBLE : Détails des articles */}
                                        {expandedTransferId === transfer.id && (
                                            <tr className="bg-slate-50/50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                                                <td colSpan={6} className="p-0">
                                                    <div className="p-6 pl-16">
                                                        <h4 className="text-xs font-bold text-slate-800 dark:text-gray-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                            <Package size={16} className="text-indigo-500" /> Contenu de l'expédition ({transfer.lines?.length || 0} références)
                                                        </h4>
                                                        
                                                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-w-3xl">
                                                            <table className="w-full text-left text-sm">
                                                                <thead className="bg-slate-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                                                    <tr>
                                                                        <th className="px-4 py-2 font-semibold">Article</th>
                                                                        <th className="px-4 py-2 font-semibold">N° Lot</th>
                                                                        <th className="px-4 py-2 font-semibold text-right">Qté Transférée</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                                    {transfer.lines?.map((line, index) => (
                                                                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-gray-700/20">
                                                                            <td className="px-4 py-2 font-medium text-slate-800 dark:text-gray-200">
                                                                                {line.batch?.article?.name || 'Article Inconnu'}
                                                                            </td>
                                                                            <td className="px-4 py-2">
                                                                                <span className="font-mono text-xs bg-white dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                                                                                    {line.batch?.batch_number || `Lot #${line.batch_id}`}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                                                                {line.qty_shipped}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                    {!transfer.lines || transfer.lines.length === 0 && (
                                                                        <tr><td colSpan={3} className="px-4 py-3 text-center text-gray-500">Aucun détail disponible.</td></tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {pagination && pagination.last_page > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Page {pagination.current_page} sur {pagination.last_page} ({pagination.total} transferts)
                        </span>
                        <div className="flex gap-2">
                            <button 
                                disabled={page === 1} 
                                onClick={() => setPage(page - 1)}
                                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 disabled:opacity-50 text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Précédent
                            </button>
                            <button 
                                disabled={page === pagination.last_page} 
                                onClick={() => setPage(page + 1)}
                                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 disabled:opacity-50 text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default StockTransfersAdmin;