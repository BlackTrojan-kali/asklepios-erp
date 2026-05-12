import React, { useState, useEffect } from 'react';
import useDepartmentStore from '../../../functions/departments/useDepartmentStore';
import { DepartmentForm } from './DepartmentForm';
import type { DepartmentDto } from '../../../types/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    department: DepartmentDto | null;
}

export const UpdateDepartmentModal: React.FC<Props> = ({ isOpen, onClose, department }) => {
    const { updateDepartment, loading } = useDepartmentStore();
    
    const [payload, setPayload] = useState({
        center_id: 0,
        name: '',
        alias: ''
    });

    useEffect(() => {
        if (department) {
            setPayload({
                center_id: department.center_id,
                name: department.name,
                alias: department.alias || ''
            });
        }
    }, [department]);

    const handleSubmit = async () => {
        if (!department || !payload.name) return;
        const success = await updateDepartment(department.id, department.center_id, payload);
        if (success) onClose();
    };

    if (!isOpen || !department) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-6 shadow-xl border border-transparent dark:border-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Modifier le Département</h2>
                </div>
                
                <DepartmentForm payload={payload} setPayload={setPayload} />

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    >
                        Fermer
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={loading || !payload.name}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                        {loading ? "Sauvegarde..." : "Enregistrer les modifications"}
                    </button>
                </div>
            </div>
        </div>
    );
};