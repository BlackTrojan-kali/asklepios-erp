import React, { useState } from 'react';
import { X, Download, Filter, Droplet, Activity, Building, RefreshCw } from 'lucide-react';
import useBloodDonorStore from '../../../../functions/bloodBank/useBloodDonorStore';
import type { BloodDonorFilters } from '../../../../types/BloodManageType';

interface CenterOption {
    id: number;
    name: string;
}

interface BloodDonorExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    centers: CenterOption[];
}

const BloodDonorExportModal: React.FC<BloodDonorExportModalProps> = ({ isOpen, onClose, centers }) => {
    const { exportBloodDonors, exportLoading } = useBloodDonorStore();
    
    const [filters, setFilters] = useState<BloodDonorFilters>({
        center_id: '',
        blood_type: '',
        serology_status: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Nettoyer les filtres vides avant l'envoi
        const cleanFilters: any = {};
        if (filters.center_id) cleanFilters.center_id = filters.center_id;
        if (filters.blood_type) cleanFilters.blood_type = filters.blood_type;
        if (filters.serology_status) cleanFilters.serology_status = filters.serology_status;

        await exportBloodDonors(cleanFilters);
        // L'export télécharge un fichier, on peut fermer la modale directement après le clic réussi
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Download className="text-blue-500" size={20} />
                        Exporter les Donneurs
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                            <Filter size={16}/> Filtrez les données à exporter (Optionnel)
                        </p>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Building size={16} /> Filtrer par Centre</label>
                            <select value={filters.center_id} onChange={(e) => setFilters({ ...filters, center_id: e.target.value })} className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-slate-700 dark:text-white">
                                <option value="">Tous les centres</option>
                                {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Droplet size={16} /> Groupe Sanguin ciblé</label>
                            <select value={filters.blood_type} onChange={(e) => setFilters({ ...filters, blood_type: e.target.value })} className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-slate-700 dark:text-white text-red-600 font-medium">
                                <option value="">Tous les groupes</option>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Activity size={16} /> Statut Sérologique</label>
                            <select value={filters.serology_status} onChange={(e) => setFilters({ ...filters, serology_status: e.target.value })} className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-slate-700 dark:text-white">
                                <option value="">Tous les statuts</option>
                                <option value="CLEARED">Conforme uniquement (Apte)</option>
                                <option value="PENDING">En attente (Test requis)</option>
                                <option value="REJECTED">Rejeté</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 flex justify-end gap-3">
                        <button type="button" onClick={onClose} disabled={exportLoading} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 rounded-lg transition-colors">Annuler</button>
                        <button type="submit" disabled={exportLoading} className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50">
                            {exportLoading ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                            Générer l'Excel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BloodDonorExportModal;