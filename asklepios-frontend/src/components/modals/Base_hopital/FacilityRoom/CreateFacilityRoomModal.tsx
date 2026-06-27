import React, { useState, useEffect } from 'react';
import useFacilityRoomStore from '../../../../functions/base_hospital/useFacilityRoomStore';
import { FacilityRoomForm } from './FacilityRoomForm';
import type { FacilityRoomPayload } from '../../../../types/FacilityRoomTypes';
import type { DepartmentDto } from '../../../../types/types';
import type { RoomCategoryDto } from '../../../../types/RoomCategoryTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    currentDepartmentId: number | null; // Département actuellement exploré
    departments: DepartmentDto[];
    roomCategories: RoomCategoryDto[];
}

export const CreateFacilityRoomModal: React.FC<Props> = ({ 
    isOpen, 
    onClose, 
    currentDepartmentId, 
    departments, 
    roomCategories 
}) => {
    const { createFacilityRoom, actionLoading } = useFacilityRoomStore();

    const [payload, setPayload] = useState<FacilityRoomPayload>({
        department_id: '',
        room_category_id: null,
        name: '',
        type: ''
    });

    // On pré-remplit le département si on est déjà dans un dossier d'exploration
    useEffect(() => {
        if (isOpen) {
            setPayload({
                department_id: currentDepartmentId || '',
                room_category_id: null,
                name: '',
                type: ''
            });
        }
    }, [isOpen, currentDepartmentId]);

    const isFormValid = payload.department_id && payload.name && payload.type !== '';

    const handleSubmit = async () => {
        if (!isFormValid) return;

        const success = await createFacilityRoom(payload);
        if (success) onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-6 shadow-xl border border-transparent dark:border-gray-800">
                <h2 className="text-xl font-bold mb-5 text-slate-800 dark:text-white">Ajouter une Salle / Chambre</h2>
                
                <FacilityRoomForm
                    payload={payload}
                    setPayload={setPayload}
                    departments={departments}
                    roomCategories={roomCategories}
                    freezeDepartment={!!currentDepartmentId} // Bloqué si déjà dans un département
                />

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors font-medium text-sm"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={actionLoading || !isFormValid}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm font-medium text-sm"
                    >
                        {actionLoading ? "Enregistrement..." : "Créer l'espace"}
                    </button>
                </div>
            </div>
        </div>
    );
};