import React from 'react';
import Select from 'react-select';
import type { ReceptionistPayload } from '../../../../types/ReceptionistTypes';
import type { CenterDto } from '../../../../types/types'; // Ajuste l'import selon ton arborescence

interface Props {
    payload: ReceptionistPayload;
    setPayload: (p: ReceptionistPayload) => void;
    centers: CenterDto[];
    isUpdate?: boolean; // Permet de savoir si on est en mode édition
}

export const ReceptionistForm: React.FC<Props> = ({ payload, setPayload, centers, isUpdate = false }) => {

    // Formatage des centres pour react-select
    const centerOptions = centers.map(c => ({ value: c.id, label: c.name }));

    // Styles pour s'assurer que react-select passe par-dessus la modale
    const selectStyles = {
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
    };

    return (
        <div className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PRÉNOM */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Prénom <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.first_name}
                        onChange={(e) => setPayload({...payload, first_name: e.target.value})} 
                    />
                </div>

                {/* NOM */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Nom de famille
                    </label>
                    <input 
                        type="text" 
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.last_name || ''}
                        onChange={(e) => setPayload({...payload, last_name: e.target.value})} 
                    />
                </div>

                {/* TÉLÉPHONE */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Téléphone <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="tel" 
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.phone}
                        onChange={(e) => setPayload({...payload, phone: e.target.value})} 
                    />
                </div>

                {/* EMAIL */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Email (Identifiant) <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="email" 
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.email}
                        onChange={(e) => setPayload({...payload, email: e.target.value})} 
                    />
                </div>

                {/* MOT DE PASSE */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Mot de passe {isUpdate ? <span className="text-xs text-gray-400 font-normal">(Optionnel, laisser vide pour ne pas modifier)</span> : <span className="text-red-500">*</span>}
                    </label>
                    <input 
                        type="password" 
                        placeholder={isUpdate ? "••••••••" : "Saisissez un mot de passe sécurisé"}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.password || ''}
                        onChange={(e) => setPayload({...payload, password: e.target.value})} 
                    />
                </div>

                {/* CENTRE MÉDICAL */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Centre d'affectation <span className="text-red-500">*</span>
                    </label>
                    <Select 
                        options={centerOptions}
                        value={centerOptions.find(opt => opt.value === payload.center_id) || null}
                        onChange={(selected) => setPayload({ 
                            ...payload, 
                            center_id: selected ? selected.value : "" 
                        })}
                        placeholder="Sélectionner le centre..."
                        isClearable
                        menuPortalTarget={document.body}
                        styles={selectStyles}
                        className="react-select-container text-sm"
                        classNamePrefix="react-select"
                    />
                </div>

                {/* NOM DU BUREAU / ACCUEIL */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Poste / Nom du guichet <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        placeholder="Ex: Accueil Urgences, Guichet Principal..."
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.desk_name}
                        onChange={(e) => setPayload({...payload, desk_name: e.target.value})} 
                    />
                </div>
            </div>

        </div>
    );
};