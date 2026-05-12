import React, { useState } from 'react';
import useCenterStore from '../../../functions/center/useCenterStore';
import { CenterForm } from './CenterForm';
import type { CountryDto } from '../../../types/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    countries: CountryDto[];
}

export const CreateCenterModal: React.FC<Props> = ({ isOpen, onClose, countries }) => {
    const { createCenter, actionLoading } = useCenterStore();
    
    // État initial vide
    const [payload, setPayload] = useState({
        name: '',
        phone_1: '',
        phone_2: '',
        address: '',
        country_id: 0
    });

    const handleSubmit = async () => {
        if (!payload.name || payload.country_id === 0) {
            // Optionnel: Ajouter un toast ici pour forcer la validation frontend
            return;
        }

        const success = await createCenter(payload);
        if (success) {
            // Réinitialiser le formulaire après succès
            setPayload({ name: '', phone_1: '', phone_2: '', address: '', country_id: 0 });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-lg p-6 shadow-xl border border-transparent dark:border-gray-800">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Nouveau Centre Médical</h2>
                
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
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading || !payload.name || payload.country_id === 0}
                        className="px-6 py-2 bg-[#00a896] text-white rounded-md hover:bg-[#008f7e] disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Création..." : "Enregistrer"}
                    </button>
                </div>
            </div>
        </div>
    );
};