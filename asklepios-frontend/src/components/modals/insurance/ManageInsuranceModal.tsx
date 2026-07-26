import React, { useState, useEffect } from 'react';
import { ShieldPlus, ShieldCheck, X, Loader2, Phone, Mail, Building } from 'lucide-react';
import useInsuranceStore from '../../../functions/insurance/useInsuranceStore'; // Ajustez le chemin
import type { InsuranceCompanyDto } from '../../../types/InsuranceTypes'; // Ajustez le chemin

interface Props {
    isOpen: boolean;
    onClose: () => void;
    insuranceToEdit: InsuranceCompanyDto | null; // null = Création, objet = Modification
    currentHospitalId: number; // L'ID de l'hôpital de l'admin
    AutoRefreshPage: () => void;
}

export const ManageInsuranceModal: React.FC<Props> = ({ 
    isOpen, 
    onClose, 
    insuranceToEdit, 
    currentHospitalId, 
    AutoRefreshPage 
}) => {
    const { createInsurance, updateInsurance, actionLoading } = useInsuranceStore();

    // États du formulaire
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [contact, setContact] = useState('');

    const isEditMode = !!insuranceToEdit;

    // Remplissage des champs si on est en mode édition
    useEffect(() => {
        if (isOpen) {
            if (isEditMode && insuranceToEdit) {
                setName(insuranceToEdit.name || '');
                setEmail(insuranceToEdit.email || '');
                setContact(insuranceToEdit.contact || '');
            } else {
                // Mode création : on vide le formulaire
                setName('');
                setEmail('');
                setContact('');
            }
        }
    }, [isOpen, insuranceToEdit, isEditMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) return;

        const payload = {
            hospital_id: currentHospitalId,
            name: name.trim(),
            email: email.trim() || null, // Convertir chaîne vide en null
            contact: contact.trim() || null,
        };

        let success = false;
        
        if (isEditMode && insuranceToEdit) {
            // En modification, on peut exclure hospital_id si le backend ne le requiert pas
            success = await updateInsurance(insuranceToEdit.id, payload);
        } else {
            success = await createInsurance(payload);
        }

        if (success) {
            AutoRefreshPage();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-transparent dark:border-gray-800 flex flex-col max-h-[90vh]">
                
                {/* EN-TÊTE */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${isEditMode ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                            {isEditMode ? <ShieldCheck size={24} /> : <ShieldPlus size={24} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                {isEditMode ? 'Modifier l\'assurance' : 'Nouvelle Assurance'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {isEditMode ? 'Mettez à jour les informations de contact.' : 'Ajoutez une compagnie partenaire à votre hôpital.'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* CORPS DU FORMULAIRE */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                            <Building size={16} className="text-blue-500"/> Nom de la compagnie <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            placeholder="Ex: Sanlam, AXA, Ascoma..."
                            className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-blue-500 outline-none text-slate-800 dark:text-white" 
                            required 
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                <Phone size={14} className="text-gray-400"/> Numéro de téléphone
                            </label>
                            <input 
                                type="text" 
                                value={contact} 
                                onChange={e => setContact(e.target.value)} 
                                placeholder="Ex: +237 600 000 000"
                                className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-blue-500 outline-none text-slate-800 dark:text-white" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                <Mail size={14} className="text-gray-400"/> Adresse Email
                            </label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                placeholder="contact@assurance.com"
                                className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-blue-500 outline-none text-slate-800 dark:text-white" 
                            />
                        </div>
                    </div>

                </form>

                {/* PIED DE MODALE */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-800 shrink-0 bg-slate-50 dark:bg-gray-900/50">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading || !name.trim()}
                        className={`px-6 py-2.5 text-white rounded-xl font-bold flex items-center gap-2 shadow-md transition-colors disabled:opacity-50 ${isEditMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {actionLoading ? (
                            <><Loader2 size={18} className="animate-spin" /> Enregistrement...</>
                        ) : (
                            isEditMode ? "Enregistrer les modifications" : "Ajouter l'assurance"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};