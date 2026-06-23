import React, { useState } from 'react';
import useReceptionistStore from '../../../../functions/receptionist/useReceptionistStore'; // Ajuste le chemin
import { ReceptionistForm } from './ReceptionistForm';
import type { ReceptionistPayload } from '../../../../types/ReceptionistTypes';
import type { CenterDto } from '../../../../types/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    centers: CenterDto[]; 
}

export const CreateReceptionistModal: React.FC<Props> = ({ isOpen, onClose, centers }) => {
    const { createReceptionist, actionLoading } = useReceptionistStore();
    
    const [payload, setPayload] = useState<ReceptionistPayload>({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        password: '',
        center_id: '',
        desk_name: ''
    });

    const isFormValid = payload.first_name && payload.phone && payload.email && payload.password && payload.center_id !== '' && payload.desk_name;

    const handleSubmit = async () => {
        if (!isFormValid) return;
        
        const success = await createReceptionist(payload);
        if (success) {
            // Réinitialiser le formulaire
            setPayload({ first_name: '', last_name: '', phone: '', email: '', password: '', center_id: '', desk_name: '' });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-xl p-6 shadow-xl border border-transparent dark:border-gray-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <h2 className="text-xl font-bold mb-5 text-slate-800 dark:text-white">Nouveau Réceptionniste</h2>
                
                <ReceptionistForm 
                    payload={payload} 
                    setPayload={setPayload} 
                    centers={centers}
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
                        disabled={actionLoading || !isFormValid}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {actionLoading ? "Création..." : "Enregistrer"}
                    </button>
                </div>
            </div>
        </div>
    );
};