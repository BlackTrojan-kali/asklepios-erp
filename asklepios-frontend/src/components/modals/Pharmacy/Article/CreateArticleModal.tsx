import React, { useState } from 'react';
import useArticleStore from '../../../../functions/pharmacy/useArticleStore';
import { ArticleForm } from './ArticleForm';
import type { ArticlePayload, ArticleCategoryDto } from '../../../../types/PharmTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    categories: ArticleCategoryDto[];
}

export const CreateArticleModal: React.FC<Props> = ({ isOpen, onClose, categories }) => {
    const { createArticle, actionLoading } = useArticleStore();
    
    const [payload, setPayload] = useState<ArticlePayload>({
        category_id: '',
        name: '',
        barcode: '',
        global_min_qty: '',
        track_batches: true, // Coché par défaut
        image: null,
        is_prescripted:false,
    });

    const handleSubmit = async () => {
        if (!payload.name || payload.category_id === '') return;
        
        const success = await createArticle(payload);
        if (success) {
            setPayload({ category_id: '', name: '', barcode: '', global_min_qty: '', track_batches: true, image: null,is_prescripted:false });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-xl p-6 shadow-xl border border-transparent dark:border-gray-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Créer un Nouvel Article</h2>
                
                <ArticleForm 
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
                        disabled={actionLoading || !payload.name || payload.category_id === ''}
                        className="px-6 py-2 bg-[#00a896] text-white rounded-md hover:bg-[#008f7e] disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Création..." : "Enregistrer l'article"}
                    </button>
                </div>
            </div>
        </div>
    );
};