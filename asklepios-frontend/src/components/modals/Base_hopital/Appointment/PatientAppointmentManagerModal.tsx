import React, { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Styles de base (surchargés plus bas)
import Select from 'react-select';
import { 
    CalendarPlus, 
    CalendarClock, 
    LogIn, 
    ArrowLeft,
    Clock,
    AlertTriangle,
    User,
    CheckCircle2
} from 'lucide-react';

// Stores
import useAppointmentStore from '../../../../functions/base_hospital/useAppointmentStore';
import useFacilityRoomStore from '../../../../functions/base_hospital/useFacilityRoomStore';

// Types
import { VisitType, AppointmentStatus } from '../../../../types/AppointmentTypes';
import type { AppointmentDto, AppointmentPayload } from '../../../../types/AppointmentTypes';
import type { PatientDto } from '../../../../types/PatientTypes';
import type { FacilityRoomDto } from '../../../../types/FacilityRoomTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    patient: PatientDto | null;
    currentCenterId: number;
    doctors: any[]; // ProfileDoctorDto[]
}

type ViewState = 'OVERVIEW' | 'NEW_APPOINTMENT' | 'RESCHEDULE' | 'ADMIT';

export const PatientAppointmentManagerModal: React.FC<Props> = ({ 
    isOpen, onClose, patient, currentCenterId, doctors 
}) => {
    // --- STORES ---
    const { 
        appointments, getAppointments, 
        createAppointment, rescheduleAppointment, admitToWaitingRoom, actionLoading 
    } = useAppointmentStore();
    const { sharedFacilityRooms, getSharedFacilityRooms } = useFacilityRoomStore();

    // --- ÉTATS LOCAUX ---
    const [view, setView] = useState<ViewState>('OVERVIEW');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [targetAppointment, setTargetAppointment] = useState<AppointmentDto | null>(null);

    // Form states
    const [newApptTime, setNewApptTime] = useState('');
    const [newApptDoctor, setNewApptDoctor] = useState<number | ''>('');
    const [newApptReason, setNewApptReason] = useState('');
    
    const [admitRoom, setAdmitRoom] = useState<number | ''>('');
    const [visitType, setVisitType] = useState<VisitType | ''>('');

    // --- CHARGEMENT DES DONNÉES ---
    useEffect(() => {
        if (isOpen && patient) {
            // On récupère tous les rendez-vous de CE patient
            getAppointments(1, { patient_id: patient.id }, 100);
            // On récupère les salles d'attente du centre actuel
            getSharedFacilityRooms(currentCenterId, { type: 'WAITING_ROOM' });
            setView('OVERVIEW');
        }
    }, [isOpen, patient, currentCenterId, getAppointments, getSharedFacilityRooms]);

    // --- DÉRIVATION DES DONNÉES ---
    // Isoler les dates ayant un rendez-vous pour le calendrier
    const appointmentDates = useMemo(() => {
        return appointments.map(app => new Date(app.scheduled_datetime).toDateString());
    }, [appointments]);

    // Filtrer les rendez-vous de la date cliquée sur le calendrier
    const selectedDateAppointments = useMemo(() => {
        return appointments.filter(app => 
            new Date(app.scheduled_datetime).toDateString() === selectedDate.toDateString()
        );
    }, [appointments, selectedDate]);

    // --- ACTIONS ---
    const handleNewAppointment = async () => {
        if (!patient || !newApptTime || !newApptDoctor) return;
        
        // Combinaison de la date du calendrier et de l'heure saisie
        const dateStr = selectedDate.toISOString().split('T')[0];
        const datetime = `${dateStr} ${newApptTime}:00`;

        const payload: AppointmentPayload = {
            patient_id: patient.id,
            profile_doctor_id: newApptDoctor,
            center_id: currentCenterId,
            scheduled_datetime: datetime,
            reason: newApptReason
        };

        const success = await createAppointment(payload);
        if (success) {
            setNewApptTime(''); setNewApptReason('');
            setView('OVERVIEW');
        }
    };

    const handleReschedule = async () => {
        if (!targetAppointment || !newApptTime) return;
        const dateStr = selectedDate.toISOString().split('T')[0];
        const datetime = `${dateStr} ${newApptTime}:00`;

        const success = await rescheduleAppointment(targetAppointment.id, { scheduled_datetime: datetime });
        if (success) setView('OVERVIEW');
    };

    const handleAdmit = async () => {
        if (!targetAppointment || !admitRoom || !visitType) return;

        const success = await admitToWaitingRoom(targetAppointment.id, {
            waiting_room_id: admitRoom,
            visit_type: visitType
        });
        
        if (success) setView('OVERVIEW');
    };

    if (!isOpen || !patient) return null;

    // Options React-Select
    const doctorOptions = doctors.map(d => ({ value: d.id, label: `Dr. ${d.user?.first_name} ${d.user?.last_name || ''}` }));
    const roomOptions = sharedFacilityRooms.map(r => ({ value: r.id, label: r.name }));
    const visitTypeOptions = [
        { value: VisitType.ROUTINE, label: "Routine" },
        { value: VisitType.EMERGENCY, label: "Urgence" },
        { value: VisitType.FOLLOW_UP, label: "Suivi" }
    ];

    const selectStyles = { menuPortal: (b: any) => ({ ...b, zIndex: 9999 }), singleValue: (b: any) => ({ ...b, color: '#000' }) };

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
            {/* Conteneur principal très large pour le split-pane */}
            <div className="bg-slate-50 dark:bg-gray-900 rounded-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden shadow-2xl border border-transparent dark:border-gray-800 h-[85vh] md:h-[650px]">
                
                {/* ==================================================== */}
                {/* COLONNE GAUCHE : CALENDRIER & HISTORIQUE */}
                {/* ==================================================== */}
                <div className="w-full md:w-[45%] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col">
                    
                    {/* Header Patient */}
                    <div className="mb-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                                {patient.first_name} {patient.last_name}
                            </h2>
                            <p className="text-sm font-mono text-gray-500">{patient.patient_code}</p>
                        </div>
                    </div>

                    {/* Calendrier React-Calendar customisé */}
                    <div className="calendar-container mb-6">
                        <Calendar 
                            onChange={(value) => {
                                setSelectedDate(value as Date);
                                setView('OVERVIEW'); // Retour à l'accueil si on change de date
                            }}
                            value={selectedDate}
                            className="w-full border-none rounded-xl bg-slate-50 dark:bg-gray-800 p-2 shadow-inner"
                            tileClassName={({ date }) => {
                                // Mettre un point visuel si un rendez-vous existe à cette date
                                if (appointmentDates.includes(date.toDateString())) {
                                    return 'has-appointment text-indigo-600 dark:text-indigo-400 font-bold';
                                }
                                return 'text-slate-700 dark:text-gray-300';
                            }}
                        />
                    </div>

                    {/* Résumé de la date sélectionnée */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                            Rendez-vous le {selectedDate.toLocaleDateString('fr-FR')}
                        </h3>
                        
                        {selectedDateAppointments.length === 0 ? (
                            <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center text-sm text-gray-500">
                                Aucun rendez-vous ce jour.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedDateAppointments.map(app => (
                                    <div key={app.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                                <Clock size={14} className="text-indigo-500" />
                                                {new Date(app.scheduled_datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${app.status === 'ARRIVED' ? 'bg-emerald-100 text-emerald-700' : app.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {app.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 truncate">{app.reason || 'Consultation standard'}</p>
                                        
                                        {/* Actions rapides sur l'élément */}
                                        {app.status === 'SCHEDULED' && (
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => { setTargetAppointment(app); setView('ADMIT'); }}
                                                    className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 rounded text-xs font-medium transition-colors"
                                                >
                                                    Admettre
                                                </button>
                                                <button 
                                                    onClick={() => { setTargetAppointment(app); setView('RESCHEDULE'); }}
                                                    className="flex-1 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors"
                                                >
                                                    Déplacer
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ==================================================== */}
                {/* COLONNE DROITE : PANNEAU D'ACTIONS DYNAMIQUE */}
                {/* ==================================================== */}
                <div className="w-full md:w-[55%] p-6 flex flex-col bg-slate-50 dark:bg-gray-800/50">
                    
                    {/* EN-TÊTE DYNAMIQUE */}
                    <div className="flex justify-between items-center mb-6">
                        {view !== 'OVERVIEW' ? (
                            <button onClick={() => setView('OVERVIEW')} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                                <ArrowLeft size={16} /> Retour
                            </button>
                        ) : (
                            <div className="text-sm font-medium text-slate-500 dark:text-gray-400">Actions Rapides</div>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
                            ✕
                        </button>
                    </div>

                    {/* VUE 1 : OVERVIEW (Bouton Nouveau RDV) */}
                    {view === 'OVERVIEW' && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6">
                                <CalendarPlus size={36} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Planifier un Rendez-vous</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                                Sélectionnez une date sur le calendrier à gauche, puis cliquez ci-dessous pour réserver un créneau pour ce patient.
                            </p>
                            <button 
                                onClick={() => setView('NEW_APPOINTMENT')}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all hover:-translate-y-0.5"
                            >
                                Créer un rendez-vous le {selectedDate.toLocaleDateString('fr-FR')}
                            </button>
                        </div>
                    )}

                    {/* VUE 2 : NOUVEAU RENDEZ-VOUS */}
                    {view === 'NEW_APPOINTMENT' && (
                        <div className="flex-1 flex flex-col animate-fadeIn">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <CalendarPlus size={20} className="text-indigo-600" /> 
                                Créneau du {selectedDate.toLocaleDateString('fr-FR')}
                            </h3>
                            
                            <div className="space-y-4 flex-1">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Heure prévue <span className="text-red-500">*</span></label>
                                    <input type="time" value={newApptTime} onChange={e => setNewApptTime(e.target.value)} className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-slate-800 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Médecin traitant <span className="text-red-500">*</span></label>
                                    <Select options={doctorOptions} onChange={opt => setNewApptDoctor(opt ? opt.value : '')} placeholder="Choisir un docteur..." menuPortalTarget={document.body} styles={selectStyles} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Motif</label>
                                    <textarea rows={3} value={newApptReason} onChange={e => setNewApptReason(e.target.value)} placeholder="Raison de la visite..." className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-slate-800 dark:text-white resize-none" />
                                </div>
                            </div>

                            <button onClick={handleNewAppointment} disabled={!newApptTime || !newApptDoctor || actionLoading} className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold disabled:opacity-50 transition-colors">
                                {actionLoading ? "Enregistrement..." : "Confirmer la réservation"}
                            </button>
                        </div>
                    )}

                    {/* VUE 3 : ADMISSION (SALLE D'ATTENTE) */}
                    {view === 'ADMIT' && targetAppointment && (
                        <div className="flex-1 flex flex-col animate-fadeIn">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <LogIn size={20} className="text-emerald-600" /> 
                                Admission à l'accueil
                            </h3>
                            
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl mb-6">
                                <p className="text-sm text-emerald-800 dark:text-emerald-300">
                                    Vous êtes sur le point d'admettre le patient pour son rendez-vous de <strong>{new Date(targetAppointment.scheduled_datetime).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</strong>.
                                </p>
                            </div>

                            <div className="space-y-4 flex-1">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Nature de la visite <span className="text-red-500">*</span></label>
                                    <Select options={visitTypeOptions} onChange={opt => setVisitType(opt ? (opt.value as VisitType) : '')} placeholder="Routine, Urgence..." menuPortalTarget={document.body} styles={selectStyles} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Salle d'attente cible <span className="text-red-500">*</span></label>
                                    <Select options={roomOptions} onChange={opt => setAdmitRoom(opt ? opt.value : '')} placeholder="Choisir la salle..." menuPortalTarget={document.body} styles={selectStyles} />
                                </div>
                            </div>

                            <button onClick={handleAdmit} disabled={!visitType || !admitRoom || actionLoading} className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                                {actionLoading ? "Traitement..." : <><CheckCircle2 size={18} /> Admettre en salle d'attente</>}
                            </button>
                        </div>
                    )}

                    {/* VUE 4 : REPROGRAMMATION */}
                    {view === 'RESCHEDULE' && targetAppointment && (
                        <div className="flex-1 flex flex-col animate-fadeIn">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <CalendarClock size={20} className="text-blue-600" /> 
                                Reprogrammer vers le {selectedDate.toLocaleDateString('fr-FR')}
                            </h3>

                            <div className="space-y-4 flex-1">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Nouvelle Heure <span className="text-red-500">*</span></label>
                                    <input type="time" value={newApptTime} onChange={e => setNewApptTime(e.target.value)} className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-white" />
                                </div>
                            </div>

                            <button onClick={handleReschedule} disabled={!newApptTime || actionLoading} className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:opacity-50 transition-colors">
                                {actionLoading ? "Mise à jour..." : "Valider la nouvelle date"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};