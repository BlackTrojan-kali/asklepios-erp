import React, { useState, useEffect } from 'react';
import useProviderStore from '../../../../functions/pharmacy/useProviderStore';
import { ProviderForm } from './ProviderForm';
import type{ ProviderPayload, ProviderDto } from '../../../../types/ProviderTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    provider: ProviderDto | null;
}

export const UpdateProviderModal: React.FC<Props> = ({ isOpen, onClose, provider }) => {
    const { updateProvider, actionLoading } = useProviderStore();
    
    const [payload, setPayload] = useState<ProviderPayload>({
        name: '',
        phone: '',
        address: '',
        niu: ''
    });

    // Remplissage du formulaire à l'ouverture avec les données du fournisseur
    useEffect(() => {
        if (provider) {
            setPayload({
                name: provider.name,
                phone: provider.phone || '',
                address: provider.address || '',
                niu: provider.niu || ''
            });
        }
    }, [provider]);

    const handleSubmit = async () => {
        if (!provider || !payload.name.trim()) return;

        const success = await updateProvider(provider.id, payload);
        if (success) onClose();
    };

    if (!isOpen || !provider) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-xl p-6 shadow-xl border border-transparent dark:border-gray-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Modifier le Fournisseur</h2>
                </div>
                
                <ProviderForm 
                    payload={payload} 
                    setPayload={setPayload} 
                    isUpdate={true}
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
                        disabled={actionLoading || !payload.name.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Sauvegarde..." : "Enregistrer les modifications"}
                    </button>
                </div>
            </div>
        </div>
    );
};