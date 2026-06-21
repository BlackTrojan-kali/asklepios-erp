import React, { useState, useEffect } from 'react';
import useArticleStore from '../../../../functions/pharmacy/useArticleStore';
import { ArticleForm } from './ArticleForm';
import type { ArticleDto, ArticlePayload, ArticleCategoryDto } from '../../../../types/PharmTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    article: ArticleDto | null;
    categories: ArticleCategoryDto[];
}

export const UpdateArticleModal: React.FC<Props> = ({ isOpen, onClose, article, categories }) => {
    const { updateArticle, actionLoading } = useArticleStore();
    
    const [payload, setPayload] = useState<ArticlePayload>({
        category_id: '',
        name: '',
        barcode: '',
        global_min_qty: '',
        track_batches: true,
        image: null ,
        is_prescripted:false,
    });

    useEffect(() => {
        if (article) {
            setPayload({
                category_id: article.category_id,
                name: article.name,
                barcode: article.barcode || '',
                global_min_qty: article.global_min_qty || '',
                track_batches: article.track_batches, // On récupère la vraie valeur
                image: null,
                is_prescripted:article.is_prescripted || false,
            });
        }
    }, [article]);

    const handleSubmit = async () => {
        if (!article || !payload.name || payload.category_id === '') return;
        const success = await updateArticle(article.id, payload);
        if (success) onClose();
    };

    if (!isOpen || !article) return null;

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const existingImageUrl = article.image_url ? `${baseUrl}${article.image_url}` : null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-xl p-6 shadow-xl border border-transparent dark:border-gray-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Modifier l'Article</h2>
                </div>
                
                <ArticleForm 
                    payload={payload} 
                    setPayload={setPayload} 
                    categories={categories}
                    existingImageUrl={existingImageUrl}
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
                        disabled={actionLoading || !payload.name || payload.category_id === ''}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Sauvegarde..." : "Enregistrer les modifications"}
                    </button>
                </div>
            </div>
        </div>
    );
};