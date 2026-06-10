import React, { useState } from 'react';
import useStorageLocationStore from '../../../../functions/pharmacy/useStorageLocationStore';
import { StorageLocationForm } from './StorageLocationForm';
import type { StorageLocationPayload } from '../../../../types/PharmMagTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateLocationModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { createLocation, actionLoading } = useStorageLocationStore();
    
    const initialPayload: StorageLocationPayload = { aisle: '', shelf: '', code: '' };
    const [payload, setPayload] = useState<StorageLocationPayload>(initialPayload);

    const handleSubmit = async () => {
        // Au moins un des champs doit être rempli pour que l'emplacement ait un sens
        if (!payload.aisle.trim() && !payload.shelf.trim() && !payload.code.trim()) return;
        
        const success = await createLocation(payload);
        if (success) {
            setPayload(initialPayload);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-lg p-6 shadow-xl border border-transparent dark:border-gray-800">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Nouvelle Zone de Rangement</h2>
                
                <StorageLocationForm payload={payload} setPayload={setPayload} />
                
                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading || (!payload.aisle.trim() && !payload.shelf.trim() && !payload.code.trim())}
                        className="px-6 py-2 bg-[#00a896] text-white rounded-md hover:bg-[#008f7e] disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Création..." : "Enregistrer"}
                    </button>
                </div>
            </div>
        </div>
    );
};