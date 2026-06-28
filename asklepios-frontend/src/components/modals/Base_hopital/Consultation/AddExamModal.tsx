import React, { useState, useEffect } from 'react';
import { X, TestTube, PlusCircle } from 'lucide-react';
import type { ExamRequestLinePayload } from '../../../../types/ConsultationTypes'; // Ajuste le chemin

interface AddExamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (exam: ExamRequestLinePayload) => void;
}

export const AddExamModal: React.FC<AddExamModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [examName, setExamName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setExamName('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!examName.trim()) return;

        onAdd({ exam_name: examName.trim() });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#faf8f1] dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800">
                
                {/* HEADER */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3 text-[#003366] dark:text-blue-400">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                            <TestTube size={20} />
                        </div>
                        <h2 className="text-lg font-bold font-brand">Prescrire un examen</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">
                            Nom de l'examen de laboratoire ou imagerie <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            value={examName} 
                            onChange={(e) => setExamName(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter') handleSubmit() }}
                            placeholder="Ex: Numération Formule Sanguine (NFS), Échographie..."
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white"
                            autoFocus
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Cette demande sera automatiquement transmise au laboratoire de l'hôpital une fois la consultation validée.
                        </p>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-5 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 rounded-b-2xl bg-white dark:bg-gray-900">
                    <button onClick={onClose} className="px-5 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors">
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={!examName.trim()}
                        className="px-6 py-2 bg-[#00a896] hover:bg-[#008f7f] text-white rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        <PlusCircle size={18} /> Ajouter
                    </button>
                </div>
            </div>
        </div>
    );
};