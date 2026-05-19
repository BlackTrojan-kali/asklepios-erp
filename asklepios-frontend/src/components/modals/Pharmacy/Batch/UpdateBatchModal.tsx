import React, { useState, useEffect } from 'react';
import useBatchStore from '../../../../functions/pharmacy/useBatchStore';
import { BatchForm } from './BatchForm';
import type { BatchDto, BatchPayload, ArticleDto } from '../../../../types/PharmTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    batch: BatchDto | null;
    articles: ArticleDto[];
}

export const UpdateBatchModal: React.FC<Props> = ({ isOpen, onClose, batch, articles }) => {
    const { updateBatch, actionLoading } = useBatchStore();
    
    const [payload, setPayload] = useState<BatchPayload>({
        article_id: '',
        batch_number: '',
        expire_date: '',
        purchase_price: ''
    });

    // Remplissage du formulaire avec les données existantes
    useEffect(() => {
        if (batch) {
            setPayload({
                article_id: batch.article_id,
                batch_number: batch.batch_number,
                // On s'assure que la date est bien au format YYYY-MM-DD pour l'input type="date"
                expire_date: batch.expire_date ? batch.expire_date.split('T')[0] : '',
                purchase_price: batch.purchase_price
            });
        }
    }, [batch]);

    const handleSubmit = async () => {
        if (!batch || !payload.article_id || !payload.batch_number || !payload.expire_date || payload.purchase_price === '') return;

        const success = await updateBatch(batch.id, payload);
        if (success) onClose();
    };

    if (!isOpen || !batch) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-lg p-6 shadow-xl border border-transparent dark:border-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Modifier le Lot</h2>
                </div>
                
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
                        Fermer
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading || !payload.article_id || !payload.batch_number || !payload.expire_date || payload.purchase_price === ''}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Sauvegarde..." : "Enregistrer"}
                    </button>
                </div>
            </div>
        </div>
    );
};