import React from 'react';
import Select from 'react-select';
import type { FacilityRoomPayload } from '../../../../types/FacilityRoomTypes';
import type { DepartmentDto } from '../../../../types/types';
import type { RoomCategoryDto } from '../../../../types/RoomCategoryTypes';
import { FacilityRoomType } from '../../../../types/FacilityRoomTypes';

interface Props {
    payload: FacilityRoomPayload;
    setPayload: (p: FacilityRoomPayload) => void;
    departments: DepartmentDto[];
    roomCategories: RoomCategoryDto[];
    freezeDepartment?: boolean; // Permet de bloquer le choix du département si on est déjà dans un dossier spécifique
}

export const FacilityRoomForm: React.FC<Props> = ({ 
    payload, 
    setPayload, 
    departments, 
    roomCategories, 
    freezeDepartment = false 
}) => {
    
    // Options pour les départements
    const departmentOptions = departments.map(d => ({ value: d.id, label: d.name }));

    // Options pour les types de salles
    const typeOptions = [
        { value: FacilityRoomType.WAITING_ROOM, label: "Salle d'attente" },
        { value: FacilityRoomType.CONSULTATION, label: "Bureau de Consultation" },
        { value: FacilityRoomType.WARD, label: "Salle d'Hospitalisation (Chambre)" },
    ];

    // Options pour les catégories de chambres (filtrées par le centre du département choisi)
    const filteredCategories = roomCategories.filter(cat => {
        if (!payload.department_id) return true;
        const currentDept = departments.find(d => d.id === payload.department_id);
        return currentDept ? cat.center_id === currentDept.center_id : true;
    });
    
    const categoryOptions = filteredCategories.map(c => ({ value: c.id, label: `${c.name} (${c.price_per_night} FCFA/Nuit)` }));

    // Styles personnalisés pour forcer le texte en noir dans React-Select (Light & Dark mode)
    const selectStyles = {
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
        control: (base: any) => ({
            ...base,
            color: '#000000'
        }),
        singleValue: (base: any) => ({
            ...base,
            color: '#000000' // Texte de la valeur sélectionnée toujours noir
        }),
        input: (base: any) => ({
            ...base,
            color: '#000000' // Curseur et texte de saisie toujours noirs
        }),
        option: (base: any, state: any) => ({
            ...base,
            color: '#000000', // Options du menu déroulant toujours noires
            backgroundColor: state.isFocused ? '#f1f5f9' : '#ffffff', // Fond gris clair au survol, blanc sinon
            cursor: 'pointer'
        })
    };

    return (
        <div className="space-y-4">
            
            {/* CHOIX DU DÉPARTEMENT */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Département <span className="text-red-500">*</span>
                </label>
                <Select
                    options={departmentOptions}
                    value={departmentOptions.find(opt => opt.value === payload.department_id) || null}
                    onChange={(selected) => setPayload({
                        ...payload,
                        department_id: selected ? selected.value : '',
                        room_category_id: null // Reset de la catégorie en cas de changement
                    })}
                    placeholder="Sélectionner le département..."
                    isDisabled={freezeDepartment}
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                    className="react-select-container text-sm"
                    classNamePrefix="react-select"
                />
            </div>

            {/* NOM DE LA SALLE */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Nom / Numéro de la salle <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    placeholder="Ex: Bureau 102, Chambre VIP A, Salle d'attente Principale..."
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors"
                    value={payload.name}
                    onChange={(e) => setPayload({ ...payload, name: e.target.value })}
                />
            </div>

            {/* TYPE DE SALLE */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Type d'installation <span className="text-red-500">*</span>
                </label>
                <Select
                    options={typeOptions}
                    value={typeOptions.find(opt => opt.value === payload.type) || null}
                    onChange={(selected) => {
                        const newType = selected ? (selected.value as any) : '';
                        setPayload({
                            ...payload,
                            type: newType,
                            // Si ce n'est pas une chambre (WARD), on force la catégorie à null
                            room_category_id: newType === FacilityRoomType.WARD ? payload.room_category_id : null
                        });
                    }}
                    placeholder="Sélectionner le type..."
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                    className="react-select-container text-sm"
                    classNamePrefix="react-select"
                />
            </div>

            {/* CHOIX DE LA CATÉGORIE (Conditionnel : Uniquement pour les chambres WARD) */}
            {payload.type === FacilityRoomType.WARD && (
                <div className="animate-fadeIn">
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Catégorie de tarification <span className="text-xs text-gray-400 font-normal">(Optionnel)</span>
                    </label>
                    <Select
                        options={categoryOptions}
                        value={categoryOptions.find(opt => opt.value === payload.room_category_id) || null}
                        onChange={(selected) => setPayload({
                            ...payload,
                            room_category_id: selected ? selected.value : null
                        })}
                        placeholder="Choisir une grille tarifaire..."
                        isClearable
                        menuPortalTarget={document.body}
                        styles={selectStyles}
                        className="react-select-container text-sm"
                        classNamePrefix="react-select"
                    />
                    <p className="text-xs text-gray-400 mt-1">Permet d'appliquer automatiquement le tarif de la nuitée lors d'une hospitalisation.</p>
                </div>
            )}

        </div>
    );
};