import React, { useState, useEffect, useMemo } from 'react';
import { X, Syringe, PlusCircle } from 'lucide-react';
import Select from 'react-select';
import type { PerformedMedicalActPayload } from '../../../../types/ConsultationTypes';

interface AddMedicalActModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (act: PerformedMedicalActPayload) => void;
    medicalActs: any[];
    equipments: any[];
    AutoRefreshPage: () => void;
}

export const AddMedicalActModal: React.FC<AddMedicalActModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    medicalActs = [],
    equipments = [],
    AutoRefreshPage
}) => {
    const [selectedActId, setSelectedActId] = useState<number | ''>('');
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | ''>('');
    const [appliedPrice, setAppliedPrice] = useState<number | ''>('');

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

    const actOptions = useMemo(() => {
        return medicalActs.map(act => ({
            value: act.id,
            label: `${act.name} (Tarif de base: ${act.base_price || 0} FCFA)`
        }));
    }, [medicalActs]);

    const equipmentOptions = useMemo(() => {
        return equipments.map(eq => ({
            value: eq.id,
            label: `${eq.name} (${eq.status || 'Disponible'})`
        }));
    }, [equipments]);

    const selectStyles = {
        control: (base: any, state: any) => ({
            ...base,
            backgroundColor: document.documentElement.classList.contains("dark") ? "#1f2937" : "#ffffff",
            borderColor: state.isFocused ? "#00a896" : document.documentElement.classList.contains("dark") ? "#374151" : "#d1d5db",
            borderRadius: "0.5rem",
            padding: "2px",
            boxShadow: state.isFocused ? "0 0 0 2px rgba(0, 168, 150, 0.2)" : "none",
            "&:hover": { borderColor: "#00a896" },
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: document.documentElement.classList.contains("dark") ? "#1f2937" : "#ffffff",
            borderRadius: "0.5rem",
            zIndex: 9999,
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected
                ? "#00a896"
                : state.isFocused
                ? document.documentElement.classList.contains("dark") ? "#374151" : "#f3f4f6"
                : "transparent",
            color: state.isSelected
                ? "#ffffff"
                : document.documentElement.classList.contains("dark") ? "#f3f4f6" : "#1f2937",
            cursor: "pointer",
        }),
        singleValue: (base: any) => ({
            ...base,
            color: document.documentElement.classList.contains("dark") ? "#f3f4f6" : "#1f2937",
        }),
        input: (base: any) => ({
            ...base,
            color: document.documentElement.classList.contains("dark") ? "#f3f4f6" : "#1f2937",
        }),
        placeholder: (base: any) => ({
            ...base,
            color: "#9ca3af",
        }),
    };

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!selectedActId || appliedPrice === '') return;

        onAdd({
            medical_act_catalog_id: Number(selectedActId),
            equipment_id: selectedEquipmentId ? Number(selectedEquipmentId) : null,
            applied_price: Number(appliedPrice)
        });
        AutoRefreshPage();
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
                        <Select
                            options={actOptions}
                            value={actOptions.find(opt => opt.value === selectedActId) || null}
                            onChange={(selected) => setSelectedActId(selected ? selected.value : '')}
                            placeholder="Rechercher un acte médical..."
                            isClearable
                            isSearchable
                            styles={selectStyles}
                            className="text-sm"
                            noOptionsMessage={() => "Aucun acte disponible"}
                        />
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
                        <Select
                            options={equipmentOptions}
                            value={equipmentOptions.find(opt => opt.value === selectedEquipmentId) || null}
                            onChange={(selected) => setSelectedEquipmentId(selected ? selected.value : '')}
                            placeholder="Sélectionner un équipement..."
                            isClearable
                            isSearchable
                            styles={selectStyles}
                            className="text-sm"
                            noOptionsMessage={() => "Aucun équipement disponible"}
                        />
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