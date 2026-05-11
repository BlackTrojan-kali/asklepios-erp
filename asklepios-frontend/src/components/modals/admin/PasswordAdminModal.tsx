import React, { useState } from 'react';
import { X, KeyRound } from 'lucide-react';
import FormInput from '../../ui/form/FormInput';
import FormButton from '../../ui/form/FormButton';
import useAdminStore from '../../../functions/admin/useAdminStore';
import toast from 'react-hot-toast';

interface PasswordAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    adminId: number | null; 
    adminName: string; // Pour afficher "Nouveau mot de passe pour Jean Dupont"
}

const PasswordAdminModal = ({ isOpen, onClose, adminId, adminName }: PasswordAdminModalProps) => {
    const { updatePassword } = useAdminStore();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!adminId) return;

        if (password.length < 8) {
            toast.error("Le mot de passe doit contenir au moins 8 caractères");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Les mots de passe ne correspondent pas");
            return;
        }

        setLoading(true);

        const success = await updatePassword(adminId, password);

        setLoading(false);

        if (success) {
            // On vide les champs pour la prochaine ouverture
            setPassword('');
            setConfirmPassword('');
            onClose();
        }
    };

    if (!isOpen || !adminId) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transform transition-all">
                
                {/* En-tête avec un design légèrement différent pour montrer l'aspect "Sécurité" */}
                <div className="flex justify-between items-center p-4 border-b border-orange-100 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10">
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                        <KeyRound size={20} />
                        <h3 className="text-lg font-bold">Sécurité du compte</h3>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded-md text-gray-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 pb-0 text-sm text-gray-600 dark:text-gray-400">
                    Définir un nouveau mot de passe pour <strong>{adminName}</strong>.
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                    
                    <FormInput 
                        label="Nouveau mot de passe" 
                        type="password" 
                        value={password} 
                        setValue={setPassword} 
                        placeholder="Minimum 8 caractères" 
                        error={null}
                    />
                    
                    <FormInput 
                        label="Confirmer le mot de passe" 
                        type="password" 
                        value={confirmPassword} 
                        setValue={setConfirmPassword} 
                        placeholder="Répétez le mot de passe" 
                        error={null}
                    />

                    {/* Boutons */}
                    <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
                        <FormButton 
                            label="Annuler" 
                            type="button"
                            onClick={onClose}
                            classname="bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                        />
                        <FormButton 
                            label="Changer le mot de passe" 
                            type="submit"
                            loading={loading}
                            classname="bg-orange-500 hover:bg-orange-600 text-white min-w-[120px]"
                        />
                    </div>
                </form>

            </div>
        </div>
    );
};

export default PasswordAdminModal;