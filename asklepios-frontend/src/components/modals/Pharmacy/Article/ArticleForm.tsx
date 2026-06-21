import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Image as ImageIcon, UploadCloud, X } from 'lucide-react';
import type { ArticlePayload, ArticleCategoryDto } from '../../../../types/PharmTypes';

interface Props {
    payload: ArticlePayload;
    setPayload: (p: ArticlePayload) => void;
    categories: ArticleCategoryDto[];
    existingImageUrl?: string | null;
}

export const ArticleForm: React.FC<Props> = ({ payload, setPayload, categories, existingImageUrl }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl || null);

    // Gestion de la prévisualisation de l'image
    useEffect(() => {
        if (payload.image instanceof File) {
            const objectUrl = URL.createObjectURL(payload.image);
            setPreviewUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl); 
        } else if (payload.image === null && existingImageUrl) {
            setPreviewUrl(existingImageUrl);
        } else {
            setPreviewUrl(null);
        }
    }, [payload.image, existingImageUrl]);

    const categoryOptions = categories.map(c => ({ 
        value: c.id, 
        label: c.parentCategory ? `${c.parentCategory.name} > ${c.name}` : c.name 
    }));

    const selectStyles = {
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
    };

    return (
        <div className="space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NOM DE L'ARTICLE */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Nom de l'article <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        placeholder="Ex: Paracétamol 500mg, Seringue 5ml..."
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.name}
                        onChange={(e) => setPayload({...payload, name: e.target.value})} 
                    />
                </div>

                {/* CATÉGORIE */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Catégorie <span className="text-red-500">*</span>
                    </label>
                    <Select 
                        options={categoryOptions}
                        value={categoryOptions.find(opt => opt.value === payload.category_id) || null}
                        onChange={(selected) => setPayload({ 
                            ...payload, 
                            category_id: selected ? selected.value : "" 
                        })}
                        placeholder="Sélectionner une catégorie..."
                        isClearable
                        menuPortalTarget={document.body}
                        styles={selectStyles}
                        className="react-select-container text-sm"
                        classNamePrefix="react-select"
                    />
                </div>

                {/* CODE BARRES */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Code-barres / SKU
                    </label>
                    <input 
                        type="text" 
                        placeholder="Scan ou saisie manuelle..."
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.barcode}
                        onChange={(e) => setPayload({...payload, barcode: e.target.value})} 
                    />
                </div>

                {/* SEUIL D'ALERTE */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                        Seuil d'alerte global (Qté min)
                    </label>
                    <input 
                        type="number" 
                        min="0"
                        placeholder="Ex: 10"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors" 
                        value={payload.global_min_qty}
                        onChange={(e) => setPayload({...payload, global_min_qty: e.target.value === "" ? "" : Number(e.target.value)})} 
                    />
                </div>

                {/* GESTION DES LOTS */}
                <div className="md:col-span-2 p-3 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md flex items-start gap-3">
                    <div className="pt-0.5">
                        <input 
                            type="checkbox" 
                            id="track_batches"
                            checked={payload.track_batches}
                            onChange={(e) => setPayload({...payload, track_batches: e.target.checked})}
                            className="w-5 h-5 text-[#00a896] bg-white border-gray-300 rounded focus:ring-[#00a896] dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <div>
                        <label htmlFor="track_batches" className="text-sm font-bold text-slate-800 dark:text-white cursor-pointer block">
                            Gérer les lots et dates de péremption pour cet article
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Laissez coché pour les médicaments. Décochez pour le matériel générique (biberons, brosses...) qui ne nécessite pas de suivi strict. Un lot "STANDARD" infini sera créé.
                        </p>
                    </div>
                </div>
                
                {/* EST PRESCRIT (Correction du texte) */}
                <div className="md:col-span-2 p-3 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md flex items-start gap-3">
                    <div className="pt-0.5">
                        <input 
                            type="checkbox" 
                            id="is_prescripted"
                            checked={payload.is_prescripted}
                            onChange={(e) => setPayload({...payload, is_prescripted: e.target.checked})}
                            className="w-5 h-5 text-[#00a896] bg-white border-gray-300 rounded focus:ring-[#00a896] dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <div>
                        <label htmlFor="is_prescripted" className="text-sm font-bold text-slate-800 dark:text-white cursor-pointer block">
                            Soumis à prescription médicale (Ordonnance obligatoire)
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Cochez cette case si ce produit exige une ordonnance. Une alerte sera affichée pour le pharmacien lors du passage en caisse.
                        </p>
                    </div>
                </div>

            </div>

            {/* UPLOAD D'IMAGE */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    Image de l'article (Optionnel)
                </label>
                
                <div className="flex items-center gap-4">
                    <div className="w-24 h-24 shrink-0 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 overflow-hidden relative">
                        {previewUrl ? (
                            <>
                                <img src={previewUrl} alt="Aperçu" className="w-full h-full object-cover" />
                                {payload.image && (
                                    <button 
                                        type="button"
                                        onClick={() => setPayload({...payload, image: null})}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </>
                        ) : (
                            <ImageIcon className="text-gray-400" size={24} />
                        )}
                    </div>

                    <div className="flex-1">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <UploadCloud size={16} className="text-[#00a896]" />
                            <span>Choisir une image (Max 2MB)</span>
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/jpeg, image/png, image/jpg, image/svg+xml"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        setPayload({...payload, image: e.target.files[0]});
                                    }
                                }}
                            />
                        </label>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Formats acceptés : JPG, PNG, SVG.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};