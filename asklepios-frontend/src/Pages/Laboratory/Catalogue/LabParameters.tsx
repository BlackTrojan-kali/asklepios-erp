import React, { useState, useMemo } from 'react';
import { Database, Plus, Edit3, Trash2, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import Select from 'react-select';
import { 
    useLabParameters, 
    useCreateLabParameter, 
    useUpdateLabParameter, 
    useDeleteLabParameter 
} from '../../../hooks/laboratory/useLabParameter';
import { useLabTests } from '../../../hooks/laboratory/useLabTest';
import type { LabParameterDto } from '../../../types/types';
import toast from 'react-hot-toast';

const LabParameters = () => {
    // UI State
    const [selectedTestOption, setSelectedTestOption] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedParam, setSelectedParam] = useState<LabParameterDto | null>(null);
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

    // Tanstack Hooks
    const { data: tests = [], isLoading: isLoadingTests } = useLabTests();
    const { data: parameters = [], isLoading: isLoadingParams, refetch, isFetching } = useLabParameters(selectedTestOption?.value);
    
    const createMutation = useCreateLabParameter();
    const updateMutation = useUpdateLabParameter();
    const deleteMutation = useDeleteLabParameter();
    
    const testOptions = useMemo(() => 
        tests.map(t => ({ value: t.id, label: `${t.code} - ${t.name}` })), 
    [tests]);

    const handleFilterChange = (option: any) => {
        setSelectedTestOption(option);
    };

    const handleOpenCreate = () => {
        setSelectedParam(null);
        setFormData({ 
            lab_test_id: selectedTestOption?.value || (testOptions[0]?.value || 0), 
            name: '', 
            unit: '', 
            reference_min_male: '', 
            reference_max_male: '', 
            reference_min_female: '', 
            reference_max_female: '',
            reference_text: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (param: LabParameterDto) => {
        setSelectedParam(param);
        setFormData({ 
            lab_test_id: param.lab_test_id, 
            name: param.name, 
            unit: param.unit, 
            reference_min_male: param.reference_min_male ?? '', 
            reference_max_male: param.reference_max_male ?? '', 
            reference_min_female: param.reference_min_female ?? '', 
            reference_max_female: param.reference_max_female ?? '',
            reference_text: param.reference_text ?? ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer ce paramètre ?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, supprimer'
        });
        
        if (result.isConfirmed) {
            deleteMutation.mutate(id, {
                onSuccess: () => toast.success("Paramètre supprimé avec succès"),
                onError: () => toast.error("Erreur lors de la suppression")
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const payload = {
            lab_test_id: formData.lab_test_id,
            name: formData.name,
            unit: formData.unit,
            reference_min_male: formData.reference_min_male === '' ? null : Number(formData.reference_min_male),
            reference_max_male: formData.reference_max_male === '' ? null : Number(formData.reference_max_male),
            reference_min_female: formData.reference_min_female === '' ? null : Number(formData.reference_min_female),
            reference_max_female: formData.reference_max_female === '' ? null : Number(formData.reference_max_female),
            reference_text: formData.reference_text || null
        };
        
        if (selectedParam) {
            updateMutation.mutate({ id: selectedParam.id, payload }, {
                onSuccess: () => {
                    toast.success("Paramètre mis à jour avec succès");
                    setIsModalOpen(false);
                },
                onError: () => toast.error("Erreur lors de la mise à jour")
            });
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => {
                    toast.success("Paramètre créé avec succès");
                    setIsModalOpen(false);
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
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isFocused 
                ? (document.documentElement.classList.contains('dark') ? '#374151' : '#f1f5f9')
                : 'transparent',
            color: document.documentElement.classList.contains('dark') ? 'white' : 'black',
        }),
        singleValue: (base: any) => ({
            ...base,
            color: document.documentElement.classList.contains('dark') ? 'white' : 'black',
        })
    };

    // Skeleton loader component
    const TableSkeleton = () => (
        <div className="animate-pulse">
            {[...Array(6)].map((_, index) => (
                <div key={index} className="flex border-t border-gray-100 dark:border-gray-700 p-4 items-center">
                    <div className="w-1/4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-1"></div>
                    </div>
                    <div className="w-1/5">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-16"></div>
                    </div>
                    <div className="w-1/12">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-10"></div>
                    </div>
                    <div className="w-1/12 text-center">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto"></div>
                    </div>
                    <div className="w-1/12 text-center">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto"></div>
                    </div>
                    <div className="w-1/12 text-center">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto"></div>
                    </div>
                    <div className="w-1/12 text-center">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto"></div>
                    </div>
                    <div className="flex-1 flex justify-end gap-2">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <Database size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Paramètres d'Examens</h1>
                        <p className="text-sm text-gray-500">Configurez les constantes mesurées (ex: Globules rouges, Hémoglobine...)</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg"
                    >
                        <RefreshCw size={18} className={isFetching ? "animate-spin text-gray-500" : "text-gray-500"} />
                    </button>

                    <button 
                        onClick={handleOpenCreate}
                        disabled={isLoadingTests}
                        className="flex items-center gap-2 bg-[#00a896] hover:bg-[#008f7e] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Plus size={18} />
                        Nouveau Paramètre
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="max-w-md">
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                        Filtrer par Examen
                    </label>
                    {isLoadingTests ? (
                        <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
                    ) : (
                        <Select 
                            options={testOptions}
                            value={selectedTestOption}
                            onChange={handleFilterChange}
                            placeholder="Tous les examens"
                            isClearable
                            styles={selectStyles}
                        />
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                {isLoadingParams ? (
                    <TableSkeleton />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Paramètre</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Examen</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Unité</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-center" colSpan={2}>Réf. Homme</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-center" colSpan={2}>Réf. Femme</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
                                </tr>
                                <tr className="text-xs text-gray-400 bg-gray-50/50 dark:bg-gray-900/20">
                                    <th colSpan={3}></th>
                                    <th className="p-2 text-center border-t border-gray-100 dark:border-gray-700">Min</th>
                                    <th className="p-2 text-center border-t border-gray-100 dark:border-gray-700">Max</th>
                                    <th className="p-2 text-center border-t border-gray-100 dark:border-gray-700">Min</th>
                                    <th className="p-2 text-center border-t border-gray-100 dark:border-gray-700">Max</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {parameters.map(param => (
                                    <tr key={param.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="p-4 text-gray-800 dark:text-gray-200 font-medium">{param.name}</td>
                                        <td className="p-4 text-gray-500">{param.test?.code} - {param.test?.name}</td>
                                        <td className="p-4 text-gray-500 font-mono text-sm">{param.unit}</td>
                                        <td className="p-4 text-center text-gray-600 dark:text-gray-300">{param.reference_min_male ?? '-'}</td>
                                        <td className="p-4 text-center text-gray-600 dark:text-gray-300">{param.reference_max_male ?? '-'}</td>
                                        <td className="p-4 text-center text-gray-600 dark:text-gray-300">{param.reference_min_female ?? '-'}</td>
                                        <td className="p-4 text-center text-gray-600 dark:text-gray-300">{param.reference_max_female ?? '-'}</td>
                                        <td className="p-4 flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleOpenEdit(param)} 
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(param.id)} 
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                disabled={deleteMutation.isPending}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {parameters.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-gray-500">Aucun paramètre trouvé</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-2xl my-8 transform transition-all">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                            {selectedParam ? "Modifier le paramètre" : "Nouveau Paramètre"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">Examen lié *</label>
                                    <Select 
                                        required
                                        options={testOptions}
                                        value={testOptions.find(o => o.value === formData.lab_test_id)}
                                        onChange={(option: any) => setFormData({ ...formData, lab_test_id: option?.value || 0 })}
                                        styles={selectStyles}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">Unité *</label>
                                    <input 
                                        required 
                                        placeholder="ex: g/dL, mg/L..."
                                        className="w-full border p-2 rounded bg-slate-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none" 
                                        value={formData.unit} 
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })} 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">Nom du paramètre *</label>
                                <input 
                                    required 
                                    placeholder="ex: Leucocytes, Hémoglobine..."
                                    className="w-full border p-2 rounded bg-slate-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none" 
                                    value={formData.name} 
                                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                />
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-slate-50 dark:bg-gray-900/50">
                                <h3 className="font-semibold text-sm text-slate-800 dark:text-white mb-4">Valeurs de Référence (Numériques)</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Homme */}
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-gray-500 uppercase">Homme</p>
                                        <div className="flex gap-2">
                                            <div>
                                                <label className="block text-xs mb-1">Min</label>
                                                <input 
                                                    type="number" step="any"
                                                    className="w-full border p-2 rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none" 
                                                    value={formData.reference_min_male} 
                                                    onChange={e => setFormData({ ...formData, reference_min_male: e.target.value })} 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs mb-1">Max</label>
                                                <input 
                                                    type="number" step="any"
                                                    className="w-full border p-2 rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none" 
                                                    value={formData.reference_max_male} 
                                                    onChange={e => setFormData({ ...formData, reference_max_male: e.target.value })} 
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
                                                    type="number" step="any"
                                                    className="w-full border p-2 rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none" 
                                                    value={formData.reference_min_female} 
                                                    onChange={e => setFormData({ ...formData, reference_min_female: e.target.value })} 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs mb-1">Max</label>
                                                <input 
                                                    type="number" step="any"
                                                    className="w-full border p-2 rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none" 
                                                    value={formData.reference_max_female} 
                                                    onChange={e => setFormData({ ...formData, reference_max_female: e.target.value })} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">Texte de référence (Optionnel)</label>
                                <input 
                                    placeholder="ex: Négatif, Présent, < 0.5..."
                                    className="w-full border p-2 rounded bg-slate-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none" 
                                    value={formData.reference_text} 
                                    onChange={e => setFormData({ ...formData, reference_text: e.target.value })} 
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)} 
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
            )}
        </div>
    );
};

export default LabParameters;
