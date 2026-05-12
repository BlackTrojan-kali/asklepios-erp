import React from 'react';
import Select from 'react-select';
import type { SubscriptionPayload, LicenceDto, CountryDto, HospitalDto } from '../../../types/types';

interface Props {
    payload: SubscriptionPayload;
    setPayload: (p: SubscriptionPayload) => void;
    licences: LicenceDto[];
    countries: CountryDto[];
    hospitals: HospitalDto[];
}

export const SubscriptionForm: React.FC<Props> = ({ payload, setPayload, licences, countries, hospitals }) => {
    
    // --- FORMATAGE DES OPTIONS POUR REACT-SELECT ---
    const hospitalOptions = hospitals.map(h => ({ value: h.id!, label: h.name }));
    const countryOptions = countries.map(c => ({ value: c.id!, label: c.name }));
    const licenceOptions = licences.map(l => ({ value: l.id, label: l.name }));

    // --- GESTION DES LIGNES (ITEMS) ---
    const addItem = () => {
        setPayload({
            ...payload,
            items: [...payload.items, { licence_id: 0, unit_price: 0 }]
        });
    };

    const removeItem = (index: number) => {
        setPayload({
            ...payload,
            items: payload.items.filter((_, i) => i !== index)
        });
    };

    const updateItem = (index: number, field: 'licence_id' | 'unit_price', value: number) => {
        const newItems = [...payload.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setPayload({ ...payload, items: newItems });
    };

    // Styles de base pour s'assurer que le menu passe au-dessus de la modale
    const selectStyles = {
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
    };

    return (
        <div className="space-y-5">
            
            {/* HÔPITAL & PAYS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Hôpital</label>
                    <Select 
                        options={hospitalOptions}
                        value={hospitalOptions.find(opt => opt.value === payload.hospital_id) || null}
                        onChange={(selected) => setPayload({ ...payload, hospital_id: selected ? selected.value : 0 })}
                        placeholder="Rechercher un hôpital..."
                        isClearable
                        menuPortalTarget={document.body}
                        styles={selectStyles}
                        className="react-select-container"
                        classNamePrefix="react-select"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Pays de facturation</label>
                    <Select 
                        options={countryOptions}
                        value={countryOptions.find(opt => opt.value === payload.country_id) || null}
                        onChange={(selected) => setPayload({ ...payload, country_id: selected ? selected.value : 0 })}
                        placeholder="Rechercher un pays..."
                        isClearable
                        menuPortalTarget={document.body}
                        styles={selectStyles}
                    />
                </div>
            </div>

            {/* DATES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Date de début</label>
                    <input 
                        type="date" 
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896]" 
                        value={payload.starting_date}
                        onChange={(e) => setPayload({...payload, starting_date: e.target.value})} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Date de fin</label>
                    <input 
                        type="date" 
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896]"
                        value={payload.ending_date}
                        onChange={(e) => setPayload({...payload, ending_date: e.target.value})} 
                    />
                </div>
            </div>

            {/* LICENCES INCLUSES */}
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-gray-200">Licences incluses</h4>
                    <button 
                        type="button" 
                        onClick={addItem} 
                        className="text-xs bg-[#00a896] hover:bg-[#008f7e] text-white px-3 py-1.5 rounded transition-colors"
                    >
                        + Ajouter une licence
                    </button>
                </div>
                
                {payload.items.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-2 mb-3 items-start sm:items-center bg-slate-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                        
                        <div className="flex-1 w-full sm:w-auto">
                            <Select 
                                options={licenceOptions}
                                value={licenceOptions.find(opt => opt.value === item.licence_id) || null}
                                onChange={(selected) => updateItem(index, 'licence_id', selected ? selected.value : 0)}
                                placeholder="Rechercher une licence..."
                                isClearable
                                menuPortalTarget={document.body}
                                styles={selectStyles}
                            />
                        </div>
                        
                        <div className="w-full sm:w-40 flex gap-2">
                            <div className="relative flex-1">
                                <input 
                                    type="number" 
                                    placeholder="Prix unitaire" 
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm outline-none focus:border-[#00a896] dark:bg-gray-800"
                                    value={item.unit_price || ''}
                                    onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))} 
                                    min="0"
                                />
                            </div>
                            <button 
                                type="button"
                                onClick={() => removeItem(index)} 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded transition-colors"
                                title="Retirer cette ligne"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}

                {payload.items.length === 0 && (
                    <div className="text-center p-4 text-sm text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                        Aucune licence ajoutée à ce contrat pour le moment.
                    </div>
                )}
            </div>
        </div>
    );
};