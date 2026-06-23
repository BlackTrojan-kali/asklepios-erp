import React, { useState } from 'react';
import usePatientStore from '../../../../functions/base_hospital/usePatientStore'; // Ajuste le chemin
import { PatientForm } from './PatientForm';
import type { PatientPayload } from '../../../../types/PatientTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const CreatePatientModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { createPatient, actionLoading } = usePatientStore();
    
    const [payload, setPayload] = useState<PatientPayload>({
        first_name: '',
        last_name: '',
        bith_date: '',
        contact_phone: ''
    });

    const isFormValid = payload.first_name && payload.bith_date && payload.contact_phone;

    const handleSubmit = async () => {
        if (!isFormValid) return;
        
        const success = await createPatient(payload);
        if (success) {
            setPayload({ first_name: '', last_name: '', bith_date: '', contact_phone: '' });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-lg p-6 shadow-xl border border-transparent dark:border-gray-800">
                <h2 className="text-xl font-bold mb-5 text-slate-800 dark:text-white">Nouveau Dossier Patient</h2>
                
                <PatientForm 
                    payload={payload} 
                    setPayload={setPayload} 
                />
                
                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading || !isFormValid}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {actionLoading ? "Enregistrement..." : "Créer le dossier"}
                    </button>
                </div>
            </div>
        </div>
    );
};