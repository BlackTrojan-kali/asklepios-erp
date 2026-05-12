import React, { useState, useEffect } from 'react';
import useDepartmentStore from '../../../functions/departments/useDepartmentStore';
import { DepartmentForm } from './DepartmentForm';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    centerId: number; // Le centre sélectionné dans le dashboard
}

export const CreateDepartmentModal: React.FC<Props> = ({ isOpen, onClose, centerId }) => {
    const { createDepartment, loading } = useDepartmentStore();
    
    const [payload, setPayload] = useState({
        center_id: centerId,
        name: '',
        alias: ''
    });

    // On met à jour le center_id si l'utilisateur change de centre dans le dashboard
    useEffect(() => {
        setPayload(prev => ({ ...prev, center_id: centerId }));
    }, [centerId]);

    const handleSubmit = async () => {
        if (!payload.name) return;
        const success = await createDepartment(payload);
        if (success) {
            setPayload({ center_id: centerId, name: '', alias: '' });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-6 shadow-xl border border-transparent dark:border-gray-800">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Ajouter un Département</h2>
                
                <DepartmentForm payload={payload} setPayload={setPayload} />
                
                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={loading || !payload.name}
                        className="px-6 py-2 bg-[#00a896] text-white rounded-md hover:bg-[#008f7e] disabled:opacity-50 transition-colors"
                    >
                        {loading ? "Création..." : "Enregistrer"}
                    </button>
                </div>
            </div>
        </div>
    );
};