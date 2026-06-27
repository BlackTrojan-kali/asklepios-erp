import React, { useState, useEffect } from 'react';
import usePatientStore from '../../../../functions/base_hospital/usePatientStore';
import { PatientForm } from './PatientForm';
import type { PatientDto, PatientPayload } from '../../../../types/PatientTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    patient: PatientDto | null;
}

export const UpdatePatientModal: React.FC<Props> = ({ isOpen, onClose, patient }) => {
    const { updatePatient, actionLoading } = usePatientStore();
    
    const [payload, setPayload] = useState<PatientPayload>({
        first_name: '',
        last_name: '',
        bith_date: '',
        contact_phone: '',
        birth_place: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_number: '',
        gender: ''
    });

    // Remplissage du formulaire avec les données de l'API
    useEffect(() => {
        if (patient) {
            setPayload({
                first_name: patient.first_name,
                last_name: patient.last_name || '',
                bith_date: patient.bith_date ? patient.bith_date.split('T')[0] : '',
                contact_phone: patient.contact_phone,
                birth_place: patient.birth_place || '',
                address: patient.address || '',
                emergency_contact_name: patient.emergency_contact_name || '',
                emergency_contact_number: patient.emergency_contact_number || '',
                gender: patient.gender || ''
            });
        }
    }, [patient]);

    const isFormValid = payload.first_name && payload.bith_date && payload.contact_phone && payload.gender !== '';

    const handleSubmit = async () => {
        if (!patient || !isFormValid) return;

        const success = await updatePatient(patient.id, payload);
        if (success) onClose();
    };

    if (!isOpen || !patient) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl p-6 shadow-xl border border-transparent dark:border-gray-800">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Modifier le Patient</h2>
                </div>
                
                {/* Affichage du code généré en lecture seule */}
                <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-md border border-indigo-100 dark:border-indigo-800/50 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">Code Patient</p>
                        <p className="font-mono font-bold text-indigo-900 dark:text-indigo-200 text-lg">{patient.patient_code}</p>
                    </div>
                </div>

                <PatientForm 
                    payload={payload} 
                    setPayload={setPayload} 
                />

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    >
                        Fermer
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading || !isFormValid}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {actionLoading ? "Sauvegarde..." : "Enregistrer les modifications"}
                    </button>
                </div>
            </div>
        </div>
    );
};