import React, { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { 
    useCreateLabParameter, 
    useUpdateLabParameter 
} from '../../../hooks/laboratory/useLabParameter';
import { useLabTests } from '../../../hooks/laboratory/useLabTest';
import type { LabParameterDto } from '../../../types/types';

interface LabParameterFormProps {
    isOpen: boolean;
    onClose: () => void;
    selectedParam: LabParameterDto | null;
}

const LabParameterForm: React.FC<LabParameterFormProps> = ({ isOpen, onClose, selectedParam }) => {
    const { data: tests = [] } = useLabTests();
    const createMutation = useCreateLabParameter();
    const updateMutation = useUpdateLabParameter();

    const [formData, setFormData] = useState({ 
        lab_test_id: 0, 
        name: '', 
        unit: '', 
        reference_min_male: '' as number | string, 
        reference_max_male: '' as number | string, 
        reference_min_female: '' as number | string, 
        reference_max_female: '' as number | string,
        reference_text: ''
    });

    const testOptions = useMemo(() => 
        tests.map(t => ({ value: t.id, label: `${t.code} - ${t.name}` })), 
    [tests]);

    useEffect(() => {
        if (selectedParam) {
            setFormData({ 
                lab_test_id: selectedParam.lab_test_id, 
                name: selectedParam.name, 
                unit: selectedParam.unit, 
                reference_min_male: selectedParam.reference_min_male ?? '', 
                reference_max_male: selectedParam.reference_max_male ?? '', 
                reference_min_female: selectedParam.reference_min_female ?? '', 
                reference_max_female: selectedParam.reference_max_female ?? '',
                reference_text: selectedParam.reference_text || ''
            });
        } else {
            setFormData({ 
                lab_test_id: 0, 
                name: '', 
                unit: '', 
                reference_min_male: '', 
                reference_max_male: '', 
                reference_min_female: '', 
                reference_max_female: '',
                reference_text: ''
            });
        }
    }, [selectedParam, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const payload = {
            ...formData,
            reference_min_male: formData.reference_min_male === '' ? null : Number(formData.reference_min_male),
            reference_max_male: formData.reference_max_male === '' ? null : Number(formData.reference_max_male),
            reference_min_female: formData.reference_min_female === '' ? null : Number(formData.reference_min_female),
            reference_max_female: formData.reference_max_female === '' ? null : Number(formData.reference_max_female),
        };

        if (selectedParam) {
            updateMutation.mutate({ id: selectedParam.id, payload }, {
                onSuccess: () => {
                    toast.success("Paramètre mis à jour avec succès");
                    onClose();
                },
                onError: () => toast.error("Erreur lors de la mise à jour")
            });
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => {
                    toast.success("Paramètre créé avec succès");
                    onClose();
                },
                onError: () => toast.error("Erreur lors de la création")
            });
        }
    };

    const selectStyles = {
        control: (base: any) => ({
            ...base,
            backgroundColor: "transparent",
            borderColor: "inherit",
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: document.documentElement.classList.contains("dark") ? "#1f2937" : "white",
            zIndex: 9999,
        }),
        singleValue: (base: any) => ({
            ...base,
            color: document.documentElement.classList.contains("dark") ? "white" : "black",
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isFocused
                ? document.documentElement.classList.contains("dark") ? "#374151" : "#f1f5f9"
                : "transparent",
            color: document.documentElement.classList.contains("dark") ? "white" : "black",
        }),
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-2xl my-8 transform transition-all">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                    {selectedParam ? "Modifier le paramètre" : "Nouveau Paramètre"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">
                                Examen lié *
                            </label>
                            <Select
                                required
                                options={testOptions}
                                value={testOptions.find((o) => o.value === formData.lab_test_id)}
                                onChange={(option: any) =>
                                    setFormData({ ...formData, lab_test_id: option?.value || 0 })
                                }
                                styles={selectStyles}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">
                                Unité *
                            </label>
                            <input
                                required
                                placeholder="ex: g/dL, mg/L..."
                                className="w-full border p-2 rounded bg-slate-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">
                            Nom du paramètre *
                        </label>
                        <input
                            required
                            placeholder="ex: Leucocytes, Hémoglobine..."
                            className="w-full border p-2 rounded bg-slate-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-slate-50 dark:bg-gray-900/50">
                        <h3 className="font-semibold text-sm text-slate-800 dark:text-white mb-4">
                            Valeurs de Référence (Numériques)
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Homme */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-gray-500 uppercase">Homme</p>
                                <div className="flex gap-2">
                                    <div>
                                        <label className="block text-xs mb-1">Min</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full border p-2 rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none"
                                            value={formData.reference_min_male}
                                            onChange={(e) => setFormData({ ...formData, reference_min_male: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1">Max</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full border p-2 rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none"
                                            value={formData.reference_max_male}
                                            onChange={(e) => setFormData({ ...formData, reference_max_male: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Femme */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-gray-500 uppercase">Femme</p>
                                <div className="flex gap-2">
                                    <div>
                                        <label className="block text-xs mb-1">Min</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full border p-2 rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none"
                                            value={formData.reference_min_female}
                                            onChange={(e) => setFormData({ ...formData, reference_min_female: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1">Max</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full border p-2 rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none"
                                            value={formData.reference_max_female}
                                            onChange={(e) => setFormData({ ...formData, reference_max_female: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">
                            Texte de référence (Optionnel)
                        </label>
                        <input
                            placeholder="ex: Négatif, Présent, < 0.5..."
                            className="w-full border p-2 rounded bg-slate-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none"
                            value={formData.reference_text}
                            onChange={(e) => setFormData({ ...formData, reference_text: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded text-slate-700 dark:text-gray-300 transition-colors"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#00a896] hover:bg-[#008f7e] text-white rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {(createMutation.isPending || updateMutation.isPending) && (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            )}
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LabParameterForm;
