import React from 'react';
import Select from 'react-select';
import { BedState } from '../../../../types/BedTypes';
import type { BedPayload } from '../../../../types/BedTypes';

interface Props {
    payload: BedPayload;
    setPayload: (p: BedPayload) => void;
}

export const BedForm: React.FC<Props> = ({ payload, setPayload }) => {
    
    // Options pour les états du lit
    const stateOptions = [
        { value: BedState.AVAILABLE, label: "🟢 Disponible" },
        { value: BedState.OCCUPIED, label: "🔴 Occupé" },
        { value: BedState.CLEANING, label: "🧹 En Nettoyage" },
        { value: BedState.MAINTENANCE, label: "🔧 En Maintenance" },
    ];

    // Styles personnalisés pour forcer le texte en noir dans React-Select
    const selectStyles = {
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
        control: (base: any) => ({
            ...base,
            color: '#000000'
        }),
        singleValue: (base: any) => ({
            ...base,
            color: '#000000'
        }),
        input: (base: any) => ({
            ...base,
            color: '#000000'
        }),
        option: (base: any, state: any) => ({
            ...base,
            color: '#000000',
            backgroundColor: state.isFocused ? '#f1f5f9' : '#ffffff',
            cursor: 'pointer'
        })
    };

    return (
        <div className="space-y-4">
            
            {/* NUMÉRO DU LIT */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Numéro / Identifiant du lit <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    placeholder="Ex: LIT-01, Lit 102A..."
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors"
                    value={payload.bed_number}
                    onChange={(e) => setPayload({ ...payload, bed_number: e.target.value })}
                />
            </div>

            {/* ÉTAT DU LIT */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    État actuel <span className="text-red-500">*</span>
                </label>
                <Select
                    options={stateOptions}
                    value={stateOptions.find(opt => opt.value === payload.state) || null}
                    onChange={(selected) => setPayload({
                        ...payload,
                        state: selected ? (selected.value as BedState) : ''
                    })}
                    placeholder="Définir l'état du lit..."
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                    className="react-select-container text-sm"
                    classNamePrefix="react-select"
                />
            </div>

        </div>
    );
};