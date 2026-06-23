import React, { useState, useEffect } from 'react';
import useDoctorStore from '../../../../functions/base_hospital/useDoctorStore'; // Ajuste le chemin
import { DoctorForm } from './DoctorForm';
import type { DoctorDto, DoctorPayload } from '../../../../types/DoctorTypes';
import type { CenterDto, DepartmentDto } from '../../../../types/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    doctor: DoctorDto | null;
    centers: CenterDto[];
    departments: DepartmentDto[];
}

export const UpdateDoctorModal: React.FC<Props> = ({ isOpen, onClose, doctor, centers, departments }) => {
    const { updateDoctor, actionLoading } = useDoctorStore();
    
    const [payload, setPayload] = useState<DoctorPayload>({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        password: '', // Toujours vide au montage
        speciality: '',
        specifications: '',
        center_id: '',
        department_id: null
    });

    // Remplissage du formulaire avec les données de l'API
    useEffect(() => {
        if (doctor && doctor.user) {
            setPayload({
                first_name: doctor.user.first_name,
                last_name: doctor.user.last_name || '',
                phone: doctor.user.phone,
                email: doctor.user.email,
                password: '', 
                speciality: doctor.speciality,
                specifications: doctor.specifications || '',
                center_id: doctor.center_id,
                department_id: doctor.department_id || null
            });
        }
    }, [doctor]);

    // Le mot de passe n'est pas requis pour la validation de la mise à jour
    const isFormValid = payload.first_name && payload.phone && payload.email && payload.speciality && payload.center_id !== '';

    const handleSubmit = async () => {
        if (!doctor || !isFormValid) return;

        const success = await updateDoctor(doctor.id, payload);
        if (success) onClose();
    };

    if (!isOpen || !doctor) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl p-6 shadow-xl border border-transparent dark:border-gray-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Modifier le profil</h2>
                </div>
                
                <DoctorForm 
                    payload={payload} 
                    setPayload={setPayload} 
                    centers={centers}
                    departments={departments}
                    isUpdate={true} 
                />

                <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors font-medium"
                    >
                        Fermer
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading || !isFormValid}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm font-medium"
                    >
                        {actionLoading ? "Sauvegarde..." : "Enregistrer les modifications"}
                    </button>
                </div>
            </div>
        </div>
    );
};