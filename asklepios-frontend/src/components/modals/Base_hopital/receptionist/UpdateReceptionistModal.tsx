import React, { useState, useEffect } from 'react';
import useReceptionistStore from '../../../../functions/receptionist/useReceptionistStore';
import { ReceptionistForm } from './ReceptionistForm';

import type { CenterDto } from '../../../../types/types';
import type { ReceptionistPayload, ReceptionistDto } from '../../../../types/ReceptionistTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    receptionist: ReceptionistDto | null;
    centers: CenterDto[]; 
}

export const UpdateReceptionistModal: React.FC<Props> = ({ isOpen, onClose, receptionist, centers }) => {
    const { updateReceptionist, actionLoading } = useReceptionistStore();
    
    const [payload, setPayload] = useState<ReceptionistPayload>({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        password: '', // Toujours vide au montage (mesure de sécurité)
        center_id: '',
        desk_name: ''
    });

    // Remplissage du formulaire avec les données de l'API
    useEffect(() => {
        if (receptionist && receptionist.user) {
            setPayload({
                first_name: receptionist.user.first_name,
                last_name: receptionist.user.last_name || '',
                phone: receptionist.user.phone,
                email: receptionist.user.email,
                password: '', // On ne pré-remplit pas le mot de passe
                center_id: receptionist.center_id,
                desk_name: receptionist.desk_name
            });
        }
    }, [receptionist]);

    // Note : Le mot de passe n'est pas obligatoire pour une mise à jour
    const isFormValid = payload.first_name && payload.phone && payload.email && payload.center_id !== '' && payload.desk_name;

    const handleSubmit = async () => {
        if (!receptionist || !isFormValid) return;

        const success = await updateReceptionist(receptionist.id, payload);
        if (success) onClose();
    };

    if (!isOpen || !receptionist) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-xl p-6 shadow-xl border border-transparent dark:border-gray-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Modifier le profil</h2>
                </div>
                
                <ReceptionistForm 
                    payload={payload} 
                    setPayload={setPayload} 
                    centers={centers}
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
                        disabled={actionLoading || !isFormValid}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {actionLoading ? "Sauvegarde..." : "Enregistrer les modifications"}
                    </button>
                </div>
            </div>
        </div>
    );
};