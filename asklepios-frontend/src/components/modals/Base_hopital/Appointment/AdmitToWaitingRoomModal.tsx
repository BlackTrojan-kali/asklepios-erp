import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { UserCheck, X, Clock, AlertCircle } from 'lucide-react';
import useAppointmentStore from '../../../../functions/base_hospital/useAppointmentStore';
import useFacilityRoomStore from '../../../../functions/base_hospital/useFacilityRoomStore';
import type { AppointmentDto } from '../../../../types/AppointmentTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    appointment: AppointmentDto | null;
    currentDepartmentId: number;
}

export const AdmitToWaitingRoomModal: React.FC<Props> = ({ isOpen, onClose, appointment, currentDepartmentId }) => {
    const { admitToWaitingRoom, actionLoading } = useAppointmentStore();
    const { sharedFacilityRooms, getSharedFacilityRooms, loading: roomsLoading } = useFacilityRoomStore();
    
    const [roomId, setRoomId] = useState<number | ''>('');
    const [visitType, setVisitType] = useState<'ROUTINE' | 'EMERGENCY' | 'FOLLOW_UP'>('ROUTINE');

    useEffect(() => {
        if (isOpen && currentDepartmentId) {
            // On récupère UNIQUEMENT les salles d'attente
            getSharedFacilityRooms(currentDepartmentId, { type: 'WAITING_ROOM' });
        }
    }, [isOpen, currentDepartmentId, getSharedFacilityRooms]);

    const handleSubmit = async () => {
        if (!appointment || !roomId) return;

        const success = await admitToWaitingRoom(appointment.id, {
            waiting_room_id: Number(roomId),
            visit_type: visitType
        });

        if (success) {
            setRoomId('');
            setVisitType('ROUTINE');
            onClose();
        }
    };

    if (!isOpen || !appointment) return null;

    const roomOptions = sharedFacilityRooms.map(room => ({ value: room.id, label: room.name }));
    const visitTypeOptions = [
        { value: 'ROUTINE', label: 'Consultation de Routine' },
        { value: 'FOLLOW_UP', label: 'Visite de Suivi (Contrôle)' },
        { value: 'EMERGENCY', label: 'Urgence' }
    ];

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-transparent dark:border-gray-800">
                <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                            <UserCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#003366] dark:text-blue-400 font-brand">Admettre le patient</h2>
                            <p className="text-sm text-gray-500">{appointment.patient?.first_name} {appointment.patient?.last_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Type de visite <span className="text-red-500">*</span></label>
                        <Select
                            options={visitTypeOptions}
                            defaultValue={visitTypeOptions[0]}
                            onChange={(opt) => setVisitType(opt ? opt.value as any : 'ROUTINE')}
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Salle d'attente <span className="text-red-500">*</span></label>
                        <Select
                            options={roomOptions}
                            isLoading={roomsLoading}
                            onChange={(opt) => setRoomId(opt ? opt.value : '')}
                            placeholder="Choisir la salle..."
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        />
                        {roomId && <p className="text-xs text-[#00a896] mt-2 flex items-center gap-1 font-medium"><AlertCircle size={14} /> Le patient recevra son numéro de passage.</p>}
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={onClose} className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Annuler</button>
                    <button onClick={handleSubmit} disabled={actionLoading || !roomId} className="px-6 py-2.5 bg-[#00a896] hover:bg-[#008f7f] text-white rounded-lg font-bold shadow-md disabled:opacity-50">
                        {actionLoading ? "En cours..." : "Placer en file d'attente"}
                    </button>
                </div>
            </div>
        </div>
    );
};