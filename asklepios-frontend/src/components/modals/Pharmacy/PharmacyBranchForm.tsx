import React from 'react';
import Select from 'react-select';
import type { PharmacyBranchPayload, PharmacyBranchType } from '../../../types/PharmTypes';

interface Props {
    payload: PharmacyBranchPayload;
    setPayload: (p: PharmacyBranchPayload) => void;
}

export const PharmacyBranchForm: React.FC<Props> = ({ payload, setPayload }) => {

    // Options pour le type de succursale
    const typeOptions = [
        { value: 'central_warehouse', label: 'Magasin Central (Stock Principal)' },
        { value: 'retail_pos', label: 'Point de Vente (Détail / Comptoir)' }
    ];

    // Styles pour s'assurer que react-select passe par-dessus la modale
    const selectStyles = {
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
    };

    return (
        <div className="space-y-4">
            
            {/* NOM DE LA SUCCURSALE */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Nom de la Pharmacie / Succursale <span className="text-red-500">*</span>
                </label>
                <input 
                    type="text" 
                    placeholder="Ex: Pharmacie Principale, Magasin A..."
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors" 
                    value={payload.name}
                    onChange={(e) => setPayload({...payload, name: e.target.value})} 
                />
            </div>

            {/* ADRESSE (Attention : "adress" selon ta BDD) */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Adresse / Emplacement <span className="text-red-500">*</span>
                </label>
                <input 
                    type="text" 
                    placeholder="Ex: Bâtiment B, Rez-de-chaussée..."
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors" 
                    value={payload.adress}
                    onChange={(e) => setPayload({...payload, adress: e.target.value})} 
                />
            </div>

            {/* TYPE DE SUCCURSALE (React-Select) */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Type de structure <span className="text-red-500">*</span>
                </label>
                <Select 
                    options={typeOptions}
                    value={typeOptions.find(opt => opt.value === payload.type) || null}
                    onChange={(selected) => setPayload({ 
                        ...payload, 
                        type: selected ? (selected.value as PharmacyBranchType) : "" 
                    })}
                    placeholder="Sélectionner le type..."
                    isClearable
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                    className="react-select-container text-sm"
                    classNamePrefix="react-select"
                />
            </div>

        </div>
    );
};