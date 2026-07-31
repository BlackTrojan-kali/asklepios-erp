import React, { useState } from 'react';
import { X, FileText, Download, Calendar, Loader2 } from 'lucide-react';
import useConsultationHistoryStore from '../../../../functions/base_hospital/useConsultationHistoryStore'; // Ajuste le chemin
import  type { ConsultationFilters } from '../../../../functions/base_hospital/useConsultationHistoryStore';

interface ExportConsultationPdfModalProps {
    isOpen: boolean;
    onClose: () => void;
    baseFilters?: ConsultationFilters; // Filtres actuellement actifs dans la vue parente
}

export const ExportConsultationPdfModal: React.FC<ExportConsultationPdfModalProps> = ({ 
    isOpen, 
    onClose, 
    baseFilters = {} 
}) => {
    const { exportConsultationsPdf, exportLoading } = useConsultationHistoryStore();

    // États locaux du formulaire
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [isBilled, setIsBilled] = useState<string>(''); // '', 'true', 'false'

    if (!isOpen) return null;

    const handleExport = async (e: React.FormEvent) => {
        e.preventDefault();

        // On fusionne les filtres de la page parente avec ceux de la modale
        const exportFilters: ConsultationFilters = {
            ...baseFilters,
        };

        if (startDate) exportFilters.start_date = startDate;
        if (endDate) exportFilters.end_date = endDate;
        if (isBilled !== '') exportFilters.is_billed = isBilled;

        const success = await exportConsultationsPdf(exportFilters);
        
        if (success) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                
                {/* HEADER */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
                            <FileText size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                            Exporter le Rapport
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
                <form onSubmit={handleExport} className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Générez un document PDF reprenant l'historique et les statistiques financières des consultations.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-gray-300 flex items-center gap-2">
                                <Calendar size={14} className="text-indigo-500" /> Date de début
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-indigo-500 dark:text-white transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-gray-300 flex items-center gap-2">
                                <Calendar size={14} className="text-indigo-500" /> Date de fin
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                min={startDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-indigo-500 dark:text-white transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                            Statut de facturation
                        </label>
                        <select
                            value={isBilled}
                            onChange={(e) => setIsBilled(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-indigo-500 dark:text-white transition-colors"
                        >
                            <option value="">Toutes les consultations</option>
                            <option value="true">Uniquement facturées</option>
                            <option value="false">En attente de facturation</option>
                        </select>
                    </div>

                </form>

                {/* FOOTER */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={exportLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        onClick={handleExport}
                        disabled={exportLoading}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {exportLoading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Download size={18} />
                        )}
                        Télécharger le PDF
                    </button>
                </div>
            </div>
        </div>
    );
};