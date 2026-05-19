import React, { useState } from 'react';
import useBatchStore from '../../../../functions/pharmacy/useBatchStore';
import { BatchForm } from './BatchForm';
import type { BatchPayload, ArticleDto } from '../../../../types/PharmTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    articles: ArticleDto[];
}

export const CreateBatchModal: React.FC<Props> = ({ isOpen, onClose, articles }) => {
    const { createBatch, actionLoading } = useBatchStore();
    
    const [payload, setPayload] = useState<BatchPayload>({
        article_id: '',
        batch_number: '',
        expire_date: '',
        purchase_price: ''
    });

    const handleSubmit = async () => {
        if (!payload.article_id || !payload.batch_number || !payload.expire_date || payload.purchase_price === '') return;
        
        const success = await createBatch(payload);
        if (success) {
            setPayload({ article_id: '', batch_number: '', expire_date: '', purchase_price: '' });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-lg p-6 shadow-xl border border-transparent dark:border-gray-800">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Nouveau Lot</h2>
                
                <BatchForm 
                    payload={payload} 
                    setPayload={setPayload} 
                    articles={articles}
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
                        disabled={actionLoading || !payload.article_id || !payload.batch_number || !payload.expire_date || payload.purchase_price === ''}
                        className="px-6 py-2 bg-[#00a896] text-white rounded-md hover:bg-[#008f7e] disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Création..." : "Enregistrer le lot"}
                    </button>
                </div>
            </div>
        </div>
    );
};