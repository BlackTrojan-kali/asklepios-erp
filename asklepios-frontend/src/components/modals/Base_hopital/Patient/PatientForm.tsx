import React from 'react';
import type { PatientPayload } from '../../../../types/PatientTypes';

interface Props {
    payload: PatientPayload;
    setPayload: (p: PatientPayload) => void;
}

export const PatientForm: React.FC<Props> = ({ payload, setPayload }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* PRÉNOM */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Prénom <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        placeholder="Ex: Jean, Marie..."
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.first_name}
                        onChange={(e) => setPayload({...payload, first_name: e.target.value})} 
                    />
                </div>

                {/* NOM */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Nom de famille
                    </label>
                    <input 
                        type="text" 
                        placeholder="Ex: Dupont"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.last_name || ''}
                        onChange={(e) => setPayload({...payload, last_name: e.target.value})} 
                    />
                </div>

                {/* DATE DE NAISSANCE */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Date de naissance <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="date" 
                        // On limite la date max à aujourd'hui (un patient ne peut pas naître demain)
                        max={new Date().toISOString().split('T')[0]} 
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.bith_date}
                        onChange={(e) => setPayload({...payload, bith_date: e.target.value})} 
                    />
                </div>

                {/* TÉLÉPHONE */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Téléphone de contact <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="tel" 
                        placeholder="Ex: 6XXXXXXXX"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.contact_phone}
                        onChange={(e) => setPayload({...payload, contact_phone: e.target.value})} 
                    />
                </div>

            </div>
        </div>
    );
};