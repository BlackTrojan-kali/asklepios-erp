import React, { useState } from 'react';
import { Database, Plus, Edit3, Trash2, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import { 
    useLabCategories, 
    useCreateLabCategory, 
    useUpdateLabCategory, 
    useDeleteLabCategory 
} from '../../../hooks/laboratory/useLabCategory';
import type { LabCategoryDto } from '../../../types/types';
import toast from 'react-hot-toast';

const LabCategories = () => {
    // Tanstack Hooks
    const { data: categories = [], isLoading, refetch, isFetching } = useLabCategories();
    const createMutation = useCreateLabCategory();
    const updateMutation = useUpdateLabCategory();
    const deleteMutation = useDeleteLabCategory();
    
    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<LabCategoryDto | null>(null);
    const [formData, setFormData] = useState({ name: '' });

    const handleOpenCreate = () => {
        setSelectedCategory(null);
        setFormData({ name: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (category: LabCategoryDto) => {
        setSelectedCategory(category);
        setFormData({ name: category.name });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Êtes-vous sûr ?',
            text: "Cette action est irréversible !",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, supprimer'
        });
        
        if (result.isConfirmed) {
            deleteMutation.mutate(id, {
                onSuccess: () => toast.success("Catégorie supprimée avec succès"),
                onError: () => toast.error("Erreur lors de la suppression")
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (selectedCategory) {
            updateMutation.mutate({ id: selectedCategory.id, payload: formData }, {
                onSuccess: () => {
                    toast.success("Catégorie mise à jour avec succès");
                    setIsModalOpen(false);
                },
                onError: () => toast.error("Erreur lors de la mise à jour")
            });
        } else {
            createMutation.mutate(formData, {
                onSuccess: () => {
                    toast.success("Catégorie créée avec succès");
                    setIsModalOpen(false);
                },
                onError: () => toast.error("Erreur lors de la création")
            });
        }
    };

    // Skeleton loader component
    const TableSkeleton = () => (
        <div className="animate-pulse">
            {[...Array(5)].map((_, index) => (
                <div key={index} className="flex border-t border-gray-100 dark:border-gray-700 p-4">
                    <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
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
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <Database size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Catégories d'examens</h1>
                        <p className="text-sm text-gray-500">Gérez les grandes familles (ex: Hématologie, Biochimie...)</p>
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
                        className="flex items-center gap-2 bg-[#00a896] hover:bg-[#008f7e] text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus size={18} />
                        Nouvelle Catégorie
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                {isLoading ? (
                    <TableSkeleton />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Nom de la Catégorie</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Examens liés</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map(category => (
                                    <tr key={category.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="p-4 text-gray-800 dark:text-gray-200 font-medium">
                                            {category.name}
                                        </td>
                                        <td className="p-4 text-gray-500">
                                            {category.tests?.length || 0} examen(s)
                                        </td>
                                        <td className="p-4 flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleOpenEdit(category)} 
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(category.id)} 
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                disabled={deleteMutation.isPending}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {categories.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-gray-500">Aucune catégorie trouvée</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md my-8 transform transition-all">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                            {selectedCategory ? "Modifier la catégorie" : "Nouvelle Catégorie"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">
                                    Nom de la catégorie *
                                </label>
                                <input 
                                    required 
                                    placeholder="ex: Hématologie, Biochimie..."
                                    className="w-full border p-2 rounded bg-slate-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none" 
                                    value={formData.name} 
                                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
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

export default LabCategories;
