import React, { useState, useEffect } from 'react';
import { 
    X, 
    Save, 
    Loader2, 
    FileText,
    CircleDollarSign
} from 'lucide-react';

// --- STORES & TYPES ---
import useMedicalActStore from '../../../../functions/base_hospital/useMedicalActStore';
import type { MedicalActDto, MedicalActPayload } from '../../../../types/MedicalActCatalogTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    departmentId: number;      // L'ID du département actuel
    currentHospitalId: number; // L'ID de l'hôpital actuel (requis par l'API)
    actToEdit?: MedicalActDto | null; // Null = Création, Objet = Modification
}

const defaultFormState = {
    name: '',
    base_price: '' // En chaîne de caractères pour faciliter la saisie dans l'input
};

export const MedicalActModal: React.FC<Props> = ({ 
    isOpen, 
    onClose, 
    departmentId, 
    currentHospitalId,
    actToEdit 
}) => {
    const { createMedicalAct, updateMedicalAct, actionLoading } = useMedicalActStore();
    
    // On utilise un état local simple pour le formulaire
    const [formData, setFormData] = useState(defaultFormState);

    // --- INITIALISATION DU FORMULAIRE ---
    useEffect(() => {
        if (isOpen) {
            if (actToEdit) {
                // Mode Édition : On pré-remplit les champs
                setFormData({
                    name: actToEdit.name,
                    base_price: actToEdit.base_price.toString()
                });
            } else {
                // Mode Création : On remet à zéro
                setFormData(defaultFormState);
            }
        }
    }, [isOpen, actToEdit]);

    // --- GESTION DES CHANGEMENTS ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- SOUMISSION ---
    const handleSubmit = async () => {
        if (!departmentId || !currentHospitalId || !formData.name || !formData.base_price) return;

        const payload: MedicalActPayload = {
            hospital_id: currentHospitalId,
            name: formData.name.trim(),
            base_price: parseFloat(formData.base_price)
        };

        let success = false;

        if (actToEdit) {
            success = await updateMedicalAct(departmentId, actToEdit.id, payload);
        } else {
            success = await createMedicalAct(departmentId, payload);
        }

        if (success) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const isEditMode = !!actToEdit;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl border border-transparent dark:border-gray-800">
                
                {/* --- HEADER --- */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0 bg-white dark:bg-gray-900 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                {isEditMode ? 'Modifier l\'acte médical' : 'Nouvel acte médical'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isEditMode ? 'Mise à jour du tarif ou de l\'intitulé' : 'Ajouter une prestation au catalogue'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* --- BODY (FORMULAIRE) --- */}
                <div className="p-6 space-y-5">
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            Intitulé de l'acte <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            placeholder="Ex: Consultation Cardiologie, Échographie pelvienne..." 
                            className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-white transition-colors" 
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            Prix de base (FCFA) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <CircleDollarSign size={18} className="text-gray-400" />
                            </div>
                            <input 
                                type="number" 
                                name="base_price" 
                                min="0"
                                step="100"
                                value={formData.base_price} 
                                onChange={handleChange} 
                                placeholder="Ex: 15000" 
                                className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-white font-semibold transition-colors" 
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">
                            Ce montant servira de base lors de la facturation au patient.
                        </p>
                    </div>

                </div>

                {/* --- FOOTER --- */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-slate-50 dark:bg-gray-800/50 rounded-b-2xl">
                    <button 
                        onClick={onClose} 
                        disabled={actionLoading}
                        className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading || !formData.name || !formData.base_price}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {actionLoading ? (
                            <><Loader2 size={18} className="animate-spin" /> Enregistrement...</>
                        ) : (
                            <><Save size={18} /> {isEditMode ? 'Mettre à jour' : 'Ajouter au catalogue'}</>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};