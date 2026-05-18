import React, { useState, useEffect } from 'react';
import useArticleCategoryStore from '../../../../functions/pharmacy/useArticleCategoryStore';
import { ArticleCategoryForm } from './ArticleCategoryForm';
import type { ArticleCategoryDto, ArticleCategoryPayload } from '../../../../types/PharmTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    category: ArticleCategoryDto | null;
    categories: ArticleCategoryDto[];
}

export const UpdateArticleCategoryModal: React.FC<Props> = ({ isOpen, onClose, category, categories }) => {
    const { updateArticleCategory, actionLoading } = useArticleCategoryStore();
    
    const [payload, setPayload] = useState<ArticleCategoryPayload>({
        name: '',
        description: '',
        article_category_id: null
    });

    // Remplissage du formulaire avec les données de la catégorie à éditer
    useEffect(() => {
        if (category) {
            setPayload({
                name: category.name,
                description: category.description || '',
                article_category_id: category.article_category_id
            });
        }
    }, [category]);

    const handleSubmit = async () => {
        if (!category || !payload.name) return;

        const success = await updateArticleCategory(category.id, payload);
        if (success) onClose();
    };

    if (!isOpen || !category) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-lg p-6 shadow-xl border border-transparent dark:border-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Modifier la Catégorie</h2>
                </div>
                
                <ArticleCategoryForm 
                    payload={payload} 
                    setPayload={setPayload} 
                    categories={categories}
                    currentCategoryId={category.id} // Important : on passe l'ID actuel pour l'exclure des parents
                />

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    >
                        Fermer
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading || !payload.name}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Sauvegarde..." : "Enregistrer les modifications"}
                    </button>
                </div>
            </div>
        </div>
    );
};