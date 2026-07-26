import React, { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { 
    useCreateLaboratory, 
    useUpdateLaboratory 
} from '../../../hooks/laboratory/useLaboratory';
import { useCenters } from '../../../hooks/admin/useCenter';
import { useAllCountries } from '../../../hooks/admin/useCountry';
import { useAuth } from '../../../contexts/AuthContext';
import type { LaboratoryDto } from '../../../types/types';

interface LaboratoryFormProps {
    isOpen: boolean;
    onClose: () => void;
    selectedLaboratory: LaboratoryDto | null;
}

const LaboratoryForm: React.FC<LaboratoryFormProps> = ({ isOpen, onClose, selectedLaboratory }) => {
    const { profile } = useAuth();
    const hospitalId = profile?.profile_admin?.hospital_id || profile?.hospital_id;

    const createMutation = useCreateLaboratory();
    const updateMutation = useUpdateLaboratory();
    
    // Fetch centers (we request a large per_page to act as a list)
    const { data: centersPaginated, isLoading: loadingCenters } = useCenters(
        isOpen && hospitalId ? { page: 1, per_page: 100 } : undefined
    );
    const centers = centersPaginated?.data || [];

    // Fetch countries
    const { data: countries, isLoading: loadingCountries } = useAllCountries();

    const [formData, setFormData] = useState({ 
        name: '', 
        center_id: null as number | null,
        country_id: null as number | null,
        address: ''
    });

    const centerOptions = useMemo(() => 
        centers.map(c => ({ value: c.id, label: c.name })), 
    [centers]);

    const countryOptions = useMemo(() => 
        (countries || []).map((c: any) => ({ value: c.id, label: c.name })), 
    [countries]);

    useEffect(() => {
        if (selectedLaboratory) {
            setFormData({ 
                name: selectedLaboratory.name || '', 
                center_id: selectedLaboratory.center_id || null,
                country_id: selectedLaboratory.country_id || null,
                address: selectedLaboratory.address || ''
            });
        } else {
            setFormData({ 
                name: '', 
                center_id: null,
                country_id: null,
                address: ''
            });
        }
    }, [selectedLaboratory, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!hospitalId) {
            toast.error("Impossible de déterminer l'hôpital de rattachement.");
            return;
        }

        const payload = {
            name: formData.name,
            hospital_id: hospitalId,
            center_id: formData.center_id,
            country_id: formData.country_id,
            address: formData.address
        };

        if (selectedLaboratory) {
            updateMutation.mutate({ id: selectedLaboratory.id, payload }, {
                onSuccess: () => {
                    toast.success("Laboratoire mis à jour avec succès");
                    onClose();
                },
                onError: () => toast.error("Erreur lors de la mise à jour")
            });
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => {
                    toast.success("Laboratoire créé avec succès");
                    onClose();
                },
                onError: () => toast.error("Erreur lors de la création")
            });
        }
    };

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

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md my-8 transform transition-all">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                    {selectedLaboratory ? "Modifier le laboratoire" : "Nouveau Laboratoire"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">
                            Nom du laboratoire *
                        </label>
                        <input
                            required
                            placeholder="ex: Laboratoire Central Asklepios"
                            className="w-full border p-2 rounded bg-slate-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">
                            Pays (Optionnel)
                        </label>
                        <Select 
                            options={countryOptions}
                            value={countryOptions.find((o: any) => o.value === formData.country_id) || null}
                            onChange={(option: any) => setFormData({ ...formData, country_id: option?.value || null })}
                            styles={selectStyles}
                            isClearable
                            isLoading={loadingCountries}
                            placeholder="Sélectionner un pays..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">
                            Adresse (Optionnelle)
                        </label>
                        <input
                            placeholder="ex: 123 Rue de la Santé"
                            className="w-full border p-2 rounded bg-slate-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    {hospitalId && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">
                                Centre rattaché (Optionnel)
                            </label>
                            <Select 
                                options={centerOptions}
                                value={centerOptions.find(o => o.value === formData.center_id) || null}
                                onChange={(option: any) => setFormData({ ...formData, center_id: option?.value || null })}
                                styles={selectStyles}
                                isClearable
                                isLoading={loadingCenters}
                                placeholder="Sélectionner un centre..."
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded text-slate-700 dark:text-gray-300 transition-colors"
                            disabled={isLoading}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#00a896] hover:bg-[#008f7e] text-white rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                            disabled={isLoading}
                        >
                            {isLoading && (
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

export default LaboratoryForm;
