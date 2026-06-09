import React, { useState } from 'react';
import useProviderStore from '../../../../functions/pharmacy/useProviderStore';
import { ProviderForm } from './ProviderForm';
import type { ProviderPayload } from '../../../../types/ProviderTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateProviderModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { createProvider, actionLoading } = useProviderStore();
    
    const initialPayload: ProviderPayload = {
        name: '',
        phone: '',
        address: '',
        niu: ''
    };

    const [payload, setPayload] = useState<ProviderPayload>(initialPayload);

    const handleSubmit = async () => {
        if (!payload.name.trim()) return; // Seul le nom est strictement requis
        
        const success = await createProvider(payload);
        if (success) {
            setPayload(initialPayload); // Reset du formulaire
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-xl p-6 shadow-xl border border-transparent dark:border-gray-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Nouveau Fournisseur</h2>
                
                <ProviderForm 
                    payload={payload} 
                    setPayload={setPayload} 
                    isUpdate={false}
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
                        disabled={actionLoading || !payload.name.trim()}
                        className="px-6 py-2 bg-[#00a896] text-white rounded-md hover:bg-[#008f7e] disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Création..." : "Enregistrer"}
                    </button>
                </div>
            </div>
        </div>
    );
};