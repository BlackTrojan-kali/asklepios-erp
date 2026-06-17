import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { 
    X, 
    FileText, 
    FileSpreadsheet, 
    Calendar, 
    Filter,
    Download
} from 'lucide-react';

// Stores
import usePurchaseStore from '../../../../functions/pharmacy/usePurchaseStore';
import useProviderStore from '../../../../functions/pharmacy/useProviderStore';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    type: 'orders' | 'returns'; // Permet d'utiliser la même modale pour les deux !
}

export const ExportPurchaseModal: React.FC<Props> = ({ isOpen, onClose, type }) => {
    // Hooks
    const { 
        exportOrdersPdf, exportOrdersExcel, 
        exportReturnsPdf, exportReturnsExcel, 
        actionLoading 
    } = usePurchaseStore();
    const { providers, getProviders } = useProviderStore();

    // États des filtres
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [providerId, setProviderId] = useState<number | ''>('');
    const [status, setStatus] = useState<string>('');

    // Chargement des fournisseurs à l'ouverture
    useEffect(() => {
        if (isOpen) {
            getProviders({});
            // Réinitialisation des filtres
            setStartDate('');
            setEndDate('');
            setProviderId('');
            setStatus('');
        }
    }, [isOpen, getProviders]);

    // Options pour les Selects
    const providerOptions = useMemo(() => {
        return providers.map(p => ({ value: p.id, label: p.name }));
    }, [providers]);

    const statusOptions = type === 'orders' 
        ? [
            { value: 'PENDING', label: 'En attente' },
            { value: 'PARTIALLY_RECEIVED', label: 'Partiellement Reçue' },
            { value: 'RECEIVED', label: 'Totalement Reçue' },
            { value: 'CANCELLED', label: 'Annulée' }
        ]
        : [
            { value: 'PENDING', label: 'En attente' },
            { value: 'SHIPPED', label: 'Expédié' },
            { value: 'CANCELLED', label: 'Annulé' }
        ];

    // --- DÉCLENCHEMENT DE L'EXPORT ---
    const handleExport = async (format: 'pdf' | 'excel') => {
        // Préparation des paramètres (on ignore les champs vides)
        const params: any = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (providerId) params.provider_id = providerId;
        if (status) params.status = status;

        if (type === 'orders') {
            if (format === 'pdf') await exportOrdersPdf(params);
            else await exportOrdersExcel(params);
        } else {
            if (format === 'pdf') await exportReturnsPdf(params);
            else await exportReturnsExcel(params);
        }

        onClose(); // Ferme la modale une fois le téléchargement lancé
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl border border-transparent dark:border-gray-800 animate-in fade-in zoom-in-95 duration-150">
                
                {/* EN-TÊTE */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                            <Download size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                                Exporter les {type === 'orders' ? 'Commandes' : 'Retours'}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Appliquez des filtres avant de générer votre fichier.
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* FORMULAIRE DE FILTRES */}
                <div className="p-6 space-y-5">
                    
                    {/* Période */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Date de début
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-400 dark:text-white transition-colors"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Date de fin
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-400 dark:text-white transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fournisseur */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Filter size={14} /> Filtrer par Fournisseur
                        </label>
                        <Select 
                            options={providerOptions}
                            value={providerOptions.find(opt => opt.value === providerId) || null}
                            onChange={(selected) => setProviderId(selected ? selected.value : '')}
                            placeholder="Tous les fournisseurs..."
                            isClearable
                            className="text-sm react-select-container"
                            classNamePrefix="react-select"
                        />
                    </div>

                    {/* Statut */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Filter size={14} /> Filtrer par Statut
                        </label>
                        <Select 
                            options={statusOptions}
                            value={statusOptions.find(opt => opt.value === status) || null}
                            onChange={(selected) => setStatus(selected ? selected.value : '')}
                            placeholder="Tous les statuts..."
                            isClearable
                            className="text-sm react-select-container"
                            classNamePrefix="react-select"
                        />
                    </div>

                </div>

                {/* PIED DE MODALE : BOUTONS D'EXPORT */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50 rounded-b-2xl">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                        Annuler
                    </button>
                    <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={() => handleExport('pdf')}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl transition-all shadow-sm disabled:opacity-50"
                        >
                            <FileText size={16} />
                            Format PDF
                        </button>
                        <button 
                            type="button"
                            onClick={() => handleExport('excel')}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#00a896] hover:bg-[#008f7e] text-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                            <FileSpreadsheet size={16} />
                            Format Excel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};