import React, { useState, useEffect } from 'react';
import useStorageLocationStore from '../../../../functions/pharmacy/useStorageLocationStore';
import { StorageLocationForm } from './StorageLocationForm';
import type { StorageLocationDto, StorageLocationPayload } from '../../../../types/PharmMagTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    location: StorageLocationDto | null;
}

export const UpdateLocationModal: React.FC<Props> = ({ isOpen, onClose, location }) => {
    const { updateLocation, actionLoading } = useStorageLocationStore();
    
    const [payload, setPayload] = useState<StorageLocationPayload>({ aisle: '', shelf: '', code: '' });

    useEffect(() => {
        if (location) {
            setPayload({
                aisle: location.aisle || '',
                shelf: location.shelf || '',
                code: location.code || ''
            });
        }
    }, [location]);

    const handleSubmit = async () => {
        if (!location || (!payload.aisle.trim() && !payload.shelf.trim() && !payload.code.trim())) return;

        const success = await updateLocation(location.id, payload);
        if (success) onClose();
    };

    if (!isOpen || !location) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-lg p-6 shadow-xl border border-transparent dark:border-gray-800">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Modifier l'Emplacement</h2>
                
                <StorageLocationForm payload={payload} setPayload={setPayload} />

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    >
                        Fermer
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading || (!payload.aisle.trim() && !payload.shelf.trim() && !payload.code.trim())}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Sauvegarde..." : "Enregistrer"}
                    </button>
                </div>
            </div>
        </div>
    );
};