import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import FormInput from '../../ui/form/FormInput';
import FormButton from '../../ui/form/FormButton';
import type { AdminDto, AdminPayload } from '../../../types/types';
import useAdminStore from '../../../functions/admin/useAdminStore';
import useHospitalStore from '../../../functions/hospital/useHospitalStore';
import toast from 'react-hot-toast';

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    adminToEdit?: AdminDto | null; 
}

const AdminModal = ({ isOpen, onClose, adminToEdit }: AdminModalProps) => {
    const { createAdmin, updateAdmin } = useAdminStore();
    const { hospitals, getHospitals } = useHospitalStore();

    // États du formulaire
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [hospitalId, setHospitalId] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);

    // Initialisation lors de l'ouverture
    useEffect(() => {
        if (isOpen) {
            // On charge la liste des hôpitaux pour le menu déroulant (on met perPage à 100 pour tous les avoir)
            getHospitals(1, '', 100);

            if (adminToEdit) {
                setFirstName(adminToEdit.first_name);
                setLastName(adminToEdit.last_name || '');
                setPhone(adminToEdit.phone.toString());
                setEmail(adminToEdit.email);
                // On récupère l'ID de l'hôpital via la relation
                setHospitalId(adminToEdit.profile_admin?.hospital_id || '');
                setPassword(''); // Pas de mot de passe en mode édition
            } else {
                // Mode Création : On vide tout
                setFirstName('');
                setLastName('');
                setPhone('');
                setEmail('');
                setPassword('');
                setHospitalId('');
            }
        }
    }, [isOpen, adminToEdit, getHospitals]);

    // Soumission du formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validations front-end simples
        if (!firstName || !phone || !email || !hospitalId) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        const isEditMode = !!adminToEdit;

        if (!isEditMode && password.length < 8) {
            toast.error("Le mot de passe doit contenir au moins 8 caractères");
            return;
        }

        setLoading(true);

        let success = false;

        if (isEditMode && adminToEdit.id) {
            // --- MODE ÉDITION ---
            const payload: Omit<AdminPayload, 'password'> = { 
                first_name: firstName,
                last_name: lastName,
                phone: phone,
                email: email,
                hospital_id: Number(hospitalId)
            };
            const res = await updateAdmin(adminToEdit.id, payload);
            if (res) success = true;

        } else {
            // --- MODE CRÉATION ---
            const payload: AdminPayload = { 
                first_name: firstName,
                last_name: lastName,
                phone: phone,
                email: email,
                password: password,
                hospital_id: Number(hospitalId)
            };
            const res = await createAdmin(payload);
            if (res) success = true;
        }

        setLoading(false);

        if (success) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const isEditMode = !!adminToEdit;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transform transition-all">
                
                {/* En-tête */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-bold text-[#003366] dark:text-white">
                        {isEditMode ? "Modifier l'administrateur" : "Nouvel administrateur"}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded-md text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput 
                            label="Prénom *" 
                            type="text" 
                            value={firstName} 
                            setValue={setFirstName} 
                            placeholder="Ex: Jean" 
                            error={null}
                        />
                        <FormInput 
                            label="Nom" 
                            type="text" 
                            value={lastName} 
                            setValue={setLastName} 
                            placeholder="Ex: Dupont" 
                            error={null}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput 
                            label="Email *" 
                            type="email" 
                            value={email} 
                            setValue={setEmail} 
                            placeholder="jean@hopital.com" 
                            error={null}
                        />
                        <FormInput 
                            label="Téléphone *" 
                            type="number" 
                            value={phone} 
                            setValue={setPhone} 
                            placeholder="600000000" 
                            error={null}
                        />
                    </div>

                    {/* Sélection de l'hôpital (Design intégré pour correspondre à FormInput) */}
                    <div className="p-2 text-start">
                        <label className="pl-2 text-sm font-medium text-slate-700 dark:text-gray-300">
                            Hôpital d'affectation *
                        </label>
                        <select 
                            value={hospitalId}
                            onChange={(e) => setHospitalId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full p-2.5 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-md outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-gray-100 transition-colors"
                        >
                            <option value="" disabled>-- Sélectionner un hôpital --</option>
                            {hospitals.map(hospital => (
                                <option key={hospital.id} value={hospital.id}>
                                    {hospital.name} {hospital.niu ? `(${hospital.niu})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Champ Mot de passe (Uniquement à la création) */}
                    {!isEditMode && (
                        <FormInput 
                            label="Mot de passe provisoire *" 
                            type="password" 
                            value={password} 
                            setValue={setPassword} 
                            placeholder="Minimum 8 caractères" 
                            error={null}
                        />
                    )}

                    {/* Boutons */}
                    <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
                        <FormButton 
                            label="Annuler" 
                            type="button"
                            onClick={onClose}
                            classname="bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                        />
                        <FormButton 
                            label={isEditMode ? "Mettre à jour" : "Créer l'administrateur"} 
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

export default AdminModal;