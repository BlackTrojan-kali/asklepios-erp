import React, { useState, useEffect } from 'react';
import useBedStore from '../../../../functions/base_hospital/useBedStore';
import { BedForm } from './BedForm';
import { BedState } from '../../../../types/BedTypes';
import type { BedPayload } from '../../../../types/BedTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    roomId: number; // La salle dans laquelle on ajoute le lit
}

export const CreateBedModal: React.FC<Props> = ({ isOpen, onClose, roomId }) => {
    const { createBed, actionLoading } = useBedStore();

    const [payload, setPayload] = useState<BedPayload>({
        facility_room_id: '',
        bed_number: '',
        state: BedState.AVAILABLE // Par défaut, un nouveau lit est souvent disponible
    });

    useEffect(() => {
        if (isOpen) {
            setPayload({
                facility_room_id: roomId,
                bed_number: '',
                state: BedState.AVAILABLE
            });
        }
    }, [isOpen, roomId]);

    const isFormValid = payload.bed_number.trim() !== '' && payload.state !== '';

    const handleSubmit = async () => {
        if (!isFormValid) return;

        const success = await createBed(payload);
        if (success) onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-6 shadow-xl border border-transparent dark:border-gray-800">
                <h2 className="text-xl font-bold mb-5 text-slate-800 dark:text-white">Ajouter un Lit</h2>
                
                <BedForm payload={payload} setPayload={setPayload} />

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
                        {actionLoading ? "Enregistrement..." : "Créer le lit"}
                    </button>
                </div>
            </div>
        </div>
    );
};