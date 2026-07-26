import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { CalendarPlus, X } from 'lucide-react';
import useAppointmentStore from '../../../../functions/base_hospital/useAppointmentStore';
import usePatientStore from '../../../../functions/base_hospital/usePatientStore';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    currentCenterId: number;
    currentDoctorId: number; // L'ID du médecin connecté
    prefilledDate?: Date | null;
}

export const DoctorNewAppointmentModal: React.FC<Props> = ({ 
    isOpen, onClose, currentCenterId, currentDoctorId, prefilledDate 
}) => {
    const { createAppointment, actionLoading } = useAppointmentStore();
    const { allPatients, getAllPatients, loading: patientsLoading } = usePatientStore();

    const [patientId, setPatientId] = useState<number | ''>('');
    const [formDate, setFormDate] = useState('');
    const [formTime, setFormTime] = useState('');
    const [reason, setReason] = useState('');

    const getLocalYYYYMMDD = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        if (isOpen) {
            getAllPatients(); // Charge la liste des patients pour la recherche
            setPatientId('');
            setReason('');
            setFormTime('');
            setFormDate(prefilledDate ? getLocalYYYYMMDD(prefilledDate) : getLocalYYYYMMDD(new Date()));
        }
    }, [isOpen, prefilledDate, getAllPatients]);

    const handleSubmit = async () => {
        if (!patientId || !formDate || !formTime || !currentDoctorId) return;

        const datetime = `${formDate} ${formTime}:00`;
        const success = await createAppointment({
            patient_id: patientId,
            profile_doctor_id: currentDoctorId, // Assigne automatiquement au médecin connecté
            center_id: currentCenterId,
            scheduled_datetime: datetime,
            reason: reason
        });

        if (success) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const patientOptions = allPatients.map(p => ({ 
        value: p.id, 
        label: `${p.patient_code} - ${p.first_name} ${p.last_name || ''}` 
    }));

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-transparent dark:border-gray-800">
                
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <CalendarPlus size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Bloquer un créneau (Suivi)</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Planifier un rendez-vous pour vous-même.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            Patient <span className="text-red-500">*</span>
                        </label>
                        <Select
                            options={patientOptions}
                            isLoading={patientsLoading}
                            onChange={(opt) => setPatientId(opt ? opt.value : '')}
                            placeholder="Rechercher un patient existant..."
                            isSearchable
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }), singleValue: base => ({...base, color: '#000'}) }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Date <span className="text-red-500">*</span></label>
                            <input 
                                type="date" 
                                min={getLocalYYYYMMDD(new Date())}
                                value={formDate} 
                                onChange={e => setFormDate(e.target.value)} 
                                className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-slate-800 dark:text-white" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Heure <span className="text-red-500">*</span></label>
                            <input 
                                type="time" 
                                value={formTime} 
                                onChange={e => setFormTime(e.target.value)} 
                                className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-slate-800 dark:text-white" 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Motif de la visite</label>
                        <textarea 
                            rows={3} 
                            value={reason} 
                            onChange={e => setReason(e.target.value)} 
                            placeholder="Ex: Visite de contrôle post-opératoire..." 
                            className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-slate-800 dark:text-white resize-none" 
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors">
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading || !patientId || !formDate || !formTime}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {actionLoading ? "Création..." : "Programmer le patient"}
                    </button>
                </div>
            </div>
        </div>
    );
};