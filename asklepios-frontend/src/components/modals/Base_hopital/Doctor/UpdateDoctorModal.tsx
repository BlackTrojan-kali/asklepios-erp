import React, { useState, useEffect } from 'react';
import useDoctorStore from '../../../../functions/base_hospital/useDoctorStore';
import useDepartmentStore from '../../../../functions/departments/useDepartmentStore';
import { DoctorForm } from './DoctorForm';
import type { DoctorDto, DoctorPayload } from '../../../../types/DoctorTypes';
import type { CenterDto, DepartmentDto } from '../../../../types/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    doctor: DoctorDto | null;
    centers: CenterDto[];
    departments?: DepartmentDto[];
    AutoRefreshPage: () => void;
}

export const UpdateDoctorModal: React.FC<Props> = ({ isOpen, onClose, doctor, centers, departments = [], AutoRefreshPage }) => {
    const { updateDoctor, actionLoading } = useDoctorStore();
    const { departments: fetchedDepartments, getDepartments } = useDepartmentStore();
    
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

    // Remplissage du formulaire avec les données du médecin
    useEffect(() => {
        if (doctor && doctor.user) {
            const centerId = doctor.center_id;
            const deptId = doctor.department_id ? Number(doctor.department_id) : (doctor.department?.id ? Number(doctor.department.id) : null);
            
            setPayload({
                first_name: doctor.user.first_name,
                last_name: doctor.user.last_name || '',
                phone: doctor.user.phone,
                email: doctor.user.email,
                password: '', 
                speciality: doctor.speciality,
                specifications: doctor.specifications || '',
                center_id: centerId,
                department_id: deptId
            });

            if (centerId) {
                getDepartments(Number(centerId));
            }
        }
    }, [doctor, getDepartments]);

    // Récupération dynamique des départements si le centre change
    useEffect(() => {
        if (isOpen && payload.center_id) {
            getDepartments(Number(payload.center_id));
        }
    }, [isOpen, payload.center_id, getDepartments]);

    // Fusion des départements récupérés dynamiquement et transmis par props
    const activeDepartments = fetchedDepartments.length > 0 ? fetchedDepartments : departments;

    // Le mot de passe n'est pas requis pour la validation de la mise à jour
    const isFormValid = payload.first_name && payload.phone && payload.email && payload.speciality && payload.center_id !== '';

    const handleSubmit = async () => {
        if (!doctor || !isFormValid) return;

        const success = await updateDoctor(doctor.id, payload);
        if (success) {
            AutoRefreshPage();
            onClose();
        }
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
                    setPayload={(newPayload) => {
                        if (typeof newPayload === 'function') {
                            setPayload(prev => {
                                const next = newPayload(prev);
                                if (prev.center_id !== next.center_id && prev.center_id !== '') {
                                    return { ...next, department_id: null };
                                }
                                return next;
                            });
                        } else {
                            if (payload.center_id !== newPayload.center_id && payload.center_id !== '') {
                                setPayload({ ...newPayload, department_id: null });
                            } else {
                                setPayload(newPayload);
                            }
                        }
                    }} 
                    centers={centers}
                    departments={activeDepartments}
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