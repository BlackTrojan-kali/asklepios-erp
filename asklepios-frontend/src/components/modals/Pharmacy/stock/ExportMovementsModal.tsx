import React, { useState } from 'react';
import Select from 'react-select';
import { 
    X, Calendar, Filter, Download, FileText, FileSpreadsheet 
} from 'lucide-react';

// Stores & Types
import useMoveStore from '../../../../functions/pharmacy/useMoveStore';
import type { MovementType, MovementReferenceType } from '../../../../types/StockTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    branchId?: number | ''; // <-- NOUVEAU : Optionnel pour s'adapter à l'admin et au pharmacien
}

export const ExportMovementsModal: React.FC<Props> = ({ isOpen, onClose, branchId }) => {
    const { exportPdf, exportExcel, actionLoading } = useMoveStore();

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [movementType, setMovementType] = useState<MovementType | ''>('');
    const [refType, setRefType] = useState<MovementReferenceType | ''>('');

    const typeOptions = [
        { value: 'ENTRY', label: 'Entrées (+)' },
        { value: 'EXIT', label: 'Sorties (-)' }
    ];

    const operationOptions = [
        { value: 'PURCHASE', label: 'Achats / Réceptions' },
        { value: 'RETURN', label: 'Retours Fournisseurs' },
        { value: 'SALE', label: 'Ventes / Sorties Prescriptions' },
        { value: 'TRANSFER', label: 'Transferts Inter-succursales' },
        { value: 'INVENTORY', label: 'Ajustements Inventaire' },
        { value: 'OTHER', label: 'Autres Opérations' }
    ];

    const handleExport = async (format: 'pdf' | 'excel') => {
        const params: any = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (movementType) params.type = movementType;
        if (refType) params.reference_type = refType;
        if (branchId) params.branch_id = branchId; // <-- Application du filtre succursale s'il existe

        if (format === 'pdf') {
            await exportPdf(params);
        } else {
            await exportExcel(params);
        }
        onClose(); 
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md flex flex-col shadow-2xl border border-transparent dark:border-gray-800 animate-in fade-in zoom-in-95 duration-150">
                
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                            <Download size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Exporter le Journal</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Filtrez la piste d'audit avant extraction.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Du</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input 
                                    type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-50 dark:text-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Au</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input 
                                    type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-50 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                            <Filter size={12} /> Sens du flux
                        </label>
                        <Select 
                            options={typeOptions}
                            value={typeOptions.find(opt => opt.value === movementType) || null}
                            onChange={(s) => setMovementType(selected => s ? (s.value as MovementType) : '')}
                            placeholder="Entrées et Sorties..."
                            isClearable className="text-sm" classNamePrefix="react-select"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                            <Filter size={12} /> Nature de l'opération
                        </label>
                        <Select 
                            options={operationOptions}
                            value={operationOptions.find(opt => opt.value === refType) || null}
                            onChange={(s) => setRefType(selected => s ? (s.value as MovementReferenceType) : '')}
                            placeholder="Toutes les opérations..."
                            isClearable className="text-sm" classNamePrefix="react-select"
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50 rounded-b-2xl">
                    <button 
                        type="button" onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                        Fermer
                    </button>
                    <div className="flex gap-2">
                        <button 
                            type="button" onClick={() => handleExport('pdf')} disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl transition-all disabled:opacity-50"
                        >
                            <FileText size={16} /> PDF
                        </button>
                        <button 
                            type="button" onClick={() => handleExport('excel')} disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#00a896] hover:bg-[#008f7e] text-white rounded-xl transition-all shadow-sm disabled:opacity-50"
                        >
                            <FileSpreadsheet size={16} /> Excel
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};