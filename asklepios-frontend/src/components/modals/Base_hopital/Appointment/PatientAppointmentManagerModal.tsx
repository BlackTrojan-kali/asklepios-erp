import React, { useEffect, useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import Select from 'react-select';
import { 
    CalendarPlus, 
    CalendarClock, 
    LogIn, 
    ArrowLeft,
    Clock,
    User,
    CheckCircle2
} from 'lucide-react';

// Stores
import useAppointmentStore from '../../../../functions/base_hospital/useAppointmentStore';
import useFacilityRoomStore from '../../../../functions/base_hospital/useFacilityRoomStore';

// Types
import { VisitType } from '../../../../types/AppointmentTypes';
import type { AppointmentDto, AppointmentPayload } from '../../../../types/AppointmentTypes';
import type { PatientDto } from '../../../../types/PatientTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    patient: PatientDto | null;
    currentCenterId: number;
    doctors: any[]; // Remplacer par ProfileDoctorDto[] si disponible
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

    // Form states (Unifiés pour création et reprogrammation)
    const [formDate, setFormDate] = useState(''); // Format YYYY-MM-DD
    const [formTime, setFormTime] = useState(''); // Format HH:mm
    const [newApptDoctor, setNewApptDoctor] = useState<number | ''>('');
    const [newApptReason, setNewApptReason] = useState('');
    
    // Form states (Admission)
    const [admitRoom, setAdmitRoom] = useState<number | ''>('');
    const [visitType, setVisitType] = useState<VisitType | ''>('');

    // --- HELPERS DE DATES INFAILLIBLES ---
    // 1. Transforme un objet Date Javascript en YYYY-MM-DD local
    const getLocalYYYYMMDD = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // 2. Transforme N'IMPORTE QUELLE date de l'API (ISO, SQL) en YYYY-MM-DD local
    const getLocalYYYYMMDDFromAPI = (datetimeStr: string) => {
        if (!datetimeStr) return '';
        // Le replace gère le format SQL '2026-06-27 15:00:00' pour Safari. 
        // Si c'est déjà ISO ('2026-06-27T15...'), ça marche parfaitement aussi.
        const d = new Date(datetimeStr.replace(' ', 'T'));
        return getLocalYYYYMMDD(d);
    };

    // --- CHARGEMENT ---
    useEffect(() => {
        if (isOpen && patient) {
            getAppointments(1, { patient_id: patient.id }, 100);
            getSharedFacilityRooms(currentCenterId, { type: 'WAITING_ROOM' });
            setView('OVERVIEW');
            const today = new Date();
            setSelectedDate(today);
            setFormDate(getLocalYYYYMMDD(today));
        }
    }, [isOpen, patient, currentCenterId, getAppointments, getSharedFacilityRooms]);

    // --- DÉRIVATION SÉCURISÉE DES DATES ---
    // Un Set rapide de toutes les dates ayant au moins 1 rdv (Format YYYY-MM-DD garanti)
    const appointmentDatesSet = useMemo(() => {
        const dates = new Set<string>();
        appointments.forEach(app => {
            if (app.scheduled_datetime) {
                dates.add(getLocalYYYYMMDDFromAPI(app.scheduled_datetime)); 
            }
        });
        return dates;
    }, [appointments]);

    // Les rendez-vous du jour sélectionné
    const selectedDateAppointments = useMemo(() => {
        const targetDateString = getLocalYYYYMMDD(selectedDate);
        return appointments.filter(app => {
            if (!app.scheduled_datetime) return false;
            return getLocalYYYYMMDDFromAPI(app.scheduled_datetime) === targetDateString;
        });
    }, [appointments, selectedDate]);

    // --- MAP OPTIONS ---
    const doctorOptions = (doctors || []).map(d => ({ 
        value: d.id, 
        label: `Dr. ${d.user?.first_name || ''} ${d.user?.last_name || ''} (${d.department?.name || 'Généraliste'})` 
    }));
    
    const roomOptions = (sharedFacilityRooms || []).map(r => ({ value: r.id, label: r.name }));
    const visitTypeOptions = [
        { value: VisitType.ROUTINE, label: "Consultation Routine" },
        { value: VisitType.EMERGENCY, label: "Urgence" },
        { value: VisitType.FOLLOW_UP, label: "Suivi médical" }
    ];

    const selectStyles = { 
        menuPortal: (b: any) => ({ ...b, zIndex: 9999 }), 
        singleValue: (b: any) => ({ ...b, color: '#000' }),
        input: (b: any) => ({ ...b, color: '#000' }) 
    };

    // --- GESTIONNAIRES D'ACTIONS ---
    const handleNewAppointment = async () => {
        if (!patient || !formDate || !formTime || !newApptDoctor) return;
        
        const datetime = `${formDate} ${formTime}:00`;
        const payload: AppointmentPayload = {
            patient_id: patient.id,
            profile_doctor_id: newApptDoctor,
            center_id: currentCenterId,
            scheduled_datetime: datetime,
            reason: newApptReason
        };
        
        const success = await createAppointment(payload);
        if (success) { 
            setView('OVERVIEW'); 
            setSelectedDate(new Date(datetime.replace(' ', 'T')));
        }
    };

    const handleReschedule = async () => {
        if (!targetAppointment || !formDate || !formTime) return;
        
        const datetime = `${formDate} ${formTime}:00`;
        const success = await rescheduleAppointment(targetAppointment.id, { scheduled_datetime: datetime });
        
        if (success) {
            setView('OVERVIEW');
            setSelectedDate(new Date(datetime.replace(' ', 'T')));
        }
    };

    const handleAdmit = async () => {
        if (!targetAppointment || !admitRoom || !visitType) return;
        const success = await admitToWaitingRoom(targetAppointment.id, {
            waiting_room_id: admitRoom,
            visit_type: visitType
        });
        if (success) {
            setAdmitRoom(''); setVisitType('');
            setView('OVERVIEW');
        }
    };

    // --- PRÉPARATION DES VUES ---
    const openNewAppointment = () => {
        setFormDate(getLocalYYYYMMDD(selectedDate));
        setFormTime('');
        setNewApptDoctor('');
        setNewApptReason('');
        setView('NEW_APPOINTMENT');
    };

    const openReschedule = (app: AppointmentDto) => {
        const d = new Date(app.scheduled_datetime.replace(' ', 'T'));
        setTargetAppointment(app);
        setFormDate(getLocalYYYYMMDD(d));
        setFormTime(d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
        setSelectedDate(d);
        setView('RESCHEDULE');
    };

    const openAdmit = (app: AppointmentDto) => {
        setTargetAppointment(app);
        setVisitType('');
        setAdmitRoom('');
        setView('ADMIT');
    };

    if (!isOpen || !patient) return null;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-50 dark:bg-gray-900 rounded-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden shadow-2xl h-[85vh] md:h-[650px]">
                
                {/* ========================================= */}
                {/* GAUCHE: CALENDRIER ET HISTORIQUE */}
                {/* ========================================= */}
                <div className="w-full md:w-[45%] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col">
                    <div className="mb-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white truncate" title={`${patient.first_name} ${patient.last_name}`}>
                                {patient.first_name} {patient.last_name}
                            </h2>
                            <p className="text-sm font-mono text-gray-500">{patient.patient_code}</p>
                        </div>
                    </div>

                    {/* Surcharges CSS d'isolation ABSOLUE pour forcer les couleurs du calendrier */}
                    <style>{`
                        .custom-calendar {
                            width: 100% !important;
                            border: none !important;
                            background: transparent !important;
                            font-family: inherit !important;
                        }
                        
                        /* Forcer les textes de navigation en NOIR absolu */
                        .custom-calendar .react-calendar__navigation button,
                        .custom-calendar .react-calendar__month-view__weekdays,
                        .custom-calendar .react-calendar__month-view__weekdays abbr {
                            color: #000000 !important;
                            text-decoration: none !important;
                            font-weight: 700 !important;
                        }

                        /* Les cases (jours normaux) = Texte noir */
                        .custom-calendar .react-calendar__tile {
                            color: #000000 !important;
                            border-radius: 8px !important;
                            padding: 10px 0 !important;
                            margin: 2px 0 !important;
                            transition: background-color 0.2s;
                        }
                        
                        /* Hover des jours normaux */
                        .custom-calendar .react-calendar__tile:enabled:hover {
                            background-color: #cbd5e1 !important; /* slate-300 */
                        }

                        /* JOUR NORMAL SELECTIONNE */
                        .custom-calendar .react-calendar__tile--active {
                            background-color: #4f46e5 !important; /* indigo-600 */
                            color: #ffffff !important;
                        }

                        /* ==== JOUR AVEC RENDEZ-VOUS = Vert Emeraude ==== */
                        .custom-calendar .react-calendar__tile.has-appointment {
                            background-color: #10b981 !important; /* emerald-500 */
                            color: #ffffff !important;
                            font-weight: bold !important;
                            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                        }

                        /* S'il est sélectionné ET qu'il a un rendez-vous (Vert plus foncé) */
                        .custom-calendar .react-calendar__tile--active.has-appointment {
                            background-color: #059669 !important; /* emerald-600 */
                            color: #ffffff !important;
                        }
                    `}</style>

                    {/* Conteneur du calendrier : Toujours clair même en dark mode */}
                    <div className="calendar-container mb-6 shrink-0 bg-slate-100 dark:bg-slate-200 rounded-xl p-3 shadow-inner">
                        <Calendar 
                            className="custom-calendar"
                            onChange={(v) => { 
                                const newDate = v as Date;
                                setSelectedDate(newDate); 
                                setFormDate(getLocalYYYYMMDD(newDate));
                                
                                if (view === 'ADMIT') setView('OVERVIEW');
                            }}
                            value={selectedDate}
                            tileClassName={({ date, view }) => {
                                if (view === 'month') {
                                    const dateStr = getLocalYYYYMMDD(date);
                                    // Si la date existe dans le Set, on lui donne la classe magique
                                    if (appointmentDatesSet.has(dateStr)) {
                                        return 'has-appointment';
                                    }
                                }
                                return '';
                            }}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 sticky top-0 bg-white dark:bg-gray-900 py-1 z-10">
                            Rendez-vous le {selectedDate.toLocaleDateString('fr-FR')}
                        </h3>
                        
                        {selectedDateAppointments.length === 0 ? (
                            <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center text-sm text-gray-500">
                                Aucun rendez-vous ce jour.
                            </div>
                        ) : (
                            selectedDateAppointments.map(app => (
                                <div key={app.id} className="p-3 mb-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                                            <Clock size={14} className="text-indigo-500" />
                                            {new Date(app.scheduled_datetime.replace(' ', 'T')).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${app.status === 'ARRIVED' ? 'bg-emerald-100 text-emerald-700' : app.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {app.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 truncate">
                                        Dr. {app.doctor?.user?.last_name || 'Non spécifié'} - {app.reason || 'Consultation'}
                                    </p>
                                    
                                    {app.status === 'SCHEDULED' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => openAdmit(app)} className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs font-medium transition-colors">
                                                Admettre
                                            </button>
                                            <button onClick={() => openReschedule(app)} className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded text-xs font-medium transition-colors">
                                                Déplacer
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ========================================= */}
                {/* DROITE: FORMULAIRES DYNAMIQUES */}
                {/* ========================================= */}
                <div className="w-full md:w-[55%] p-6 flex flex-col bg-slate-50 dark:bg-gray-800/50">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            {view !== 'OVERVIEW' && (
                                <button onClick={() => setView('OVERVIEW')} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                                    <ArrowLeft size={16} /> Retour
                                </button>
                            )}
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 rounded-full transition-colors">
                            ✕
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        
                        {/* VUE : OVERVIEW */}
                        {view === 'OVERVIEW' && (
                            <div className="flex flex-col items-center justify-center text-center h-full px-4">
                                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6">
                                    <CalendarPlus size={36} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Gestion des rendez-vous</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-xs">
                                    Sélectionnez une date sur le calendrier à gauche pour planifier ou modifier un créneau.
                                </p>
                                <button onClick={openNewAppointment} className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-colors">
                                    Nouveau Rendez-vous
                                </button>
                            </div>
                        )}

                        {/* VUE : NOUVEAU RDV */}
                        {view === 'NEW_APPOINTMENT' && (
                            <div className="space-y-5 animate-fadeIn">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                                    Planifier un Rendez-vous
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Date <span className="text-red-500">*</span></label>
                                        <input type="date" min={getLocalYYYYMMDD(new Date())} value={formDate} onChange={e => { setFormDate(e.target.value); setSelectedDate(new Date(e.target.value)); }} className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-slate-800 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Heure <span className="text-red-500">*</span></label>
                                        <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-slate-800 dark:text-white" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Médecin traitant <span className="text-red-500">*</span></label>
                                    <Select 
                                        options={doctorOptions} 
                                        onChange={opt => setNewApptDoctor(opt ? opt.value : '')} 
                                        placeholder="Rechercher un docteur ou département..." 
                                        menuPortalTarget={document.body} 
                                        styles={selectStyles} 
                                        className="text-sm"
                                        isSearchable
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Motif</label>
                                    <textarea rows={3} value={newApptReason} onChange={e => setNewApptReason(e.target.value)} placeholder="Raison de la consultation..." className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-slate-800 dark:text-white resize-none" />
                                </div>
                                <div className="pt-4">
                                    <button onClick={handleNewAppointment} disabled={!formDate || !formTime || !newApptDoctor || actionLoading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold disabled:opacity-50 transition-colors shadow-sm">
                                        {actionLoading ? "Enregistrement..." : "Confirmer la réservation"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* VUE : ADMISSION */}
                        {view === 'ADMIT' && targetAppointment && (
                            <div className="space-y-5 animate-fadeIn">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
                                    <LogIn size={20} className="text-emerald-600" /> Admission à l'accueil
                                </h3>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm mb-4">
                                    Rendez-vous de <strong>{new Date(targetAppointment.scheduled_datetime.replace(' ', 'T')).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</strong>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Nature de la visite <span className="text-red-500">*</span></label>
                                    <Select options={visitTypeOptions} onChange={opt => setVisitType(opt ? (opt.value as VisitType) : '')} placeholder="Sélectionner..." menuPortalTarget={document.body} styles={selectStyles} className="text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Orienter vers <span className="text-red-500">*</span></label>
                                    <Select options={roomOptions} onChange={opt => setAdmitRoom(opt ? opt.value : '')} placeholder="Choisir la salle d'attente..." menuPortalTarget={document.body} styles={selectStyles} className="text-sm" />
                                </div>
                                <div className="pt-4">
                                    <button onClick={handleAdmit} disabled={!visitType || !admitRoom || actionLoading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold disabled:opacity-50 transition-colors flex justify-center items-center gap-2 shadow-sm">
                                        {actionLoading ? "Traitement..." : <><CheckCircle2 size={18} /> Valider l'admission</>}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* VUE : REPROGRAMMATION */}
                        {view === 'RESCHEDULE' && targetAppointment && (
                            <div className="space-y-5 animate-fadeIn">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
                                    <CalendarClock size={20} className="text-blue-600" /> Reprogrammer
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Modifiez la date et l'heure prévues pour ce rendez-vous.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Nouvelle Date <span className="text-red-500">*</span></label>
                                        <input type="date" min={getLocalYYYYMMDD(new Date())} value={formDate} onChange={e => { setFormDate(e.target.value); setSelectedDate(new Date(e.target.value)); }} className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Nouvelle Heure <span className="text-red-500">*</span></label>
                                        <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-white" />
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button onClick={handleReschedule} disabled={!formDate || !formTime || actionLoading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:opacity-50 transition-colors shadow-sm">
                                        {actionLoading ? "Mise à jour..." : "Enregistrer la modification"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};