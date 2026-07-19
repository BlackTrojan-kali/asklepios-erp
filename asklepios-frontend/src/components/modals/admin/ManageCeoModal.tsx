import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { UserPlus, UserCog, X, Loader2, Building2, Phone, Mail, Lock } from 'lucide-react';
import useCeoStore from '../../../functions/admin/useCeoStore'; // Ajustez le chemin
import type { ProfileCeoDto } from '../../../types/CeoTypes'; // Ajustez le chemin

interface Props {
    isOpen: boolean;
    onClose: () => void;
    ceoToEdit: ProfileCeoDto | null; // Si null = Création, sinon = Modification
    hospitals: any[]; // Liste des hôpitaux pour le menu déroulant
    AutoRefreshPage: () => void;
}

export const ManageCeoModal: React.FC<Props> = ({ 
    isOpen, 
    onClose, 
    ceoToEdit, 
    hospitals, 
    AutoRefreshPage 
}) => {
    const { createCeo, updateCeo, actionLoading } = useCeoStore();

    // États du formulaire
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [type, setType] = useState<'ceo' | 'dsi' | 'daf' | ''>('');
    const [hospitalId, setHospitalId] = useState<number | ''>('');

    // Remplissage des champs si on est en mode édition
    useEffect(() => {
        if (isOpen) {
            if (ceoToEdit && ceoToEdit.user) {
                setFirstName(ceoToEdit.user.first_name || '');
                setLastName(ceoToEdit.user.last_name || '');
                setPhone(ceoToEdit.user.phone?.toString() || '');
                setEmail(ceoToEdit.user.email || '');
                setType(ceoToEdit.type || '');
                setHospitalId(ceoToEdit.hospital_id || '');
                setPassword(''); // On ne pré-remplit jamais le mot de passe
            } else {
                // Mode création : on vide tout
                setFirstName('');
                setLastName('');
                setPhone('');
                setEmail('');
                setPassword('');
                setType('');
                setHospitalId('');
            }
        }
    }, [isOpen, ceoToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!firstName || !phone || !email || !type || !hospitalId) return;
        // Le mot de passe est obligatoire en création, optionnel en édition
        if (!ceoToEdit && !password) return;

        const payload: any = {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            email: email,
            type: type,
            hospital_id: hospitalId,
        };

        if (password) {
            payload.password = password;
        }

        let success = false;
        if (ceoToEdit) {
            success = await updateCeo(ceoToEdit.id, payload);
        } else {
            success = await createCeo(payload);
        }

        if (success) {
            AutoRefreshPage();
            onClose();
        }
    };

    // Options pour React-Select
    const typeOptions = [
        { value: 'ceo', label: 'Directeur Général (CEO/PDG)' },
        { value: 'dsi', label: "Directeur des Systèmes d'Information (DSI)" },
        { value: 'daf', label: 'Directeur Administratif et Financier (DAF)' }
    ];

    const hospitalOptions = hospitals.map(h => ({
        value: h.id,
        label: h.name
    }));

    // --- STYLES FORCÉS (BLANC & NOIR) POUR REACT-SELECT ---
    const selectStyles = { 
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
        control: (base: any, state: any) => ({
            ...base,
            backgroundColor: '#ffffff',
            borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
            boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
            borderRadius: '0.5rem',
            minHeight: '42px',
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected 
                ? '#eff6ff' 
                : state.isFocused 
                    ? '#f3f4f6' 
                    : '#ffffff',
            color: state.isSelected ? '#2563eb' : '#000000',
            cursor: 'pointer',
        }),
        singleValue: (base: any) => ({ ...base, color: '#000000' }),
        input: (base: any) => ({ ...base, color: '#000000' }),
        placeholder: (base: any) => ({ ...base, color: '#6b7280' }),
        indicatorSeparator: (base: any) => ({ ...base, backgroundColor: '#e5e7eb' }),
    };

    if (!isOpen) return null;

    const isEditMode = !!ceoToEdit;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-transparent dark:border-gray-800 flex flex-col max-h-[90vh]">
                
                {/* EN-TÊTE */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${isEditMode ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                            {isEditMode ? <UserCog size={24} /> : <UserPlus size={24} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                {isEditMode ? 'Modifier le profil direction' : 'Ajouter un membre à la direction'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {isEditMode ? 'Mettez à jour les informations et accès.' : 'Créez un nouveau compte avec privilèges de direction.'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* CORPS DU FORMULAIRE */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    
                    {/* Section Affectation */}
                    <div className="bg-slate-50 dark:bg-gray-800/50 p-4 rounded-xl border border-slate-100 dark:border-gray-700/50 space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Building2 size={16} className="text-blue-500" /> Affectation & Rôle
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                                    Hôpital rattaché <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    options={hospitalOptions}
                                    value={hospitalOptions.find(opt => opt.value === hospitalId) || null}
                                    onChange={(opt) => setHospitalId(opt ? opt.value : '')}
                                    placeholder="Choisir l'hôpital..."
                                    menuPortalTarget={document.body}
                                    styles={selectStyles}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                                    Fonction (Type) <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    options={typeOptions}
                                    value={typeOptions.find(opt => opt.value === type) || null}
                                    onChange={(opt) => setType(opt ? (opt.value as any) : '')}
                                    placeholder="Choisir la fonction..."
                                    menuPortalTarget={document.body}
                                    styles={selectStyles}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section Informations Personnelles */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Informations Personnelles</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Prénom <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    value={firstName} 
                                    onChange={e => setFirstName(e.target.value)} 
                                    className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-blue-500 outline-none text-slate-800 dark:text-white" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Nom</label>
                                <input 
                                    type="text" 
                                    value={lastName} 
                                    onChange={e => setLastName(e.target.value)} 
                                    className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-blue-500 outline-none text-slate-800 dark:text-white" 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                    <Phone size={14} className="text-gray-400"/> Téléphone <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="number" 
                                    value={phone} 
                                    onChange={e => setPhone(e.target.value)} 
                                    className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-blue-500 outline-none text-slate-800 dark:text-white" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                    <Mail size={14} className="text-gray-400"/> Adresse Email <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-blue-500 outline-none text-slate-800 dark:text-white" 
                                    required 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                <Lock size={14} className="text-gray-400"/> Mot de passe {isEditMode ? '(Optionnel)' : <span className="text-red-500">*</span>}
                            </label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                placeholder={isEditMode ? "Laissez vide pour ne pas modifier" : "Créer un mot de passe (min. 8 caractères)"}
                                className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-blue-500 outline-none text-slate-800 dark:text-white" 
                                required={!isEditMode}
                                minLength={8}
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
                        disabled={actionLoading || !firstName || !phone || !email || !type || !hospitalId || (!isEditMode && !password)}
                        className={`px-6 py-2.5 text-white rounded-xl font-bold flex items-center gap-2 shadow-md transition-colors disabled:opacity-50 ${isEditMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {actionLoading ? (
                            <><Loader2 size={18} className="animate-spin" /> Traitement...</>
                        ) : (
                            isEditMode ? "Sauvegarder les modifications" : "Créer le profil"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};