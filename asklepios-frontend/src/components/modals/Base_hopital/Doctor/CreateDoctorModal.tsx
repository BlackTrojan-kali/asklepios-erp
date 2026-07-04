import React, { useState, useEffect } from 'react';
import useDoctorStore from '../../../../functions/base_hospital/useDoctorStore'; // Ajuste le chemin
import useDepartmentStore from '../../../../functions/departments/useDepartmentStore'; // 👉 Import du store des départements
import { DoctorForm } from './DoctorForm';
import type { DoctorPayload } from '../../../../types/DoctorTypes';
import type { CenterDto } from '../../../../types/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    centers: CenterDto[];
    // 👉 departments n'est plus passé en props, on le gère en local !
}

export const CreateDoctorModal: React.FC<Props> = ({ isOpen, onClose, centers }) => {
    const { createDoctor, actionLoading } = useDoctorStore();
    
    // 👉 Utilisation du store des départements
    const { departments, getDepartments } = useDepartmentStore();
    
    const [payload, setPayload] = useState<DoctorPayload>({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        password: '',
        speciality: '',
        specifications: '',
        center_id: '',
        department_id: null
    });

    // 👉 NOUVEAU : Récupération dynamique des départements selon le centre sélectionné
    useEffect(() => {
        if (payload.center_id) {
            getDepartments(Number(payload.center_id));
        }
    }, [payload.center_id, getDepartments]);

    const isFormValid = payload.first_name && payload.phone && payload.email && payload.password && payload.speciality && payload.center_id !== '';

    const handleSubmit = async () => {
        if (!isFormValid) return;
        
        const success = await createDoctor(payload);
        if (success) {
            setPayload({ 
                first_name: '', last_name: '', phone: '', email: '', password: '', 
                speciality: '', specifications: '', center_id: '', department_id: null 
            });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl p-6 shadow-xl border border-transparent dark:border-gray-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <h2 className="text-xl font-bold mb-5 text-slate-800 dark:text-white">Nouveau Profil Médecin</h2>
                
                <DoctorForm 
                    payload={payload} 
                    setPayload={(newPayload) => {
                        // 👉 SÉCURITÉ : Si on change de centre, on vide le département précédent
                        if (typeof newPayload === 'function') {
                            setPayload(prev => {
                                const next = newPayload(prev);
                                if (prev.center_id !== next.center_id) {
                                    return { ...next, department_id: null };
                                }
                                return next;
                            });
                        } else {
                            if (payload.center_id !== newPayload.center_id) {
                                setPayload({ ...newPayload, department_id: null });
                            } else {
                                setPayload(newPayload);
                            }
                        }
                    }} 
                    centers={centers}
                    departments={departments} // 👉 On passe les départements récupérés dynamiquement
                    isUpdate={false}
                />
                
                <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors font-medium"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading || !isFormValid}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm font-medium"
                    >
                        {actionLoading ? "Création..." : "Enregistrer le médecin"}
                    </button>
                </div>
            </div>
        </div>
    );
};