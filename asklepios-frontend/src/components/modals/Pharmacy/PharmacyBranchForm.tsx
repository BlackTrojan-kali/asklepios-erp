import React from 'react';
import Select from 'react-select';
import type { PharmacyBranchPayload, PharmacyBranchType } from '../../../types/PharmTypes';
import type { CenterDto, CountryDto } from '../../../types/types'; 

interface Props {
    payload: PharmacyBranchPayload;
    setPayload: (p: PharmacyBranchPayload) => void;
    centers: CenterDto[]; 
    countries: CountryDto[]; // <-- NOUVELLE PROP
}

export const PharmacyBranchForm: React.FC<Props> = ({ payload, setPayload, centers, countries }) => {

    // Options pour le type de succursale
    const typeOptions = [
        { value: 'central_warehouse', label: 'Magasin Central (Stock Principal)' },
        { value: 'retail_pos', label: 'Point de Vente (Détail / Comptoir)' }
    ];

    // Formatage pour react-select
    const centerOptions = centers.map(c => ({ value: c.id, label: c.name }));
    const countryOptions = countries.map(c => ({ value: c.id, label: c.name }));

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

            {/* ADRESSE */}
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

            {/* TYPE DE SUCCURSALE */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PAYS (Nouveau champ optionnel) */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Pays d'implantation (Optionnel)
                    </label>
                    <Select 
                        options={countryOptions}
                        value={countryOptions.find(opt => opt.value === payload.country_id) || null}
                        onChange={(selected) => setPayload({ 
                            ...payload, 
                            country_id: selected ? selected.value : null 
                        })}
                        placeholder="Sélectionner un pays..."
                        isClearable
                        menuPortalTarget={document.body}
                        styles={selectStyles}
                        className="react-select-container text-sm"
                        classNamePrefix="react-select"
                    />
                </div>

                {/* CENTRE MÉDICAL (Optionnel) */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Rattacher à un Centre (Optionnel)
                    </label>
                    <Select 
                        options={centerOptions}
                        value={centerOptions.find(opt => opt.value === payload.center_id) || null}
                        onChange={(selected) => setPayload({ 
                            ...payload, 
                            center_id: selected ? selected.value : null 
                        })}
                        placeholder="Aucun centre..."
                        isClearable
                        menuPortalTarget={document.body}
                        styles={selectStyles}
                        className="react-select-container text-sm"
                        classNamePrefix="react-select"
                    />
                </div>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
                Laissez le centre vide s'il s'agit d'un magasin central commun à tout l'hôpital.
            </p>

        </div>
    );
};