import React from 'react';
import Select from 'react-select';
import type { CenterPayload, CountryDto } from '../../../types/types';

interface Props {
    payload: CenterPayload;
    setPayload: (p: CenterPayload) => void;
    countries: CountryDto[];
}

export const CenterForm: React.FC<Props> = ({ payload, setPayload, countries }) => {
    
    // Formatage des options pour react-select
    const countryOptions = countries.map(c => ({ value: c.id!, label: c.name }));

    // Styles de base pour s'assurer que le menu passe au-dessus de la modale
    const selectStyles = {
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
    };

    return (
        <div className="space-y-4">
            
            {/* NOM DU CENTRE */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Nom du Centre <span className="text-red-500">*</span>
                </label>
                <input 
                    type="text" 
                    placeholder="Ex: Centre Principal, Annexe Mvan..."
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white" 
                    value={payload.name}
                    onChange={(e) => setPayload({...payload, name: e.target.value})} 
                />
            </div>

            {/* PAYS (React-Select) */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Pays <span className="text-red-500">*</span>
                </label>
                <Select 
                    options={countryOptions}
                    value={countryOptions.find(opt => opt.value === payload.country_id) || null}
                    onChange={(selected) => setPayload({ ...payload, country_id: selected ? selected.value : 0 })}
                    placeholder="Rechercher un pays..."
                    isClearable
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                    className="react-select-container text-sm"
                    classNamePrefix="react-select"
                />
            </div>

            {/* ADRESSE */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Adresse</label>
                <input 
                    type="text" 
                    placeholder="Quartier, Rue, Repère..."
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white" 
                    value={payload.address || ''}
                    onChange={(e) => setPayload({...payload, address: e.target.value})} 
                />
            </div>

            {/* TÉLÉPHONES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Téléphone 1</label>
                    <input 
                        type="text" 
                        placeholder="+237 600 000 000"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white" 
                        value={payload.phone_1 || ''}
                        onChange={(e) => setPayload({...payload, phone_1: e.target.value})} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Téléphone 2 (Optionnel)</label>
                    <input 
                        type="text" 
                        placeholder="+237 600 000 000"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white" 
                        value={payload.phone_2 || ''}
                        onChange={(e) => setPayload({...payload, phone_2: e.target.value})} 
                    />
                </div>
            </div>
        </div>
    );
};