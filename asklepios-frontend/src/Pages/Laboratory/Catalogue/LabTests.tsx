import React, { useState, useMemo } from 'react';
import { TestTubes, Plus, Edit3, Trash2, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import Select from 'react-select';
import { 
    useLabTests, 
    useCreateLabTest, 
    useUpdateLabTest, 
    useDeleteLabTest 
} from '../../../hooks/laboratory/useLabTest';
import { useLabCategories } from '../../../hooks/laboratory/useLabCategory';
import type { LabTestDto } from '../../../types/types';
import toast from 'react-hot-toast';

const LabTests = () => {
    // UI State
    const [selectedCategoryOption, setSelectedCategoryOption] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTest, setSelectedTest] = useState<LabTestDto | null>(null);
    const [formData, setFormData] = useState({ 
        lab_category_id: 0, 
        code: '', 
        name: '', 
        sample_type_required: '', 
        price: 0, 
        is_active: true 
    });

    // Tanstack Hooks
    const { data: categories = [], isLoading: isLoadingCategories } = useLabCategories();
    const { data: tests = [], isLoading: isLoadingTests, refetch, isFetching } = useLabTests(selectedCategoryOption?.value);
    
    const createMutation = useCreateLabTest();
    const updateMutation = useUpdateLabTest();
    const deleteMutation = useDeleteLabTest();
    
    const categoryOptions = useMemo(() => 
        categories.map(c => ({ value: c.id, label: c.name })), 
    [categories]);

    // Handle filter
    const handleFilterChange = (option: any) => {
        setSelectedCategoryOption(option);
    };

    const handleOpenCreate = () => {
        setSelectedTest(null);
        setFormData({ 
            lab_category_id: selectedCategoryOption?.value || (categoryOptions[0]?.value || 0), 
            code: '', 
            name: '', 
            sample_type_required: '', 
            price: 0, 
            is_active: true 
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (test: LabTestDto) => {
        setSelectedTest(test);
        setFormData({ 
            lab_category_id: test.lab_category_id, 
            code: test.code, 
            name: test.name, 
            sample_type_required: test.sample_type_required, 
            price: test.price, 
            is_active: test.is_active 
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer cet examen ?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, supprimer'
        });
        
        if (result.isConfirmed) {
            deleteMutation.mutate(id, {
                onSuccess: () => toast.success("Examen supprimé avec succès"),
                onError: () => toast.error("Erreur lors de la suppression")
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...formData, price: Number(formData.price) };
        
        if (selectedTest) {
            updateMutation.mutate({ id: selectedTest.id, payload }, {
                onSuccess: () => {
                    toast.success("Examen mis à jour avec succès");
                    setIsModalOpen(false);
                },
                onError: () => toast.error("Erreur lors de la mise à jour")
            });
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => {
                    toast.success("Examen créé avec succès");
                    setIsModalOpen(false);
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
                    <div className="w-1/6">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
                    </div>
                    <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-1"></div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4"></div>
                    </div>
                    <div className="w-1/6">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                    <div className="w-1/6">
                        <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </div>
                    <div className="flex gap-2">
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
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <TestTubes size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Examens</h1>
                        <p className="text-sm text-gray-500">Gérez les examens (ex: NFS, Glycémie...)</p>
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
                        disabled={isLoadingCategories}
                        className="flex items-center gap-2 bg-[#00a896] hover:bg-[#008f7e] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Plus size={18} />
                        Nouvel Examen
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="max-w-md">
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                        Filtrer par catégorie
                    </label>
                    {isLoadingCategories ? (
                        <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
                    ) : (
                        <Select 
                            options={categoryOptions}
                            value={selectedCategoryOption}
                            onChange={handleFilterChange}
                            placeholder="Toutes les catégories"
                            isClearable
                            styles={selectStyles}
                        />
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                {isLoadingTests ? (
                    <TableSkeleton />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Code</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Nom</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Catégorie</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Type de tube</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Prix</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Statut</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tests.map(test => (
                                    <tr key={test.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="p-4 text-gray-800 dark:text-gray-200 font-mono text-sm">{test.code}</td>
                                        <td className="p-4 text-gray-800 dark:text-gray-200 font-medium">{test.name}</td>
                                        <td className="p-4 text-gray-500">{test.category?.name}</td>
                                        <td className="p-4 text-gray-500">{test.sample_type_required}</td>
                                        <td className="p-4 text-gray-800 dark:text-gray-200 font-medium">{test.price.toLocaleString()} FCFA</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${test.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {test.is_active ? 'Actif' : 'Inactif'}
                                            </span>
                                        </td>
                                        <td className="p-4 flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleOpenEdit(test)} 
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(test.id)} 
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                disabled={deleteMutation.isPending}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {tests.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500">Aucun examen trouvé</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
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

export default LabTests;
