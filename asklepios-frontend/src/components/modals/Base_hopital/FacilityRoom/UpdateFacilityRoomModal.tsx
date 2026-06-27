import React, { useState, useEffect } from 'react';
import useFacilityRoomStore from '../../../../functions/base_hospital/useFacilityRoomStore';
import { FacilityRoomForm } from './FacilityRoomForm';
import type { FacilityRoomDto, FacilityRoomPayload } from '../../../../types/FacilityRoomTypes';
import type { DepartmentDto } from '../../../../types/types';
import type { RoomCategoryDto } from '../../../../types/RoomCategoryTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    room: FacilityRoomDto | null;
    departments: DepartmentDto[];
    roomCategories: RoomCategoryDto[];
}

export const UpdateFacilityRoomModal: React.FC<Props> = ({ 
    isOpen, 
    onClose, 
    room, 
    departments, 
    roomCategories 
}) => {
    const { updateFacilityRoom, actionLoading } = useFacilityRoomStore();

    const [payload, setPayload] = useState<FacilityRoomPayload>({
        department_id: '',
        room_category_id: null,
        name: '',
        type: ''
    });

    useEffect(() => {
        if (room) {
            setPayload({
                department_id: room.department_id,
                room_category_id: room.room_category_id,
                name: room.name,
                type: room.type
            });
        }
    }, [room]);

    const isFormValid = payload.department_id && payload.name && payload.type !== '';

    const handleSubmit = async () => {
        if (!room || !isFormValid) return;

        const success = await updateFacilityRoom(room.id, payload);
        if (success) onClose();
    };

    if (!isOpen || !room) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-6 shadow-xl border border-transparent dark:border-gray-800">
                <h2 className="text-xl font-bold mb-5 text-slate-800 dark:text-white">Modifier les paramètres</h2>
                
                <FacilityRoomForm
                    payload={payload}
                    setPayload={setPayload}
                    departments={departments}
                    roomCategories={roomCategories}
                    freezeDepartment={true} // On ne change pas le département d'une pièce existante pour éviter les désynchronisations physiques
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
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm font-medium text-sm"
                    >
                        {actionLoading ? "Mise à jour..." : "Enregistrer les modifications"}
                    </button>
                </div>
            </div>
        </div>
    );
};