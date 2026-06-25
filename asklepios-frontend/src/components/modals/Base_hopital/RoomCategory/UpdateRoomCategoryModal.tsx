import React, { useState, useEffect } from 'react';
import useRoomCategoryStore from '../../../../functions/base_hospital/useRoomCategoryStore';
import { RoomCategoryForm } from './RoomCategoryForm';
import type { RoomCategoryDto, RoomCategoryPayload } from '../../../../types/RoomCategoryTypes';
import type { CenterDto } from '../../../../types/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    category: RoomCategoryDto | null;
    centers: CenterDto[];
}

export const UpdateRoomCategoryModal: React.FC<Props> = ({ isOpen, onClose, category, centers }) => {
    const { updateRoomCategory, actionLoading } = useRoomCategoryStore();

    const [payload, setPayload] = useState<RoomCategoryPayload>({
        center_id: '',
        name: '',
        price_per_night: ''
    });

    // Remplissage automatique des données lors de l'ouverture
    useEffect(() => {
        if (category) {
            setPayload({
                center_id: category.center_id,
                name: category.name,
                price_per_night: category.price_per_night
            });
        }
    }, [category]);

    const isFormValid = payload.center_id && payload.name && payload.price_per_night !== '';

    const handleSubmit = async () => {
        if (!category || !isFormValid) return;

        const success = await updateRoomCategory(category.id, payload);
        if (success) onClose();
    };

    if (!isOpen || !category) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-6 shadow-xl border border-transparent dark:border-gray-800">
                <h2 className="text-xl font-bold mb-5 text-slate-800 dark:text-white">Modifier la Catégorie</h2>
                
                <RoomCategoryForm
                    payload={payload}
                    setPayload={setPayload}
                    centers={centers}
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
                        {actionLoading ? "Sauvegarde..." : "Enregistrer les modifications"}
                    </button>
                </div>
            </div>
        </div>
    );
};