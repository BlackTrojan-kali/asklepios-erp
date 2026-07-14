import React, { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { 
    useCreateLabTest, 
    useUpdateLabTest 
} from '../../../hooks/laboratory/useLabTest';
import { useLabCategories } from '../../../hooks/laboratory/useLabCategory';
import type { LabTestDto } from '../../../types/types';

interface LabTestFormProps {
    isOpen: boolean;
    onClose: () => void;
    selectedTest: LabTestDto | null;
    selectedCategoryOption: any; // Used to pre-fill the form if filtering
}

const LabTestForm: React.FC<LabTestFormProps> = ({ isOpen, onClose, selectedTest, selectedCategoryOption }) => {
    const { data: categories = [] } = useLabCategories();
    const createMutation = useCreateLabTest();
    const updateMutation = useUpdateLabTest();

    const [formData, setFormData] = useState({ 
        lab_category_id: 0, 
        code: '', 
        name: '', 
        sample_type_required: '', 
        price: 0, 
        is_active: true 
    });

    const categoryOptions = useMemo(() => 
        categories.map(c => ({ value: c.id, label: c.name })), 
    [categories]);

    useEffect(() => {
        if (selectedTest) {
            setFormData({ 
                lab_category_id: selectedTest.lab_category_id, 
                code: selectedTest.code, 
                name: selectedTest.name, 
                sample_type_required: selectedTest.sample_type_required, 
                price: selectedTest.price, 
                is_active: selectedTest.is_active 
            });
        } else {
            setFormData({ 
                lab_category_id: selectedCategoryOption?.value || (categoryOptions[0]?.value || 0), 
                code: '', 
                name: '', 
                sample_type_required: '', 
                price: 0, 
                is_active: true 
            });
        }
    }, [selectedTest, isOpen, selectedCategoryOption, categoryOptions]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...formData, price: Number(formData.price) };
        
        if (selectedTest) {
            updateMutation.mutate({ id: selectedTest.id, payload }, {
                onSuccess: () => {
                    toast.success("Examen mis à jour avec succès");
                    onClose();
                },
                onError: () => toast.error("Erreur lors de la mise à jour")
            });
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => {
                    toast.success("Examen créé avec succès");
                    onClose();
                },
                onError: () => toast.error("Erreur lors de la création")
            });
        }
    };

    // React-select styles
    const selectStyles = {
        control: (base: any) => ({
            ...base,
            backgroundColor: 'transparent',
            borderColor: 'inherit'
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : 'white',
            zIndex: 9999
        }),
        singleValue: (base: any) => ({
            ...base,
            color: document.documentElement.classList.contains('dark') ? 'white' : 'black',
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isFocused 
                ? (document.documentElement.classList.contains('dark') ? '#374151' : '#f1f5f9')
                : 'transparent',
            color: document.documentElement.classList.contains('dark') ? 'white' : 'black',
        }),
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-lg my-8 transform transition-all">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                    {selectedTest ? "Modifier l'examen" : "Nouvel Examen"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">Catégorie *</label>
                        <Select 
                            required
                            options={categoryOptions}
                            value={categoryOptions.find(o => o.value === formData.lab_category_id)}
                            onChange={(option: any) => setFormData({ ...formData, lab_category_id: option?.value || 0 })}
                            styles={selectStyles}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">Code *</label>
                            <input 
                                required 
                                className="w-full border p-2 rounded bg-slate-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none" 
                                value={formData.code} 
                                onChange={e => setFormData({ ...formData, code: e.target.value })} 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">Prix (FCFA) *</label>
                            <input 
                                required 
                                type="number"
                                min="0"
                                className="w-full border p-2 rounded bg-slate-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none" 
                                value={formData.price} 
                                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">Nom de l'examen *</label>
                        <input 
                            required 
                            className="w-full border p-2 rounded bg-slate-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none" 
                            value={formData.name} 
                            onChange={e => setFormData({ ...formData, name: e.target.value })} 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">Type de prélèvement (Tube) *</label>
                        <input 
                            required 
                            placeholder="ex: Tube EDTA, Tube Sec..."
                            className="w-full border p-2 rounded bg-slate-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none" 
                            value={formData.sample_type_required} 
                            onChange={e => setFormData({ ...formData, sample_type_required: e.target.value })} 
                        />
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                        <input 
                            type="checkbox" 
                            id="is_active"
                            checked={formData.is_active} 
                            onChange={e => setFormData({ ...formData, is_active: e.target.checked })} 
                            className="w-4 h-4 text-[#00a896] rounded border-gray-300 focus:ring-[#00a896]"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-gray-300 cursor-pointer">
                            Examen actif (disponible à la prescription)
                        </label>
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

export default LabTestForm;
