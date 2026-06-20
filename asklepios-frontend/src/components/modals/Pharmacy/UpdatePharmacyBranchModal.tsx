import React, { useState, useEffect } from 'react';
import usePharmacyStore from '../../../functions/pharmacy/usePharmacyStore';
import { PharmacyBranchForm } from './PharmacyBranchForm';
import type { PharmacyBranchDto, PharmacyBranchPayload } from '../../../types/PharmTypes';
import type { CenterDto, CountryDto } from '../../../types/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    branch: PharmacyBranchDto | null;
    centers: CenterDto[]; 
    countries: CountryDto[]; // <-- NOUVELLE PROP
}

export const UpdatePharmacyBranchModal: React.FC<Props> = ({ isOpen, onClose, branch, centers, countries }) => {
    const { updatePharmacyBranch, actionLoading } = usePharmacyStore();
    
    const [payload, setPayload] = useState<PharmacyBranchPayload>({
        name: '',
        adress: '',
        type: '',
        center_id: null,
        country_id: null // <-- NOUVEAU CHAMP
    });

    // Remplissage du formulaire avec les données existantes
    useEffect(() => {
        if (branch) {
            setPayload({
                name: branch.name,
                adress: branch.adress,
                type: branch.type,
                center_id: branch.center_id || null, 
                country_id: branch.country_id || null // <-- CHARGEMENT DE LA DONNÉE EXISTANTE
            });
        }
    }, [branch]);

    const handleSubmit = async () => {
        if (!branch || !payload.name || !payload.adress || !payload.type) return;

        const success = await updatePharmacyBranch(branch.id, payload);
        if (success) onClose();
    };

    if (!isOpen || !branch) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-lg p-6 shadow-xl border border-transparent dark:border-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Modifier la Succursale</h2>
                </div>
                
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
                        Fermer
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading || !payload.name || !payload.adress || !payload.type}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Sauvegarde..." : "Enregistrer les modifications"}
                    </button>
                </div>
            </div>
        </div>
    );
};