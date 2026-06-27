import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { LogIn, X, Stethoscope } from 'lucide-react';
import useAppointmentStore from '../../../../functions/base_hospital/useAppointmentStore';
import useFacilityRoomStore from '../../../../functions/base_hospital/useFacilityRoomStore';
import type { AppointmentDto } from '../../../../types/AppointmentTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    appointment: AppointmentDto | null;
    currentDepartmentId: number; // L'ID du département du médecin
}

export const AdmitToConsultationModal: React.FC<Props> = ({ isOpen, onClose, appointment, currentDepartmentId }) => {
    const { admitToConsultation, actionLoading } = useAppointmentStore();
    const { sharedFacilityRooms, getSharedFacilityRooms, loading: roomsLoading } = useFacilityRoomStore();
    
    const [roomId, setRoomId] = useState<number | ''>('');

    useEffect(() => {
        if (isOpen && currentDepartmentId) {
            // On récupère uniquement les bureaux de consultation
            getSharedFacilityRooms(currentDepartmentId, { type: 'CONSULTING_ROOM' });
        }
    }, [isOpen, currentDepartmentId, getSharedFacilityRooms]);

    const handleSubmit = async () => {
        if (!appointment || !roomId) return;

        // Note : On passe appointment.id. Assure-toi que l'API récupère bien la visite liée à ce RDV.
        const success = await admitToConsultation(appointment.id, {
            consulting_room_id: roomId
        });

        if (success) {
            setRoomId('');
            onClose();
        }
    };

    if (!isOpen || !appointment) return null;

    const roomOptions = sharedFacilityRooms.map(room => ({ value: room.id, label: room.name }));

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-transparent dark:border-gray-800">
                
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <Stethoscope size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Démarrer la consultation</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {appointment.patient?.first_name} {appointment.patient?.last_name}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm mb-5 border border-emerald-100 dark:border-emerald-800">
                    Motif renseigné à l'accueil : <strong>{appointment.reason || 'Aucun motif spécifié'}</strong>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                            Bureau de consultation <span className="text-red-500">*</span>
                        </label>
                        <Select
                            options={roomOptions}
                            isLoading={roomsLoading}
                            onChange={(opt) => setRoomId(opt ? opt.value : '')}
                            placeholder="Choisir votre bureau..."
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }), singleValue: base => ({...base, color: '#000'}) }}
                            className="text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-1.5">Le statut du patient passera à "En consultation".</p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors">
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading || !roomId}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {actionLoading ? "En cours..." : "Faire entrer le patient"}
                        {!actionLoading && <LogIn size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
};