import React from 'react';
import Select from 'react-select';
import type { RoomCategoryPayload } from '../../../../types/RoomCategoryTypes';
import type { CenterDto } from '../../../../types/types';

interface Props {
    payload: RoomCategoryPayload;
    setPayload: (p: RoomCategoryPayload) => void;
    centers: CenterDto[];
}

export const RoomCategoryForm: React.FC<Props> = ({ payload, setPayload, centers }) => {
    
    // Formatage des options pour react-select
    const centerOptions = centers.map(c => ({
        value: c.id,
        label: c.name
    }));

    const selectStyles = {
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
    };

    return (
        <div className="space-y-4">
            
            {/* SÉLECTION DU CENTRE */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Centre Médical <span className="text-red-500">*</span>
                </label>
                <Select
                    options={centerOptions}
                    value={centerOptions.find(opt => opt.value === payload.center_id) || null}
                    onChange={(selected) => setPayload({
                        ...payload,
                        center_id: selected ? selected.value : ''
                    })}
                    placeholder="Sélectionner un centre..."
                    isClearable
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                    className="react-select-container text-sm"
                    classNamePrefix="react-select"
                />
            </div>

            {/* NOM DE LA CATÉGORIE */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Nom de la catégorie <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    placeholder="Ex: VIP, Standard, Soins Intensifs..."
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors"
                    value={payload.name}
                    onChange={(e) => setPayload({ ...payload, name: e.target.value })}
                />
            </div>

            {/* PRIX PAR NUITÉE */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Prix par nuitée (FCFA) <span className="text-red-500">*</span>
                </label>
                <input
                    type="number"
                    min="0"
                    placeholder="Ex: 25000"
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors"
                    value={payload.price_per_night}
                    onChange={(e) => setPayload({ 
                        ...payload, 
                        price_per_night: e.target.value === '' ? '' : Number(e.target.value) 
                    })}
                />
            </div>

        </div>
    );
};