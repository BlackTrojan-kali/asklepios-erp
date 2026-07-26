import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { 
    useCreateLabCategory, 
    useUpdateLabCategory 
} from '../../../hooks/laboratory/useLabCategory';
import type { LabCategoryDto } from '../../../types/types';
import { Button } from '../../common/Button';

interface LabCategoryFormProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCategory: LabCategoryDto | null;
}

const LabCategoryForm: React.FC<LabCategoryFormProps> = ({ isOpen, onClose, selectedCategory }) => {
    const { profile } = useAuth();
    const hospitalId = profile?.profile_admin?.hospital_id || profile?.hospital_id;

    const createMutation = useCreateLabCategory();
    const updateMutation = useUpdateLabCategory();

    const [formData, setFormData] = useState({ name: '' });

    useEffect(() => {
        if (selectedCategory) {
            setFormData({ name: selectedCategory.name });
        } else {
            setFormData({ name: '' });
        }
    }, [selectedCategory, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (selectedCategory) {
            updateMutation.mutate({ id: selectedCategory.id, payload: formData }, {
                onSuccess: () => {
                    toast.success("Catégorie mise à jour avec succès");
                    onClose();
                },
                onError: () => toast.error("Erreur lors de la mise à jour")
            });
        } else {
            createMutation.mutate({ ...formData, hospital_id: hospitalId }, {
                onSuccess: () => {
                    toast.success("Catégorie créée avec succès");
                    onClose();
                },
                onError: () => toast.error("Erreur lors de la création")
            });
        }
    };

    if (!isOpen) return null;

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
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
                        <Button 
                            type="button" 
                            variant="outline"
                            onClick={onClose} 
                            disabled={isPending}
                            tooltip="Fermer sans enregistrer"
                            tooltipPosition="top"
                        >
                            Annuler
                        </Button>
                        <Button 
                            type="submit" 
                            variant="primary"
                            isLoading={isPending}
                            tooltip="Enregistrer la catégorie d'examen"
                            tooltipPosition="top"
                        >
                            Enregistrer
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LabCategoryForm;
