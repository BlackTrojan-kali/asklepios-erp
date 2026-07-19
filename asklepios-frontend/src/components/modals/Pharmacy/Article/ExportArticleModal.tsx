import React, { useState } from 'react';
import { X, FileText, Download, Loader2 } from 'lucide-react';
import Select from 'react-select';
import type { ArticleCategoryDto } from '../../../../types/PharmTypes';
import useArticleStore from '../../../../functions/pharmacy/useArticleStore';

interface ExportArticleModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: ArticleCategoryDto[];
}

export const ExportArticleModal: React.FC<ExportArticleModalProps> = ({ isOpen, onClose, categories }) => {
    const { exportArticlesPdf, actionLoading } = useArticleStore();

    // États locaux
    const [categoryId, setCategoryId] = useState<string>('');
    const [trackBatches, setTrackBatches] = useState<string>('');
    const [isPrescripted, setIsPrescripted] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const filters: Record<string, string | number> = {};
        if (categoryId !== '') filters.category_id = categoryId;
        if (trackBatches !== '') filters.track_batches = trackBatches;
        if (isPrescripted !== '') filters.is_prescripted = isPrescripted;

        const success = await exportArticlesPdf(filters);
        
        if (success) {
            setCategoryId('');
            setTrackBatches('');
            setIsPrescripted('');
            onClose();
        }
    };

    // --- Options pour React-Select ---
    const categoryOptions = [
        { value: '', label: '-- Toutes les catégories --' },
        ...categories.map(cat => ({
            value: cat.id.toString(),
            label: cat.parentCategory ? `${cat.parentCategory.name} > ${cat.name}` : cat.name
        }))
    ];

    const trackBatchesOptions = [
        { value: '', label: '-- Tous les types --' },
        { value: 'true', label: 'Articles avec suivi de lots' },
        { value: 'false', label: 'Matériel générique (sans lots)' }
    ];

    const isPrescriptedOptions = [
        { value: '', label: '-- Indifférent --' },
        { value: 'true', label: 'Soumis à ordonnance obligatoire' },
        { value: 'false', label: 'En vente libre' }
    ];

    // Styles communs pour React-Select
    const selectStyles = {
        control: (base: any, state: any) => ({
            ...base,
            backgroundColor: '#ffffff',
            borderColor: state.isFocused ? '#00a896' : '#e5e7eb',
            boxShadow: state.isFocused ? '0 0 0 1px #00a896' : 'none',
            minHeight: '42px',
            borderRadius: '0.5rem',
            cursor: 'pointer'
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            zIndex: 9999, // Super important dans une modale
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected ? '#e6f6f4' : state.isFocused ? '#f3f4f6' : '#ffffff',
            color: state.isSelected ? '#00a896' : '#000000', 
            cursor: 'pointer',
        }),
        singleValue: (base: any) => ({ ...base, color: '#000000' }),
        input: (base: any) => ({ ...base, color: '#000000' }),
        placeholder: (base: any) => ({ ...base, color: '#6b7280' }),
        indicatorSeparator: (base: any) => ({ ...base, backgroundColor: '#e5e7eb' }),
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-visible flex flex-col max-h-[90vh]">
                
                {/* EN-TÊTE */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
                            <FileText size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                            Exporter le Catalogue
                        </h2>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={actionLoading}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* CORPS DU FORMULAIRE */}
                <form onSubmit={handleSubmit} className="flex flex-col p-6 gap-5 overflow-visible">
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Sélectionnez les critères des articles que vous souhaitez inclure dans le rapport PDF. Laissez vide pour tout exporter.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Catégorie</label>
                            <Select 
                                options={categoryOptions}
                                value={categoryOptions.find(opt => opt.value === categoryId) || categoryOptions[0]}
                                onChange={(selected) => setCategoryId(selected ? selected.value : '')}
                                styles={selectStyles}
                                isSearchable
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Type de suivi</label>
                            <Select 
                                options={trackBatchesOptions}
                                value={trackBatchesOptions.find(opt => opt.value === trackBatches) || trackBatchesOptions[0]}
                                onChange={(selected) => setTrackBatches(selected ? selected.value : '')}
                                styles={selectStyles}
                                isSearchable={false}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Prescription médicale</label>
                            <Select 
                                options={isPrescriptedOptions}
                                value={isPrescriptedOptions.find(opt => opt.value === isPrescripted) || isPrescriptedOptions[0]}
                                onChange={(selected) => setIsPrescripted(selected ? selected.value : '')}
                                styles={selectStyles}
                                isSearchable={false}
                            />
                        </div>
                    </div>

                    {/* PIED DE MODALE */}
                    <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={actionLoading}
                            className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={actionLoading}
                            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Génération...
                                </>
                            ) : (
                                <>
                                    <Download size={18} />
                                    Télécharger PDF
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};