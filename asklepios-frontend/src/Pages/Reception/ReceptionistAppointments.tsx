import React, { useEffect, useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import { 
    CalendarDays, 
    RefreshCw, 
    Clock, 
    User, 
    AlertCircle,
    Plus,
    XCircle,
    UserCheck,
    Stethoscope
} from 'lucide-react';

// --- STORES & CONTEXTS ---
import useAppointmentStore from '../../functions/base_hospital/useAppointmentStore';
import useDoctorStore from '../../functions/base_hospital/useDoctorStore'; // <-- NOUVEL IMPORT
import { useAuth } from '../../contexts/AuthContext';

// --- TYPES ---
import type { AppointmentDto } from '../../types/AppointmentTypes';

// --- MODALES ---
import { DoctorRescheduleModal } from '../../components/modals/Base_hopital/Appointment/DoctorRescheduleModal';
import { AdmitToWaitingRoomModal } from '../../components/modals/Base_hopital/Appointment/AdmitToWaitingRoomModal';
import { MultiPatientSchedulingModal } from '../../components/modals/Base_hopital/Appointment/MultiPatientSchedulingModal';

const ReceptionistAppointments = () => {
    // --- STORES ---
    const { 
        appointments, 
        getAppointments, 
        cancelAppointment, 
        loading: appointmentsLoading,
        actionLoading
    } = useAppointmentStore();
    
    // NOUVEAU : Store des médecins
    const { allDoctors, getAllDoctors } = useDoctorStore(); 
    
    const { profile } = useAuth();

    // --- ÉTATS ---
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    
    // États d'ouverture des modales
    const [isMultiScheduleOpen, setIsMultiScheduleOpen] = useState(false);
    const [apptToReschedule, setApptToReschedule] = useState<AppointmentDto | null>(null);
    const [apptToAdmit, setApptToAdmit] = useState<AppointmentDto | null>(null);
    const [apptToCancel, setApptToCancel] = useState<AppointmentDto | null>(null); 

    // Identifiants récupérés depuis le réceptionniste connecté
    const currentCenterId = profile?.profile_reception?.center_id || 0;
    const receptionName = profile?.first_name || "Accueil";

    // --- HELPERS DE DATES ---
    const getLocalYYYYMMDD = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getLocalYYYYMMDDFromAPI = (datetimeStr: string) => {
        if (!datetimeStr) return '';
        const d = new Date(datetimeStr.replace(' ', 'T'));
        return getLocalYYYYMMDD(d);
    };

    // --- CHARGEMENT INITIAL (Tout le centre) ---
    const fetchAppointments = () => {
        if (!currentCenterId) return;
        // Le réceptionniste voit tous les RDV de son centre
        getAppointments(1, { center_id: currentCenterId }, 1000); 
    };

    useEffect(() => {
        if (currentCenterId) {
            fetchAppointments();
            // NOUVEAU : On charge la liste des docteurs du centre pour les menus déroulants
            getAllDoctors({ center_id: currentCenterId });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentCenterId]);

    // --- DÉRIVATION DES DONNÉES ---
    const appointmentDatesSet = useMemo(() => {
        const dates = new Set<string>();
        appointments.forEach(app => {
            if (app.scheduled_datetime && app.status !== 'CANCELLED') { 
                dates.add(getLocalYYYYMMDDFromAPI(app.scheduled_datetime)); 
            }
        });
        return dates;
    }, [appointments]);
    const selectedDateAppointments = useMemo(() => {
        const targetDateString = getLocalYYYYMMDD(selectedDate);
        return appointments.filter(app => {
            if (!app.scheduled_datetime) return false;
            return getLocalYYYYMMDDFromAPI(app.scheduled_datetime) === targetDateString;
        })
        .sort((a, b) => new Date(a.scheduled_datetime.replace(' ', 'T')).getTime() - new Date(b.scheduled_datetime.replace(' ', 'T')).getTime());
    }, [appointments, selectedDate]);


    // --- HANDLERS D'ACTIONS ---
    const handleOpenRescheduleModal = (app: AppointmentDto) => setApptToReschedule(app);
    const handleOpenAdmitModal = (app: AppointmentDto) => setApptToAdmit(app);
    
    const executeCancel = async () => {
        if (!apptToCancel) return;
        const success = await cancelAppointment(apptToCancel.id);
        if (success) {
            setApptToCancel(null);
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-6 relative">
            
            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-lg">
                        <CalendarDays size={26} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white font-brand">Accueil & Admissions</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-lato">Gérez le flux des patients pour tout le centre médical.</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchAppointments}
                        disabled={appointmentsLoading}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={appointmentsLoading ? "animate-spin text-orange-600" : ""} />
                        Actualiser
                    </button>
                </div>
            </div>

            {/* CONTENU PRINCIPAL : SPLIT VIEW */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                
                {/* STYLES DU GRAND CALENDRIER */}
                <style>{`
                    .big-hospital-calendar {
                        width: 100% !important;
                        height: 100% !important;
                        border: none !important;
                        background: transparent !important;
                        font-family: inherit !important;
                    }
                    .big-hospital-calendar .react-calendar__navigation { margin-bottom: 1.5rem; }
                    .big-hospital-calendar .react-calendar__navigation button {
                        color: #1e293b !important;
                        font-size: 1.25rem;
                        font-weight: 700 !important;
                        background: transparent !important;
                    }
                    .dark .big-hospital-calendar .react-calendar__navigation button { color: #f8fafc !important; }

                    .big-hospital-calendar .react-calendar__month-view__weekdays {
                        color: #64748b !important;
                        font-weight: 700 !important;
                        text-transform: uppercase;
                        font-size: 0.85rem;
                        padding-bottom: 1rem;
                        text-decoration: none !important;
                    }
                    .big-hospital-calendar .react-calendar__month-view__weekdays abbr { text-decoration: none !important; }

                    .big-hospital-calendar .react-calendar__tile {
                        color: #0f172a !important;
                        border-radius: 12px !important;
                        min-height: 90px !important;
                        height: 13vh !important;
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-start;
                        align-items: flex-end;
                        padding: 10px !important;
                        border: 1px solid #f1f5f9 !important;
                        background-color: white !important;
                        font-weight: 600;
                        font-size: 1rem;
                        transition: all 0.2s ease;
                    }
                    .dark .big-hospital-calendar .react-calendar__tile {
                        background-color: #1e293b !important;
                        border-color: #334155 !important;
                        color: #f8fafc !important;
                    }

                    .big-hospital-calendar .react-calendar__tile:enabled:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        z-index: 10;
                    }

                    .big-hospital-calendar .react-calendar__tile--active {
                        border: 2px solid #f97316 !important;
                        background-color: #ffedd5 !important;
                        color: #c2410c !important;
                    }
                    .dark .big-hospital-calendar .react-calendar__tile--active {
                        background-color: rgba(249, 115, 22, 0.2) !important;
                        border-color: #fb923c !important;
                        color: #fb923c !important;
                    }

                    .big-hospital-calendar .react-calendar__tile.has-appointment {
                        background-color: #ecfdf5 !important;
                        border-color: #a7f3d0 !important;
                        color: #047857 !important;
                    }
                    .dark .big-hospital-calendar .react-calendar__tile.has-appointment {
                        background-color: rgba(16, 185, 129, 0.15) !important;
                        border-color: rgba(16, 185, 129, 0.3) !important;
                        color: #34d399 !important;
                    }

                    .big-hospital-calendar .react-calendar__tile--active.has-appointment {
                        border: 2px solid #10b981 !important;
                        background-color: #d1fae5 !important;
                    }
                    .dark .big-hospital-calendar .react-calendar__tile--active.has-appointment {
                        background-color: rgba(16, 185, 129, 0.3) !important;
                        border-color: #10b981 !important;
                    }

                    .appt-dot { width: 8px; height: 8px; border-radius: 50%; background-color: #10b981; margin-top: auto; align-self: center; }
                `}</style>

                {/* ZONE CALENDRIER */}
                <div className="w-full lg:w-2/3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
                    <Calendar 
                        className="big-hospital-calendar"
                        onChange={(v) => setSelectedDate(v as Date)}
                        onClickDay={(value) => {
                            const dateStr = getLocalYYYYMMDD(value);
                            // On ouvre la modale de création si on clique sur un jour vide
                            if (!appointmentDatesSet.has(dateStr)) {
                                setIsMultiScheduleOpen(true);
                            }
                        }}
                        value={selectedDate}
                        tileContent={({ date, view }) => {
                            if (view === 'month') {
                                const dateStr = getLocalYYYYMMDD(date);
                                if (appointmentDatesSet.has(dateStr)) return <div className="appt-dot"></div>;
                            }
                            return null;
                        }}
                        tileClassName={({ date, view }) => {
                            if (view === 'month') {
                                const dateStr = getLocalYYYYMMDD(date);
                                if (appointmentDatesSet.has(dateStr)) return 'has-appointment';
                            }
                            return '';
                        }}
                    />
                </div>

                {/* ZONE AGENDA DU JOUR */}
                <div className="w-full lg:w-1/3 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden h-full">
                    
                    <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 font-brand">
                                <Clock className="text-orange-500" size={20} />
                                File Globale
                            </h2>
                            <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mt-1 capitalize font-lato">
                                {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                        </div>
                        
                        <button 
                            onClick={() => setIsMultiScheduleOpen(true)}
                            className="p-2.5 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/30 dark:hover:bg-orange-900/60 text-orange-600 dark:text-orange-400 rounded-lg transition-colors shadow-sm"
                            title="Planifier un rendez-vous"
                        >
                            <Plus size={20} strokeWidth={3} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-4">
                        {appointmentsLoading ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                <RefreshCw className="animate-spin mb-2" size={24} />
                                <p className="text-sm">Chargement du planning...</p>
                            </div>
                        ) : selectedDateAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center">
                                <AlertCircle size={32} className="mb-3 opacity-50" />
                                <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Aucun patient prévu ce jour</p>
                            </div>
                        ) : (
                            selectedDateAppointments.map(app => {
                                const isScheduled = app.status === 'SCHEDULED';
                                const isWaiting = app.status === 'ARRIVED' && app.visit?.status === 'IN_WAITING_ROOM';
                                const isConsulting = app.status === 'ARRIVED' && app.visit?.status === 'IN_CONSULTATION';
                                const isComplete = app.visit?.status === 'COMPLETE';
                                const isCancelled = app.status === 'CANCELLED';

                                return (
                                    <div key={app.id} className={`group bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border ${isCancelled ? 'border-red-200 dark:border-red-900/50 opacity-60' : 'border-gray-100 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700'} transition-all`}>
                                        
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-orange-50 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 font-bold px-2 py-1 rounded text-sm font-mono">
                                                    {new Date(app.scheduled_datetime.replace(' ', 'T')).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {/* BADGE STATUT */}
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                                    isComplete ? 'bg-emerald-100 text-emerald-700' :
                                                    isConsulting ? 'bg-blue-100 text-blue-700' :
                                                    isWaiting ? 'bg-amber-100 text-amber-700' :
                                                    isCancelled ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                    {isComplete ? 'Terminé' : isConsulting ? 'En Examen' : isWaiting ? 'En Attente' : isCancelled ? 'Annulé' : 'Prévu'}
                                                </span>
                                            </div>
                                            
                                            {/* Bouton Annuler (Uniquement si prévu) */}
                                            {isScheduled && (
                                                <button 
                                                    onClick={() => setApptToCancel(app)}
                                                    className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors p-1"
                                                    title="Annuler ce rendez-vous"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-slate-500 shrink-0">
                                                <User size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-800 dark:text-white text-sm truncate font-brand">
                                                    {app.patient?.first_name} {app.patient?.last_name}
                                                </p>
                                                <p className="text-xs text-gray-500 font-mono">{app.patient?.code || `ID_${app.patient?.id}`}</p>
                                            </div>
                                        </div>

                                        {/* INFO MÉDECIN */}
                                        <div className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded">
                                            <Stethoscope size={14} className="text-blue-500"/> Dr. {app.doctor?.user?.first_name || 'Non assigné'}
                                        </div>

                                        {/* ACTIONS CONDITIONNELLES (Réceptionniste) */}
                                        {isScheduled && (
                                            <div className="mt-4 flex gap-2">
                                                <button 
                                                    onClick={() => handleOpenAdmitModal(app)}
                                                    className="flex-1 py-1.5 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-orange-100 dark:border-orange-800"
                                                >
                                                    <UserCheck size={14} /> Admettre
                                                </button>
                                                <button 
                                                    onClick={() => handleOpenRescheduleModal(app)}
                                                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded text-xs font-semibold transition-colors border border-gray-200 dark:border-gray-600"
                                                >
                                                    Reporter
                                                </button>
                                            </div>
                                        )}

                                        {/* Feedback Visuel si le patient est déjà dans le flux */}
                                        {(isWaiting || isConsulting || isComplete) && (
                                            <div className="mt-3 text-xs text-center font-medium text-gray-400 border-t border-dashed border-gray-200 dark:border-gray-700 pt-2">
                                                Dossier transféré à la clinique
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>

            {/* --- MODALE DE CONFIRMATION D'ANNULATION --- */}
            {apptToCancel && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-500">
                            <AlertCircle size={28} />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Annuler le rendez-vous ?</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 font-lato">
                            Êtes-vous sûr de vouloir annuler la consultation de <strong>{apptToCancel.patient?.first_name} {apptToCancel.patient?.last_name}</strong> avec le Dr. {apptToCancel.doctor?.user?.name} ?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setApptToCancel(null)} 
                                disabled={actionLoading}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Non, conserver
                            </button>
                            <button 
                                onClick={executeCancel} 
                                disabled={actionLoading}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {actionLoading ? "Annulation..." : "Oui, annuler"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- INTÉGRATION DES AUTRES MODALES --- */}
            
            <MultiPatientSchedulingModal
                isOpen={isMultiScheduleOpen}
                onClose={() => setIsMultiScheduleOpen(false)}
                currentCenterId={currentCenterId}
                doctors={allDoctors} // <-- CORRECTION ICI : La liste des médecins est bien passée à la modale
                prefilledDate={selectedDate}
                isDateLocked={false} 
            />

            <DoctorRescheduleModal
                isOpen={!!apptToReschedule}
                onClose={() => {
                    setApptToReschedule(null);
                    fetchAppointments();
                }}
                appointment={apptToReschedule}
            />

            {/* La modale vitale pour l'accueil */}
            {apptToAdmit && (
                <AdmitToWaitingRoomModal
                    isOpen={!!apptToAdmit}
                    onClose={() => {
                        setApptToAdmit(null);
                        fetchAppointments();
                    }}
                    appointment={apptToAdmit}
                    // IMPORTANT : On passe l'ID du département du médecin concerné pour charger ses salles d'attente
                    currentDepartmentId={apptToAdmit.doctor?.department_id || 0}
                />
            )}
            
        </div>
    );
};

export default ReceptionistAppointments;