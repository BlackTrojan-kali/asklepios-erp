import React, { useState, useEffect } from 'react';
import { CalendarClock, X, ArrowRight } from 'lucide-react';
import useAppointmentStore from '../../../../functions/base_hospital/useAppointmentStore';
import type { AppointmentDto } from '../../../../types/AppointmentTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    appointment: AppointmentDto | null;
}

export const DoctorRescheduleModal: React.FC<Props> = ({ isOpen, onClose, appointment }) => {
    const { rescheduleAppointment, actionLoading } = useAppointmentStore();
    const [formDate, setFormDate] = useState('');
    const [formTime, setFormTime] = useState('');

    useEffect(() => {
        if (isOpen && appointment && appointment.scheduled_datetime) {
            // Remplacement sécurisé de l'espace par 'T' pour compatibilité multi-navigateurs
            const dateObj = new Date(appointment.scheduled_datetime.replace(' ', 'T'));
            
            // Formatage local YYYY-MM-DD
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0'); // <-- La correction est ici (dateObj au lieu de dateDate)
            
            setFormDate(`${year}-${month}-${day}`);
            
            // Formatage de l'heure HH:mm
            setFormTime(dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
        }
    }, [isOpen, appointment]);

    const handleSubmit = async () => {
        if (!appointment || !formDate || !formTime) return;
        
        const datetime = `${formDate} ${formTime}:00`;
        const success = await rescheduleAppointment(appointment.id, { scheduled_datetime: datetime });
        
        if (success) {
            onClose();
        }
    };

    if (!isOpen || !appointment) return null;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-transparent dark:border-gray-800">
                
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <CalendarClock size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Reprogrammer</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {appointment.patient?.first_name} {appointment.patient?.last_name}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Nouvelle Date <span className="text-red-500">*</span></label>
                            <input 
                                type="date" 
                                value={formDate} 
                                onChange={e => setFormDate(e.target.value)} 
                                className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-white" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Nouvelle Heure <span className="text-red-500">*</span></label>
                            <input 
                                type="time" 
                                value={formTime} 
                                onChange={e => setFormTime(e.target.value)} 
                                className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-white" 
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors">
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading || !formDate || !formTime}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {actionLoading ? "Traitement..." : "Valider le déplacement"}
                        {!actionLoading && <ArrowRight size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
};