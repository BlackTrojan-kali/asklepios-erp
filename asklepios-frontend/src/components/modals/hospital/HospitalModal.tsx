import React, { useEffect, useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import FormInput from '../../ui/form/FormInput';
import FormButton from '../../ui/form/FormButton';
import type { HospitalDto } from '../../../types/types';
import useHospitalStore from '../../../functions/hospital/useHospitalStore';
import toast from 'react-hot-toast';

interface HospitalModalProps {
    isOpen: boolean;
    onClose: () => void;
    hospitalToEdit?: HospitalDto | null; 
}

const HospitalModal = ({ isOpen, onClose, hospitalToEdit }: HospitalModalProps) => {
    const { createHospital, updateHospital } = useHospitalStore();

    // États du formulaire
    const [name, setName] = useState('');
    const [niu, setNiu] = useState('');
    
    // État spécifique pour le fichier image
    const [logoFile, setLogoFile] = useState<File | null>(null);
    
    // État pour afficher la prévisualisation de l'image
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    
    const [loading, setLoading] = useState(false);
    
    // Référence vers l'input de type "file" caché
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialisation lors de l'ouverture
    useEffect(() => {
        if (isOpen) {
            if (hospitalToEdit) {
                setName(hospitalToEdit.name);
                setNiu(hospitalToEdit.niu || '');
                
                // Si on a une URL de logo existante, on l'utilise pour la prévisualisation
                // Assure-toi que ton backend stocke/renvoie l'URL complète, ou ajoute ton domaine ici
                if (hospitalToEdit.logo_url) {
                    setPreviewUrl(`http://localhost:8000/storage/${hospitalToEdit.logo_url}`);
                } else {
                    setPreviewUrl(null);
                }
            } else {
                // Mode Création : On vide tout
                setName('');
                setNiu('');
                setLogoFile(null);
                setPreviewUrl(null);
            }
        }
    }, [isOpen, hospitalToEdit]);

    // Gérer la sélection d'une nouvelle image
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Vérification simple du type et de la taille (Optionnel côté front, mais recommandé)
            if (!file.type.startsWith('image/')) {
                toast.error("Veuillez sélectionner une image valide");
                return;
            }
            if (file.size > 2 * 1024 * 1024) { // 2 Mo max
                toast.error("L'image ne doit pas dépasser 2 Mo");
                return;
            }

            setLogoFile(file);
            
            // Créer une URL locale temporaire pour prévisualiser l'image sélectionnée
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    // Déclencher le clic sur l'input file caché
    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    // Soumission du formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name) {
            toast.error("Le nom de l'hôpital est requis");
            return;
        }
      

        setLoading(true);

        const payload: HospitalDto = { 
            name, 
            niu,
            logo: logoFile // On passe le fichier réel au payload
        };
        let success = false;

        if (hospitalToEdit && hospitalToEdit.id) {
            const res = await updateHospital(hospitalToEdit.id, payload);
            if (res) success = true;
        } else {
            const res = await createHospital(payload);
            if (res) success = true;
        }

        setLoading(false);

        if (success) {
            // Nettoyage de l'URL objet pour éviter les fuites de mémoire
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
            onClose();
        }
    };

    if (!isOpen) return null;

    const isEditMode = !!hospitalToEdit;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity">
            
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transform transition-all">
                
                {/* En-tête */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-bold text-[#003366] dark:text-white">
                        {isEditMode ? "Modifier l'hôpital" : "Ajouter un hôpital"}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded-md text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    
                    {/* Zone de prévisualisation et d'upload du logo */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 w-full text-left pl-2">
                            Logo de l'hôpital (Optionnel)
                        </label>
                        
                        <div 
                            onClick={handleImageClick}
                            className="relative group w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer overflow-hidden bg-slate-50 dark:bg-gray-800 transition-colors hover:border-[#00a896] dark:hover:border-teal-500"
                        >
                            {previewUrl ? (
                                // Prévisualisation de l'image
                                <>
                                    <img 
                                        src={previewUrl} 
                                        alt="Prévisualisation du logo" 
                                        className="w-full h-full object-contain p-2"
                                    />
                                    {/* Overlay d'édition au survol */}
                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload size={24} className="text-white mb-1" />
                                        <span className="text-xs text-white font-medium">Changer</span>
                                    </div>
                                </>
                            ) : (
                                // État vide
                                <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 group-hover:text-[#00a896] dark:group-hover:text-teal-500 transition-colors">
                                    <ImageIcon size={32} className="mb-2" />
                                    <span className="text-xs font-medium">Ajouter un logo</span>
                                </div>
                            )}
                        </div>
                        
                        {/* L'input file réel, caché à l'utilisateur */}
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                            className="hidden"
                        />
                        <span className="text-[10px] text-gray-400 mt-2">Format: JPG, PNG, SVG (Max: 2Mo)</span>
                    </div>

                    {/* Champs textuels */}
                    <FormInput 
                        label="Nom de l'hôpital" 
                        type="text" 
                        value={name} 
                        setValue={setName} 
                        placeholder="Ex: Hôpital Général..." 
                        error={null}
                    />
                    
                    <FormInput 
                        label="NIU (Numéro d'Identification Unique)" 
                        type="text" 
                        value={niu} 
                        setValue={setNiu} 
                        placeholder="Ex: M1234567890" 
                        error={null}
                    />

                    {/* Boutons */}
                    <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                        <FormButton 
                            label="Annuler" 
                            type="button"
                            onClick={onClose}
                            classname="bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                        />
                        <FormButton 
                            label={isEditMode ? "Mettre à jour" : "Enregistrer"} 
                            type="submit"
                            loading={loading}
                            classname="bg-[#00a896] hover:bg-[#008f7e] text-white min-w-[120px]"
                        />
                    </div>
                </form>

            </div>
        </div>
    );
};

export default HospitalModal;