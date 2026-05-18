import React, { useState } from 'react';
import useArticleCategoryStore from '../../../../functions/pharmacy/useArticleCategoryStore';
import { ArticleCategoryForm } from './ArticleCategoryForm';
import type { ArticleCategoryPayload, ArticleCategoryDto } from '../../../../types/PharmTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    categories: ArticleCategoryDto[]; // La liste de toutes les catégories pour le menu déroulant
}

export const CreateArticleCategoryModal: React.FC<Props> = ({ isOpen, onClose, categories }) => {
    const { createArticleCategory, actionLoading } = useArticleCategoryStore();
    
    const [payload, setPayload] = useState<ArticleCategoryPayload>({
        name: '',
        description: '',
        article_category_id: null
    });

    const handleSubmit = async () => {
        if (!payload.name) return;
        
        const success = await createArticleCategory(payload);
        if (success) {
            setPayload({ name: '', description: '', article_category_id: null });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-lg p-6 shadow-xl border border-transparent dark:border-gray-800">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Nouvelle Catégorie</h2>
                
                <ArticleCategoryForm 
                    payload={payload} 
                    setPayload={setPayload} 
                    categories={categories}
                />
                
                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading || !payload.name}
                        className="px-6 py-2 bg-[#00a896] text-white rounded-md hover:bg-[#008f7e] disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Création..." : "Enregistrer"}
                    </button>
                </div>
            </div>
        </div>
    );
};