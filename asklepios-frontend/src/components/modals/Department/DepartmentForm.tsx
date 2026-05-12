import React from 'react';
import type { DepartmentPayload } from '../../../types/types';

interface Props {
    payload: DepartmentPayload;
    setPayload: (p: DepartmentPayload) => void;
}

export const DepartmentForm: React.FC<Props> = ({ payload, setPayload }) => {
    return (
        <div className="space-y-4">
            {/* NOM DU DÉPARTEMENT */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Nom du Département <span className="text-red-500">*</span>
                </label>
                <input 
                    type="text" 
                    placeholder="Ex: Cardiologie, Urgences, Pharmacie..."
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors" 
                    value={payload.name}
                    onChange={(e) => setPayload({...payload, name: e.target.value})} 
                />
            </div>

            {/* ALIAS / CODE */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Alias / Code (Optionnel)
                </label>
                <input 
                    type="text" 
                    placeholder="Ex: CARDIO, URG, PHARM..."
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors uppercase" 
                    value={payload.alias || ''}
                    onChange={(e) => setPayload({...payload, alias: e.target.value.toUpperCase()})} 
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
                    Un code court utilisé pour les rapports et les identifiants internes.
                </p>
            </div>
        </div>
    );
};