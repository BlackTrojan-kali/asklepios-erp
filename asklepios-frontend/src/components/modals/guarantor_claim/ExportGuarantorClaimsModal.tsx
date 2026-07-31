import React, { useState } from 'react';
import { X, Download, Calendar, Loader2, FileText, FileSpreadsheet, Building2, Activity } from 'lucide-react';
import useGuarantorClaimStore from '../../../functions/base_hospital/useGuarantorClaimStore';

interface ExportGuarantorClaimsModalProps {
    isOpen: boolean;
    onClose: () => void;
    baseFilters?: any; 
    insurances: any[]; // Liste des assurances passée depuis le composant parent
}

export const ExportGuarantorClaimsModal: React.FC<ExportGuarantorClaimsModalProps> = ({ 
    isOpen, 
    onClose, 
    baseFilters = {},
    insurances
}) => {
    const { exportClaimsPdfList, exportClaimsExcelList, exportLoading } = useGuarantorClaimStore();

    const [month, setMonth] = useState<string>(baseFilters.claim_month || '');
    const [status, setStatus] = useState<string>(baseFilters.status || ''); 
    const [insuranceId, setInsuranceId] = useState<string>(baseFilters.insurance_company_id || '');

    if (!isOpen) return null;

    const buildFilters = () => {
        const filters = { ...baseFilters };
        if (month) filters.claim_month = month;
        if (status) filters.status = status;
        if (insuranceId) filters.insurance_company_id = insuranceId;
        return filters;
    };

    const handleExportPdf = async () => {
        const success = await exportClaimsPdfList(buildFilters());
        if (success) onClose();
    };

    const handleExportExcel = async () => {
        const success = await exportClaimsExcelList(buildFilters());
        if (success) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800">
                
                {/* HEADER */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                            <Download size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                            Exporter l'historique
                        </h2>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={exportLoading}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* BODY (Form) */}
                <div className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Générez un rapport PDF ou un fichier Excel des bordereaux d'assurance. Affinez les critères ci-dessous :
                    </p>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-gray-300 flex items-center gap-2">
                            <Calendar size={14} className="text-indigo-500" /> Mois de Facturation
                        </label>
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-800 dark:text-white transition-colors"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-gray-300 flex items-center gap-2">
                            <Building2 size={14} className="text-indigo-500" /> Compagnie d'Assurance
                        </label>
                        <select
                            value={insuranceId}
                            onChange={(e) => setInsuranceId(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-800 dark:text-white transition-colors"
                        >
                            <option value="">Toutes les assurances</option>
                            {insurances.map(ins => <option key={ins.id} value={ins.id}>{ins.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-gray-300 flex items-center gap-2">
                            <Activity size={14} className="text-indigo-500" /> Statut du Bordereau
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-800 dark:text-white transition-colors"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="DRAFT">Brouillons</option>
                            <option value="SUBMITTED">Soumis à l'assurance</option>
                            <option value="PAID">Payés</option>
                            <option value="DISPUTED">En litige</option>
                        </select>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between gap-3">
                    <button
                        type="button"
                        onClick={handleExportExcel}
                        disabled={exportLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {exportLoading ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                        Excel
                    </button>
                    <button
                        type="button"
                        onClick={handleExportPdf}
                        disabled={exportLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-70"
                    >
                        {exportLoading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                        PDF
                    </button>
                </div>
            </div>
        </div>
    );
};