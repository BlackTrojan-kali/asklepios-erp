import React, { useState, useEffect } from 'react';
import { X, Syringe, PlusCircle } from 'lucide-react';
import type { PerformedMedicalActPayload } from '../../../../types/ConsultationTypes';

interface AddMedicalActModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (act: PerformedMedicalActPayload) => void;
    medicalActs: any[]; // Remplacer par MedicalActDto[]
    equipments: any[];  // Remplacer par EquipmentDto[]
}

export const AddMedicalActModal: React.FC<AddMedicalActModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    medicalActs,
    equipments
}) => {
    const [selectedActId, setSelectedActId] = useState<number | ''>('');
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | ''>('');
    const [appliedPrice, setAppliedPrice] = useState<number | ''>('');

    // Quand on choisit un acte, on pré-remplit automatiquement le prix avec son tarif de base
    useEffect(() => {
        if (selectedActId) {
            const act = medicalActs.find(a => a.id === Number(selectedActId));
            if (act) setAppliedPrice(act.base_price || 0);
        } else {
            setAppliedPrice('');
        }
    }, [selectedActId, medicalActs]);

    useEffect(() => {
        if (isOpen) {
            setSelectedActId('');
            setSelectedEquipmentId('');
            setAppliedPrice('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!selectedActId || appliedPrice === '') return;

        onAdd({
            medical_act_catalog_id: Number(selectedActId),
            equipment_id: selectedEquipmentId ? Number(selectedEquipmentId) : null,
            applied_price: Number(appliedPrice)
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#faf8f1] dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800">
                
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3 text-[#003366] dark:text-blue-400">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <Syringe size={20} />
                        </div>
                        <h2 className="text-lg font-bold font-brand">Saisir un acte médical</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">Acte réalisé <span className="text-red-500">*</span></label>
                        <select 
                            value={selectedActId} 
                            onChange={(e) => setSelectedActId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none transition-colors dark:text-white"
                        >
                            <option value="">-- Sélectionner l'acte --</option>
                            {medicalActs.map(act => (
                                <option key={act.id} value={act.id}>{act.name} (Base: {act.base_price} FCFA)</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">Tarif appliqué (FCFA) <span className="text-red-500">*</span></label>
                        <input 
                            type="number" 
                            value={appliedPrice} 
                            onChange={(e) => setAppliedPrice(e.target.value ? Number(e.target.value) : '')}
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">Équipement utilisé (Optionnel)</label>
                        <select 
                            value={selectedEquipmentId} 
                            onChange={(e) => setSelectedEquipmentId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none transition-colors dark:text-white"
                        >
                            <option value="">-- Aucun équipement spécifique --</option>
                            {equipments.map(eq => (
                                <option key={eq.id} value={eq.id}>{eq.name} ({eq.status})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="p-5 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 rounded-b-2xl bg-white dark:bg-gray-900">
                    <button onClick={onClose} className="px-5 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors">Annuler</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={!selectedActId || appliedPrice === ''}
                        className="px-6 py-2 bg-[#00a896] hover:bg-[#008f7f] text-white rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-md"
                    >
                        <PlusCircle size={18} /> Ajouter
                    </button>
                </div>
            </div>
        </div>
    );
};