import React from 'react';
import Select from 'react-select';
import { PatientGender } from '../../../../types/PatientTypes';
import type { PatientPayload } from '../../../../types/PatientTypes';

interface Props {
    payload: PatientPayload;
    setPayload: (p: PatientPayload) => void;
}

export const PatientForm: React.FC<Props> = ({ payload, setPayload }) => {

    // Options pour le genre
    const genderOptions = [
        { value: PatientGender.MALE, label: "Homme" },
        { value: PatientGender.FEMALE, label: "Femme" },
        { value: PatientGender.OTHER, label: "Autre" }
    ];

    // Styles React-Select (fix texte noir clair/sombre)
    const selectStyles = {
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
        control: (base: any) => ({ ...base, color: '#000000' }),
        singleValue: (base: any) => ({ ...base, color: '#000000' }),
        input: (base: any) => ({ ...base, color: '#000000' }),
        option: (base: any, state: any) => ({
            ...base,
            color: '#000000',
            backgroundColor: state.isFocused ? '#f1f5f9' : '#ffffff',
            cursor: 'pointer'
        })
    };

    return (
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            
            {/* SECTION: IDENTITÉ */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2">
                    Identité du patient
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* PRÉNOM */}
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            Prénom <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            placeholder="Ex: Jean"
                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors" 
                            value={payload.first_name}
                            onChange={(e) => setPayload({...payload, first_name: e.target.value})} 
                        />
                    </div>

                    {/* NOM */}
                    <div className="md:col-span-1">
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

                    {/* GENRE */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            Genre <span className="text-red-500">*</span>
                        </label>
                        <Select
                            options={genderOptions}
                            value={genderOptions.find(opt => opt.value === payload.gender) || null}
                            onChange={(selected) => setPayload({
                                ...payload,
                                gender: selected ? (selected.value as PatientGender) : ''
                            })}
                            placeholder="Sélectionner le genre..."
                            menuPortalTarget={document.body}
                            styles={selectStyles}
                            className="react-select-container text-sm"
                            classNamePrefix="react-select"
                        />
                    </div>

                    {/* DATE DE NAISSANCE */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            Date de naissance <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="date" 
                            max={new Date().toISOString().split('T')[0]} 
                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors" 
                            value={payload.bith_date}
                            onChange={(e) => setPayload({...payload, bith_date: e.target.value})} 
                        />
                    </div>

                    {/* LIEU DE NAISSANCE */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            Lieu de naissance
                        </label>
                        <input 
                            type="text" 
                            placeholder="Ex: Douala"
                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors" 
                            value={payload.birth_place || ''}
                            onChange={(e) => setPayload({...payload, birth_place: e.target.value})} 
                        />
                    </div>
                </div>
            </div>

            {/* SECTION: COORDONNÉES */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2">
                    Coordonnées
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* TÉLÉPHONE */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            Téléphone principal <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="tel" 
                            placeholder="Ex: 6XXXXXXXX"
                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors" 
                            value={payload.contact_phone}
                            onChange={(e) => setPayload({...payload, contact_phone: e.target.value})} 
                        />
                    </div>

                    {/* ADRESSE */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            Adresse de résidence
                        </label>
                        <input 
                            type="text" 
                            placeholder="Ex: Akwa, Rue des manguiers"
                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors" 
                            value={payload.address || ''}
                            onChange={(e) => setPayload({...payload, address: e.target.value})} 
                        />
                    </div>
                </div>
            </div>

            {/* SECTION: CONTACT D'URGENCE */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2">
                    En cas d'urgence
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            Nom du contact
                        </label>
                        <input 
                            type="text" 
                            placeholder="Ex: Marie Dupont (Mère)"
                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors" 
                            value={payload.emergency_contact_name || ''}
                            onChange={(e) => setPayload({...payload, emergency_contact_name: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            Téléphone d'urgence
                        </label>
                        <input 
                            type="tel" 
                            placeholder="Ex: 6XXXXXXXX"
                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors" 
                            value={payload.emergency_contact_number || ''}
                            onChange={(e) => setPayload({...payload, emergency_contact_number: e.target.value})} 
                        />
                    </div>
                </div>
            </div>

        </div>
    );
};