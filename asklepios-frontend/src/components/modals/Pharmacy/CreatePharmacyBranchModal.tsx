import React, { useState } from 'react';
import usePharmacyStore from '../../../functions/pharmacy/usePharmacyStore';
import { PharmacyBranchForm } from './PharmacyBranchForm';
import type { PharmacyBranchPayload } from '../../../types/PharmTypes';
import type { CenterDto, CountryDto } from '../../../types/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    centers: CenterDto[]; 
    countries: CountryDto[]; // <-- NOUVELLE PROP
}

export const CreatePharmacyBranchModal: React.FC<Props> = ({ isOpen, onClose, centers, countries }) => {
    const { createPharmacyBranch, actionLoading } = usePharmacyStore();
    
    const [payload, setPayload] = useState<PharmacyBranchPayload>({
        name: '',
        adress: '',
        type: '',
        center_id: null,
        country_id: null // <-- NOUVEAU CHAMP
    });

    const handleSubmit = async () => {
        if (!payload.name || !payload.adress || !payload.type) return;
        
        const success = await createPharmacyBranch(payload);
        if (success) {
            setPayload({ name: '', adress: '', type: '', center_id: null, country_id: null });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-lg p-6 shadow-xl border border-transparent dark:border-gray-800">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Nouvelle Succursale (Pharmacie)</h2>
                
                <PharmacyBranchForm 
                    payload={payload} 
                    setPayload={setPayload} 
                    centers={centers} 
                    countries={countries} // <-- PASSAGE DE LA PROP
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
                        disabled={actionLoading || !payload.name || !payload.adress || !payload.type}
                        className="px-6 py-2 bg-[#00a896] text-white rounded-md hover:bg-[#008f7e] disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Création..." : "Enregistrer"}
                    </button>
                </div>
            </div>
        </div>
    );
};