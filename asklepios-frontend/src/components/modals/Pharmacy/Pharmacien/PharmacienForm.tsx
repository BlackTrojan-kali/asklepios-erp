import React from 'react';
import Select from 'react-select';
import type { PharmacienPayload } from '../../../../types/PharmTypes';

// On suppose que tu as un type PharmacyBranchDto pour tes succursales
interface PharmacyBranchDto {
    id: number;
    name: string;
}

interface Props {
    payload: PharmacienPayload;
    setPayload: (p: PharmacienPayload) => void;
    branches: PharmacyBranchDto[];
    isUpdate?: boolean;
}

export const PharmacienForm: React.FC<Props> = ({ payload, setPayload, branches, isUpdate = false }) => {
    
    // Formatage des succursales pour react-select
    const branchOptions = branches.map(b => ({ 
        value: b.id, 
        label: b.name 
    }));

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
                        placeholder="Ex: Jean"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.first_name}
                        onChange={(e) => setPayload({...payload, first_name: e.target.value})} 
                    />
                </div>

                {/* NOM */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Nom
                    </label>
                    <input 
                        type="text" 
                        placeholder="Ex: Dupont"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.last_name}
                        onChange={(e) => setPayload({...payload, last_name: e.target.value})} 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* EMAIL */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Adresse Email <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="email" 
                        placeholder="jean.dupont@email.com"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.email}
                        onChange={(e) => setPayload({...payload, email: e.target.value})} 
                    />
                </div>

                {/* TÉLÉPHONE */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Téléphone <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="tel" 
                        placeholder="Ex: 690000000"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.phone}
                        onChange={(e) => setPayload({...payload, phone: e.target.value})} 
                    />
                </div>
            </div>

            {/* MOT DE PASSE */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Mot de passe {isUpdate ? "" : <span className="text-red-500">*</span>}
                </label>
                <input 
                    type="password" 
                    placeholder={isUpdate ? "Laissez vide pour conserver l'actuel" : "Minimum 6 caractères"}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors" 
                    value={payload.password || ''}
                    onChange={(e) => setPayload({...payload, password: e.target.value})} 
                />
                {isUpdate && (
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                        Ne remplissez ce champ que si vous souhaitez modifier le mot de passe du pharmacien.
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* POSITION */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Poste / Rôle <span className="text-red-500">*</span>
                    </label>
                    <select 
                        value={payload.position}
                        onChange={(e) => setPayload({...payload, position: e.target.value as 'magasin' | 'vente' | ''})}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors"
                    >
                        <option value="">Sélectionner un poste...</option>
                        <option value="magasin">Magasinier (Gestion des stocks)</option>
                        <option value="vente">Vendeur (Comptoir / Caissier)</option>
                    </select>
                </div>

                {/* SUCCURSALE (BRANCH) */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Succursale d'affectation <span className="text-red-500">*</span>
                    </label>
                    <Select 
                        options={branchOptions}
                        value={branchOptions.find(opt => opt.value === payload.branch_id) || null}
                        onChange={(selected) => setPayload({ 
                            ...payload, 
                            branch_id: selected ? selected.value : "" 
                        })}
                        placeholder="Rechercher une succursale..."
                        isClearable
                        menuPortalTarget={document.body}
                        styles={selectStyles}
                        className="react-select-container text-sm"
                        classNamePrefix="react-select"
                    />
                </div>
            </div>

        </div>
    );
};