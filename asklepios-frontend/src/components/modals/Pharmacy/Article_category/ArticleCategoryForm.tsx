import React from 'react';
import Select from 'react-select';
import type { ArticleCategoryPayload, ArticleCategoryDto }  from '../../../../types/PharmTypes';

interface Props {
    payload: ArticleCategoryPayload;
    setPayload: (p: ArticleCategoryPayload) => void;
    categories: ArticleCategoryDto[];
    currentCategoryId?: number; // Utile en mode édition pour empêcher une catégorie d'être son propre parent
}

export const ArticleCategoryForm: React.FC<Props> = ({ payload, setPayload, categories, currentCategoryId }) => {

    // Formatage des options : on exclut la catégorie en cours de modification de la liste des parents possibles
    const parentOptions = categories
        .filter(c => c.id !== currentCategoryId)
        .map(c => ({ value: c.id, label: c.name }));

    // Styles pour s'assurer que react-select passe par-dessus la modale
    const selectStyles = {
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
    };

    return (
        <div className="space-y-4">
            
            {/* NOM DE LA CATÉGORIE */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Nom de la Catégorie <span className="text-red-500">*</span>
                </label>
                <input 
                    type="text" 
                    placeholder="Ex: Antibiotiques, Antalgiques..."
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors" 
                    value={payload.name}
                    onChange={(e) => setPayload({...payload, name: e.target.value})} 
                />
            </div>

            {/* CATÉGORIE PARENTE (Optionnel) */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Catégorie Parente (Sous-catégorie)
                </label>
                <Select 
                    options={parentOptions}
                    value={parentOptions.find(opt => opt.value === payload.article_category_id) || null}
                    onChange={(selected) => setPayload({ 
                        ...payload, 
                        article_category_id: selected ? selected.value : null 
                    })}
                    placeholder="Aucun parent (Catégorie Principale)"
                    isClearable
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                    className="react-select-container text-sm"
                    classNamePrefix="react-select"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
                    Laissez vide pour créer une catégorie principale.
                </p>
            </div>

            {/* DESCRIPTION */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Description (Optionnelle)
                </label>
                <textarea 
                    rows={3}
                    placeholder="Brève description des articles contenus dans cette catégorie..."
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors resize-none" 
                    value={payload.description}
                    onChange={(e) => setPayload({...payload, description: e.target.value})} 
                ></textarea>
            </div>

        </div>
    );
};