import React, { useEffect, useState } from 'react';
import { X, FileBadge } from 'lucide-react';
import FormInput from '../../ui/form/FormInput';
import FormButton from '../../ui/form/FormButton';
import type { LicenceDto, LicencePayload } from '../../../types/types';
import useLicenceStore from '../../../functions/licence/useLicenceStore';
import toast from 'react-hot-toast';

interface LicenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    licenceToEdit?: LicenceDto | null; 
}

const LicenceModal = ({ isOpen, onClose, licenceToEdit }: LicenceModalProps) => {
    const { createLicence, updateLicence } = useLicenceStore();

    // États du formulaire
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    // Initialisation lors de l'ouverture
    useEffect(() => {
        if (isOpen) {
            if (licenceToEdit) {
                // Mode Édition
                setName(licenceToEdit.name);
                setDescription(licenceToEdit.description || '');
            } else {
                // Mode Création : On vide tout
                setName('');
                setDescription('');
            }
        }
    }, [isOpen, licenceToEdit]);

    // Soumission du formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation front-end
        if (!name.trim()) {
            toast.error("Le nom de la licence est obligatoire");
            return;
        }

        setLoading(true);

        const payload: LicencePayload = { 
            name: name.trim(),
            description: description.trim() || null
        };
        
        let success = false;

        if (licenceToEdit && licenceToEdit.id) {
            // Modification
            const res = await updateLicence(licenceToEdit.id, payload);
            if (res) success = true;
        } else {
            // Création
            const res = await createLicence(payload);
            if (res) success = true;
        }

        setLoading(false);

        if (success) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const isEditMode = !!licenceToEdit;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transform transition-all">
                
                {/* En-tête de la modale */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2 text-[#003366] dark:text-white">
                        <FileBadge size={20} className="text-[#00a896]" />
                        <h3 className="text-lg font-bold">
                            {isEditMode ? "Modifier la licence" : "Nouvelle licence"}
                        </h3>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded-md text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    
                    <FormInput 
                        label="Nom de la licence *" 
                        type="text" 
                        value={name} 
                        setValue={setName} 
                        placeholder="Ex: laboratory, pharmacy..." 
                        error={null}
                    />

                    {/* Zone de texte (Textarea) pour la description avec le design du FormInput */}
                    <div className="p-2 text-start">
                        <label className="pl-2 text-sm font-medium text-slate-700 dark:text-gray-300">
                            Description (Optionnelle)
                        </label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Décrivez l'utilité de cette licence..."
                            rows={3}
                            className="w-full p-2.5 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-md outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-gray-100 transition-colors resize-none"
                        />
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
                        <FormButton 
                            label="Annuler" 
                            type="button"
                            onClick={onClose}
                            classname="bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                        />
                        <FormButton 
                            label={isEditMode ? "Mettre à jour" : "Créer la licence"} 
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

export default LicenceModal;