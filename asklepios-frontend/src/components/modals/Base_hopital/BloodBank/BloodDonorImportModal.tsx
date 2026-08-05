import React, { useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, Building, RefreshCw } from 'lucide-react';
import useBloodDonorStore from '../../../../functions/bloodBank/useBloodDonorStore';

interface CenterOption {
    id: number;
    name: string;
}

interface BloodDonorImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    centers: CenterOption[];
}

const BloodDonorImportModal: React.FC<BloodDonorImportModalProps> = ({ isOpen, onClose, onSuccess, centers }) => {
    const { importBloodDonors, importLoading } = useBloodDonorStore();
    
    const [file, setFile] = useState<File | null>(null);
    const [centerId, setCenterId] = useState<number>(centers.length > 0 ? centers[0].id : 0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || centerId === 0) return;

        const success = await importBloodDonors(file, centerId);
        if (success) {
            setFile(null); // Reset
            onSuccess();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <UploadCloud className="text-emerald-500" size={20} />
                        Importer des Donneurs
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                    <div className="p-6 space-y-5">
                        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                            <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                                Formats acceptés : .xlsx, .xls, .csv. Les colonnes requises sont au minimum le prénom et le contact téléphonique.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Building size={16} /> Rattacher au centre <span className="text-red-500">*</span></label>
                            <select required value={centerId} onChange={(e) => setCenterId(Number(e.target.value))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-slate-700 dark:text-white">
                                <option value={0} disabled>Sélectionner un centre...</option>
                                {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><FileSpreadsheet size={16} /> Fichier Excel <span className="text-red-500">*</span></label>
                            <input 
                                type="file" 
                                required 
                                accept=".xlsx, .xls, .csv" 
                                onChange={handleFileChange}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all"
                            />
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 flex justify-end gap-3">
                        <button type="button" onClick={onClose} disabled={importLoading} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 rounded-lg transition-colors">Annuler</button>
                        <button type="submit" disabled={importLoading || !file} className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-2 disabled:opacity-50">
                            {importLoading && <RefreshCw size={16} className="animate-spin" />}
                            Lancer l'import
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BloodDonorImportModal;