import React from 'react';
import type { ProviderPayload } from '../../../../types/ProviderTypes';

interface Props {
    payload: ProviderPayload;
    setPayload: (p: ProviderPayload) => void;
    isUpdate?: boolean;
}

export const ProviderForm: React.FC<Props> = ({ payload, setPayload, isUpdate = false }) => {
    return (
        <div className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NOM */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Raison sociale / Nom <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        placeholder="Ex: PharmaPlus Distribution"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.name}
                        onChange={(e) => setPayload({...payload, name: e.target.value})} 
                    />
                </div>

                {/* TÉLÉPHONE */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Téléphone
                    </label>
                    <input 
                        type="tel" 
                        placeholder="Ex: 690000000"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.phone}
                        onChange={(e) => setPayload({...payload, phone: e.target.value})} 
                    />
                </div>

                {/* NIU (Numéro d'Identifiant Unique) */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        NIU (Identifiant Fiscal)
                    </label>
                    <input 
                        type="text" 
                        placeholder="Ex: M000000000000A"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors uppercase" 
                        value={payload.niu}
                        onChange={(e) => setPayload({...payload, niu: e.target.value})} 
                    />
                </div>
            </div>

            {/* ADRESSE */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Adresse physique
                </label>
                <textarea 
                    rows={2}
                    placeholder="Ex: Akwa, Douala - Face Pharmacie Centrale"
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors resize-none custom-scrollbar" 
                    value={payload.address}
                    onChange={(e) => setPayload({...payload, address: e.target.value})} 
                ></textarea>
            </div>

        </div>
    );
};