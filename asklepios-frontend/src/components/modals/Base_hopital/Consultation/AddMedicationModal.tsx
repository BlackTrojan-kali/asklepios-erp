import React, { useState, useEffect } from 'react';
import { X, Pill, Database, PenLine, PlusCircle } from 'lucide-react';
import type { PrescriptionLinePayload } from '../../../../types/ConsultationTypes'; // Ajuste le chemin
// import type { ArticleDto } from '../../../../types/PharmTypes'; // Si tu as défini ce type

interface AddMedicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (medication: PrescriptionLinePayload) => void;
    availableArticles: any[]; // Remplace 'any' par 'ArticleDto' selon ton typage
}

export const AddMedicationModal: React.FC<AddMedicationModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    availableArticles
}) => {
    const [mode, setMode] = useState<'catalogue' | 'manuel'>('catalogue');
    const [selectedArticleId, setSelectedArticleId] = useState<number | ''>('');
    const [customName, setCustomName] = useState('');
    const [dosage, setDosage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setMode('catalogue');
            setSelectedArticleId('');
            setCustomName('');
            setDosage('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!dosage.trim()) return;

        const payload: PrescriptionLinePayload = {
            dosage: dosage,
            article_id: mode === 'catalogue' && selectedArticleId ? Number(selectedArticleId) : null,
            custom_medication_name: mode === 'manuel' ? customName : null,
        };

        onAdd(payload);
        onClose();
    };

    const isSubmitDisabled = !dosage.trim() || (mode === 'catalogue' && !selectedArticleId) || (mode === 'manuel' && !customName.trim());

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#faf8f1] dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800">
                
                {/* HEADER */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3 text-[#003366] dark:text-blue-400">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Pill size={20} />
                        </div>
                        <h2 className="text-lg font-bold font-brand">Prescrire un médicament</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 space-y-6">
                    {/* Switch Mode */}
                    <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl">
                        <button 
                            onClick={() => setMode('catalogue')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'catalogue' ? 'bg-white dark:bg-gray-700 shadow-sm text-[#003366] dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <Database size={16} /> Catalogue Pharmacie
                        </button>
                        <button 
                            onClick={() => setMode('manuel')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'manuel' ? 'bg-white dark:bg-gray-700 shadow-sm text-[#003366] dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <PenLine size={16} /> Saisie Manuelle
                        </button>
                    </div>

                    {/* Saisie Médicament */}
                    {mode === 'catalogue' ? (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">Médicament (Stock de l'hôpital)</label>
                            <select 
                                value={selectedArticleId} 
                                onChange={(e) => setSelectedArticleId(e.target.value)}
                                className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none transition-colors dark:text-white"
                            >
                                <option value="">-- Sélectionner un article --</option>
                                {availableArticles.map(article => (
                                    <option key={article.id} value={article.id}>{article.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">Nom du médicament (Externe)</label>
                            <input 
                                type="text" 
                                value={customName} 
                                onChange={(e) => setCustomName(e.target.value)}
                                placeholder="Ex: Paracétamol 1000mg"
                                className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white"
                            />
                        </div>
                    )}

                    {/* Posologie */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">Posologie et durée <span className="text-red-500">*</span></label>
                        <textarea 
                            value={dosage} 
                            onChange={(e) => setDosage(e.target.value)}
                            placeholder="Ex: 1 comprimé matin, midi et soir pendant 5 jours..."
                            rows={3}
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none resize-none dark:text-white"
                        />
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-5 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 rounded-b-2xl bg-white dark:bg-gray-900">
                    <button onClick={onClose} className="px-5 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors">
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitDisabled}
                        className="px-6 py-2 bg-[#00a896] hover:bg-[#008f7f] text-white rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        <PlusCircle size={18} /> Ajouter à l'ordonnance
                    </button>
                </div>
            </div>
        </div>
    );
};