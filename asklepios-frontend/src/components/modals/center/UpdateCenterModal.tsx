import React, { useState, useEffect } from 'react';
import useCenterStore from '../../../functions/center/useCenterStore';
import { CenterForm } from './CenterForm';
import type { CenterDto, CountryDto } from '../../../types/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    center: CenterDto | null;
    countries: CountryDto[];
}

export const UpdateCenterModal: React.FC<Props> = ({ isOpen, onClose, center, countries }) => {
    const { updateCenter, actionLoading } = useCenterStore();
    
    const [payload, setPayload] = useState({
        name: '',
        phone_1: '',
        phone_2: '',
        address: '',
        country_id: 0
    });

    // Remplissage du formulaire avec les données du centre sélectionné
    useEffect(() => {
        if (center) {
            setPayload({
                name: center.name,
                phone_1: center.phone_1 || '',
                phone_2: center.phone_2 || '',
                address: center.address || '',
                country_id: center.country_id
            });
        }
    }, [center]);

    const handleSubmit = async () => {
        if (!center || !payload.name || payload.country_id === 0) return;

        const success = await updateCenter(center.id, payload);
        if (success) onClose();
    };

    if (!isOpen || !center) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-lg p-6 shadow-xl border border-transparent dark:border-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Modifier le Centre</h2>
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded font-medium">
                        ID: {center.id}
                    </span>
                </div>
                
                <CenterForm 
                    payload={payload} 
                    setPayload={setPayload}
                    countries={countries}
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
                        disabled={actionLoading || !payload.name || payload.country_id === 0}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Sauvegarde..." : "Enregistrer les modifications"}
                    </button>
                </div>
            </div>
        </div>
    );
};