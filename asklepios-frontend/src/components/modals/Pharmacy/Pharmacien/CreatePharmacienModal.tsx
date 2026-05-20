import React, { useState } from 'react';
import usePharmacienStore from '../../../../functions/pharmacy/usePharmacienStore';
import { PharmacienForm } from './PharmacienForm';
import type { PharmacienPayload } from '../../../../types/PharmTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    branches: any[]; // Remplace par ton type exact PharmacyBranchDto[]
}

export const CreatePharmacienModal: React.FC<Props> = ({ isOpen, onClose, branches }) => {
    const { createPharmacien, actionLoading } = usePharmacienStore();
    
    const initialPayload: PharmacienPayload = {
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        password: '',
        position: '',
        branch_id: ''
    };

    const [payload, setPayload] = useState<PharmacienPayload>(initialPayload);

    const handleSubmit = async () => {
        if (!payload.first_name || !payload.email || !payload.phone || !payload.password || !payload.position || payload.branch_id === '') {
            return;
        }
        
        const success = await createPharmacien(payload);
        if (success) {
            setPayload(initialPayload); // Reset du formulaire
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl p-6 shadow-xl border border-transparent dark:border-gray-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Nouveau Pharmacien</h2>
                
                <PharmacienForm 
                    payload={payload} 
                    setPayload={setPayload} 
                    branches={branches}
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
                        disabled={actionLoading || !payload.first_name || !payload.email || !payload.phone || !payload.password || !payload.position || payload.branch_id === ''}
                        className="px-6 py-2 bg-[#00a896] text-white rounded-md hover:bg-[#008f7e] disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Création..." : "Enregistrer le compte"}
                    </button>
                </div>
            </div>
        </div>
    );
};