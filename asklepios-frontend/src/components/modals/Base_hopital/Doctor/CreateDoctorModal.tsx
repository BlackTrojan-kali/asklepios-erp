import React, { useState } from 'react';
import useDoctorStore from '../../../../functions/base_hospital/useDoctorStore'; // Ajuste le chemin
import { DoctorForm } from './DoctorForm';
import type { DoctorPayload } from '../../../../types/DoctorTypes';
import type { CenterDto, DepartmentDto } from '../../../../types/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    centers: CenterDto[];
    departments: DepartmentDto[];
}

export const CreateDoctorModal: React.FC<Props> = ({ isOpen, onClose, centers, departments }) => {
    const { createDoctor, actionLoading } = useDoctorStore();
    
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

    const isFormValid = payload.first_name && payload.phone && payload.email && payload.password && payload.speciality && payload.center_id !== '';

    const handleSubmit = async () => {
        if (!isFormValid) return;
        
        const success = await createDoctor(payload);
        if (success) {
            setPayload({ first_name: '', last_name: '', phone: '', email: '', password: '', speciality: '', specifications: '', center_id: '', department_id: null });
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
                    setPayload={setPayload} 
                    centers={centers}
                    departments={departments}
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