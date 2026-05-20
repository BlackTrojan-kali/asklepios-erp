import React, { useState, useEffect } from 'react';
import usePharmacienStore from '../../../../functions/pharmacy/usePharmacienStore';
import { PharmacienForm } from './PharmacienForm';
import type { PharmacienDto, PharmacienPayload } from '../../../../types/PharmTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    pharmacien: PharmacienDto | null;
    branches: any[]; // Remplace par ton type exact PharmacyBranchDto[]
}

export const UpdatePharmacienModal: React.FC<Props> = ({ isOpen, onClose, pharmacien, branches }) => {
    const { updatePharmacien, actionLoading } = usePharmacienStore();
    
    const [payload, setPayload] = useState<PharmacienPayload>({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        password: '',
        position: '',
        branch_id: ''
    });

    // Remplissage du formulaire avec les données de l'utilisateur existant
    useEffect(() => {
        if (pharmacien && pharmacien.user) {
            setPayload({
                first_name: pharmacien.user.first_name,
                last_name: pharmacien.user.last_name || '',
                phone: pharmacien.user.phone.toString(),
                email: pharmacien.user.email,
                password: '', // On laisse vide volontairement
                position: pharmacien.position,
                branch_id: pharmacien.branch_id
            });
        }
    }, [pharmacien]);

    const handleSubmit = async () => {
        if (!pharmacien || !payload.first_name || !payload.email || !payload.phone || !payload.position || payload.branch_id === '') {
            return;
        }

        const success = await updatePharmacien(pharmacien.id, payload);
        if (success) onClose();
    };

    if (!isOpen || !pharmacien) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl p-6 shadow-xl border border-transparent dark:border-gray-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Modifier le Pharmacien</h2>
                </div>
                
                <PharmacienForm 
                    payload={payload} 
                    setPayload={setPayload} 
                    branches={branches}
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
                        disabled={actionLoading || !payload.first_name || !payload.email || !payload.phone || !payload.position || payload.branch_id === ''}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Sauvegarde..." : "Enregistrer les modifications"}
                    </button>
                </div>
            </div>
        </div>
    );
};