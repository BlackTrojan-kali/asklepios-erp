import React from 'react';
import Select from 'react-select';
import type { BatchPayload, ArticleDto } from '../../../../types/PharmTypes';

interface Props {
    payload: BatchPayload;
    setPayload: (p: BatchPayload) => void;
    articles: ArticleDto[];
}

export const BatchForm: React.FC<Props> = ({ payload, setPayload, articles }) => {

    // Formatage des articles pour react-select (Affichage du nom + code-barres si dispo)
    const articleOptions = articles.map(a => ({ 
        value: a.id, 
        label: a.barcode ? `${a.name} (Code: ${a.barcode})` : a.name 
    }));

    const selectStyles = {
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
    };

    return (
        <div className="space-y-4">
            
            {/* ARTICLE ASSOCIÉ */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Article concerné <span className="text-red-500">*</span>
                </label>
                <Select 
                    options={articleOptions}
                    value={articleOptions.find(opt => opt.value === payload.article_id) || null}
                    onChange={(selected) => setPayload({ 
                        ...payload, 
                        article_id: selected ? selected.value : "" 
                    })}
                    placeholder="Rechercher un article..."
                    isClearable
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                    className="react-select-container text-sm"
                    classNamePrefix="react-select"
                />
            </div>

            {/* NUMÉRO DE LOT */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Numéro de Lot (Batch Number) <span className="text-red-500">*</span>
                </label>
                <input 
                    type="text" 
                    placeholder="Ex: LOT-2026-X1"
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors uppercase" 
                    value={payload.batch_number}
                    onChange={(e) => setPayload({...payload, batch_number: e.target.value})} 
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DATE D'EXPIRATION */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Date de péremption <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="date" 
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.expire_date}
                        onChange={(e) => setPayload({...payload, expire_date: e.target.value})} 
                    />
                </div>

                {/* PRIX D'ACHAT */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Prix d'achat unitaire <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        placeholder="Ex: 1500"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.purchase_price}
                        onChange={(e) => setPayload({...payload, purchase_price: e.target.value === "" ? "" : Number(e.target.value)})} 
                    />
                </div>
            </div>

        </div>
    );
};