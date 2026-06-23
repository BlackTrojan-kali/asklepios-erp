import React from 'react';
import Select from 'react-select';
import type { DoctorPayload } from '../../../../types/DoctorTypes'; 
import type { DepartmentDto, CenterDto } from '../../../../types/types';

interface Props {
    payload: DoctorPayload;
    setPayload: (p: DoctorPayload) => void;
    centers: CenterDto[];
    departments: DepartmentDto[];
    isUpdate?: boolean;
}

export const DoctorForm: React.FC<Props> = ({ payload, setPayload, centers, departments, isUpdate = false }) => {

    // Formatage pour react-select
    const centerOptions = centers.map(c => ({ value: c.id, label: c.name }));
    
    // On peut filtrer les départements pour n'afficher que ceux du centre sélectionné
    const filteredDepartments = departments.filter(d => 
        payload.center_id ? d.center_id === payload.center_id : true
    );
    const departmentOptions = filteredDepartments.map(d => ({ value: d.id, label: d.name }));

    // Styles pour s'assurer que react-select passe par-dessus la modale
    const selectStyles = {
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
    };

    return (
        <div className="space-y-5">
            
            {/* SECTION 1 : IDENTITÉ ET CONTACT */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Informations Personnelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* SECTION 2 : PROFIL MÉDICAL */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Profil Médical & Affectation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            Spécialité <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            placeholder="Ex: Cardiologue, Pédiatre, Médecin Généraliste..."
                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors" 
                            value={payload.speciality}
                            onChange={(e) => setPayload({...payload, speciality: e.target.value})} 
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            Spécifications / Détails (Optionnel)
                        </label>
                        <textarea 
                            rows={2}
                            placeholder="Ex: Spécialiste en cardiologie pédiatrique..."
                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors resize-none" 
                            value={payload.specifications || ''}
                            onChange={(e) => setPayload({...payload, specifications: e.target.value})} 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            Centre d'affectation <span className="text-red-500">*</span>
                        </label>
                        <Select 
                            options={centerOptions}
                            value={centerOptions.find(opt => opt.value === payload.center_id) || null}
                            onChange={(selected) => setPayload({ 
                                ...payload, 
                                center_id: selected ? selected.value : "",
                                department_id: "" // Reset du département si on change de centre
                            })}
                            placeholder="Choisir le centre..."
                            isClearable
                            menuPortalTarget={document.body}
                            styles={selectStyles}
                            className="react-select-container text-sm"
                            classNamePrefix="react-select"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            Département (Optionnel)
                        </label>
                        <Select 
                            options={departmentOptions}
                            value={departmentOptions.find(opt => opt.value === payload.department_id) || null}
                            onChange={(selected) => setPayload({ 
                                ...payload, 
                                department_id: selected ? selected.value : null 
                            })}
                            placeholder="Choisir le département..."
                            isClearable
                            isDisabled={!payload.center_id} // Désactivé si aucun centre n'est choisi
                            menuPortalTarget={document.body}
                            styles={selectStyles}
                            className="react-select-container text-sm"
                            classNamePrefix="react-select"
                        />
                    </div>

                </div>
            </div>

        </div>
    );
};