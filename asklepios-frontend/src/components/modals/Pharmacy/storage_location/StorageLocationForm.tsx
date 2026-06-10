import React from 'react';
import type { StorageLocationPayload } from '../../../../types/PharmMagTypes';

interface Props {
    payload: StorageLocationPayload;
    setPayload: (p: StorageLocationPayload) => void;
}

export const StorageLocationForm: React.FC<Props> = ({ payload, setPayload }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ALLÉE */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Allée / Secteur
                    </label>
                    <input 
                        type="text" 
                        placeholder="Ex: Allée A, Secteur Froid..."
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.aisle}
                        onChange={(e) => setPayload({...payload, aisle: e.target.value})} 
                    />
                </div>

                {/* ÉTAGÈRE */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Étagère / Rayon
                    </label>
                    <input 
                        type="text" 
                        placeholder="Ex: Étagère 3, Niveau Haut..."
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.shelf}
                        onChange={(e) => setPayload({...payload, shelf: e.target.value})} 
                    />
                </div>

                {/* CODE */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Code d'emplacement (Optionnel)
                    </label>
                    <input 
                        type="text" 
                        placeholder="Ex: A-3-Haut (Utile pour les douchettes code-barres)"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors uppercase font-mono" 
                        value={payload.code}
                        onChange={(e) => setPayload({...payload, code: e.target.value})} 
                    />
                </div>
            </div>
        </div>
    );
};