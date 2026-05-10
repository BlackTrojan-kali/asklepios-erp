import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import FormInput from '../../ui/form/FormInput';
import FormButton from '../../ui/form/FormButton';
import type { CountryDto } from '../../../types/types';
import useCountryStore from '../../../functions/country/useCountryStore'; 
import toast from 'react-hot-toast';

interface CountryModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Si null = Création. Si fourni = Modification
    countryToEdit?: CountryDto | null; 
}

const CountryModal = ({ isOpen, onClose, countryToEdit }: CountryModalProps) => {
    // Import des fonctions de ton store
    const { createCountry, updateCountry } = useCountryStore();

    // États du formulaire
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [currency, setCurrency] = useState('');
    const [loading, setLoading] = useState(false);

    // Effet magique : se déclenche quand la modale s'ouvre ou que countryToEdit change
    useEffect(() => {
        if (isOpen) {
            if (countryToEdit) {
                // Mode Édition : On pré-remplit
                setName(countryToEdit.name);
                setCode(countryToEdit.code);
                setCurrency(countryToEdit.currency);
            } else {
                // Mode Création : On vide tout
                setName('');
                setCode('');
                setCurrency('');
            }
        }
    }, [isOpen, countryToEdit]);

    // Fonction de soumission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Petite validation front-end
        if (!name || !code || !currency) {
            toast.error("Veuillez remplir tous les champs");
            return;
        }

        setLoading(true);

        const payload: CountryDto = { name, code, currency };
        let success = false;

        if (countryToEdit && countryToEdit.id) {
            // Modification
            const res = await updateCountry(countryToEdit.id, payload);
            if (res) success = true;
        } else {
            // Création
            const res = await createCountry(payload);
            if (res) success = true;
        }

        setLoading(false);

        // Si tout s'est bien passé, on ferme la modale
        if (success) {
            onClose();
        }
    };

    // Si la modale est fermée, on ne renvoie rien (elle n'existe pas dans le DOM)
    if (!isOpen) return null;

    const isEditMode = !!countryToEdit;

    return (
        // L'Overlay (fond noir transparent)
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity">
            
            {/* La Boîte Modale */}
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transform transition-all">
                
                {/* En-tête de la modale */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-bold text-[#003366] dark:text-white">
                        {isEditMode ? "Modifier le pays" : "Ajouter un pays"}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded-md text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Corps de la modale (Formulaire) */}
                <form onSubmit={handleSubmit} className="p-4 space-y-2">
                    <FormInput 
                        label="Nom du pays" 
                        type="text" 
                        value={name} 
                        setValue={setName} 
                        placeholder="Ex: Cameroun" 
                        error={null}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput 
                            label="Code ISO" 
                            type="text" 
                            value={code} 
                            setValue={setCode} 
                            placeholder="Ex: CMR" 
                            error={null}
                        />
                        <FormInput 
                            label="Devise" 
                            type="text" 
                            value={currency} 
                            setValue={setCurrency} 
                            placeholder="Ex: XAF" 
                            error={null}
                        />
                    </div>

                    {/* Zone des boutons */}
                    <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
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

export default CountryModal;