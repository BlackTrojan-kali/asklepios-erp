import React, { useEffect, useState, useMemo } from 'react';
import { 
    Users, Clock, ChevronRight, User, Activity, FileText, ClipboardCopy,
    Loader2, RefreshCw, CalendarDays, ArrowRightCircle, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import useAppointmentStore from '../../functions/base_hospital/useAppointmentStore';
import useConsultationStore from '../../functions/base_hospital/useConsultationStore';

// --- MODALES ---
import { AdmitToWaitingRoomModal } from '../../components/modals/Base_hopital/Appointment/AdmitToWaitingRoomModal';
import { AdmitToConsultationModal } from '../../components/modals/Base_hopital/Appointment/AdmitToConsultationModal';
import { ConsultationModal } from '../../components/modals/Base_hopital/Consultation/ConsultationModal';
import { PastConsultationPreviewModal } from '../../components/modals/Base_hopital/Consultation/PastConsultationPreviewModal';

const DoctorDashboard = () => {
    const { profile } = useAuth();
    const doctorId = profile?.profile_doctor?.id;
    const departmentId = profile?.profile_doctor?.department_id || 1;
    const doctorName = profile?.first_name || "Docteur";

    // --- STORES ---
    const { appointments, loading: appointmentsLoading, getAppointments } = useAppointmentStore();
    // On extrait historyPagination pour gérer le défilement des pages de l'historique
    const { consultations, loading: historyLoading, getConsultations, pagination: historyPagination } = useConsultationStore();
    
    // --- ÉTATS LOCAUX ---
    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
    const [historyPage, setHistoryPage] = useState(1); // Page courante de l'historique

    const [isAdmitWaitingModalOpen, setIsAdmitWaitingModalOpen] = useState(false);
    const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
    const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
    const [previewConsultationId, setPreviewConsultationId] = useState<number | null>(null);

    const todayStr = new Date().toISOString().split('T')[0];

    // Chargement de la file d'attente au montage
    useEffect(() => {
        if (doctorId) refreshQueue();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doctorId]);

    // Réinitialiser la page d'historique quand on change de patient
    useEffect(() => {
        setHistoryPage(1);
    }, [selectedAppointment?.patient?.id]);

    // Chargement de l'historique ciblé sur le patient sélectionné
    useEffect(() => {
        if (selectedAppointment?.patient?.id) {
            getConsultations(historyPage, { patient_id: selectedAppointment.patient.id });
        }
    }, [selectedAppointment?.patient?.id, historyPage, getConsultations]);

    const refreshQueue = () => {
        getAppointments(1, { profile_doctor_id: doctorId, date: todayStr });
    };

    // Logique de tri de la file d'attente
    const sortedAppointments = useMemo(() => {
        return [...appointments].sort((a, b) => {
            const getPriority = (appt: any) => {
                if (appt.status === 'CANCELLED') return 5;
                if (appt.status === 'SCHEDULED') return 3; 
                if (appt.visit?.status === 'IN_CONSULTATION') return 1; 
                if (appt.visit?.status === 'IN_WAITING_ROOM') return 2; 
                if (appt.visit?.status === 'COMPLETE') return 4; 
                return 6; 
            };

            const priorityA = getPriority(a);
            const priorityB = getPriority(b);

            if (priorityA !== priorityB) return priorityA - priorityB;

            if (priorityA === 2) {
                const queueA = a.visit?.queue_number || 999999;
                const queueB = b.visit?.queue_number || 999999;
                return queueA - queueB;
            }

            if (priorityA === 3) {
                return new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime();
            }

            return 0;
        });
    }, [appointments]);

    // --- BOUTONS D'ACTIONS ---
    const renderActionButtons = (appt: any) => {
        const apptStatus = appt?.status; 
        const visitStatus = appt?.visit?.status; 
        
        if (apptStatus === "SCHEDULED") {
            return (
                <button
                    onClick={() => setIsAdmitWaitingModalOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-md text-sm"
                >
                    <ArrowRightCircle size={18} /> Admettre en Salle d'Attente
                </button>
            );
        }

        if (apptStatus === "ARRIVED" && visitStatus === "IN_WAITING_ROOM") {
            return (
                <button
                    onClick={() => setIsAdmitModalOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#00a896] hover:bg-[#008f7f] text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-md text-sm"
                >
                    Faire Entrer en Cabinet <ArrowRightCircle size={18} />
                </button>
            );
        }

        if (apptStatus === "ARRIVED" && visitStatus === "IN_CONSULTATION") {
            return (
                <button
                    onClick={() => setIsConsultModalOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#003366] hover:bg-[#002244] text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-md text-sm animate-pulse"
                >
                    Démarrer l'Examen Clinique <Activity size={18} />
                </button>
            );
        }

        if (visitStatus === "COMPLETE") {
            return (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 size={18} /> Consultation Terminée
                </div>
            );
        }

        return null;
    };

    return (
        <div className="space-y-6 min-h-[85vh] flex flex-col">
            
            {/* EN-TÊTE BIENVENUE */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-[#003366] dark:text-blue-400 font-brand">Bonjour, Dr. {doctorName}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Espace de régulation clinique et de suivi de la file d'attente.</p>
                </div>
                <button onClick={refreshQueue} disabled={appointmentsLoading} className="flex items-center gap-2 px-4 py-2.5 bg-[#faf8f1] dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors text-sm text-gray-800 dark:text-gray-200 shadow-sm disabled:opacity-50">
                    <RefreshCw size={16} className={appointmentsLoading ? "animate-spin text-[#00a896]" : ""} />
                    Actualiser la file
                </button>
            </div>

            {/* SPLIT SCREEN INTERACTIF */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 items-stretch overflow-hidden min-h-[600px]">
                
                {/* BLOC GAUCHE : FILE D'ATTENTE */}
                <div className="w-full lg:w-5/12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 bg-[#003366] text-white flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2"><Users size={18} className="text-[#00a896]" /> <h2 className="font-bold text-sm uppercase tracking-wider">Patients Assignés</h2></div>
                        <span className="bg-[#00a896] text-white text-xs font-black px-2.5 py-0.5 rounded-full">{sortedAppointments.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-gray-800/30 custom-scrollbar">
                        {appointmentsLoading ? (
                            <div className="flex flex-col items-center justify-center py-20"><Loader2 size={36} className="animate-spin text-[#00a896] mb-2" /></div>
                        ) : sortedAppointments.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 dark:text-gray-500"><CalendarDays size={48} className="mx-auto opacity-30" /><p className="text-sm font-medium mt-2">Aucun rendez-vous assigné.</p></div>
                        ) : (
                            sortedAppointments.map((appt) => {
                                const isSelected = selectedAppointment?.id === appt.id;
                                const isScheduled = appt.status === "SCHEDULED";
                                const isWaiting = appt.status === "ARRIVED" && appt.visit?.status === "IN_WAITING_ROOM";
                                const isConsulting = appt.status === "ARRIVED" && appt.visit?.status === "IN_CONSULTATION";
                                const isComplete = appt.visit?.status === "COMPLETE";

                                return (
                                    <div key={appt.id} onClick={() => setSelectedAppointment(appt)} className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${isSelected ? 'bg-[#faf8f1] dark:bg-gray-700 border-[#00a896] shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`shrink-0 flex items-center justify-center font-black text-lg min-w-[3rem] h-12 rounded-xl ${isConsulting ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : isWaiting ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : isComplete ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                                {appt.visit?.queue_number && (isWaiting || isConsulting) ? `#${appt.visit.queue_number}` : <User size={20} />}
                                            </div>
                                            <div className="min-w-0 space-y-0.5">
                                                <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate">{appt.patient?.first_name} {appt.patient?.last_name}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Clock size={12} /> {isScheduled ? `RDV: ${new Date(appt.scheduled_datetime).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}` : `Arrivée: ${appt.visit?.arrival_time ? new Date(appt.visit.arrival_time).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}) : "..."}`}</p>
                                                <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-black uppercase mt-1 ${isConsulting ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : isWaiting ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' : isComplete ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                    {isComplete ? 'Terminé' : isConsulting ? 'En examen' : isWaiting ? 'En attente' : 'Prévu (Non arrivé)'}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-400 dark:text-gray-500 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* BLOC DROITE : DOSSIER PATIENT */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col overflow-hidden">
                    {selectedAppointment ? (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-[#faf8f1]/50 dark:bg-gray-900/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-full bg-[#00a896]/10 text-[#00a896] flex items-center justify-center"><User size={28} /></div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-white font-brand">{selectedAppointment.patient?.first_name} {selectedAppointment.patient?.last_name}</h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">Code Patient : {selectedAppointment.patient?.code || `ID_${selectedAppointment.patient?.id}`}</p>
                                    </div>
                                </div>
                                {renderActionButtons(selectedAppointment)}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col custom-scrollbar">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><ClipboardCopy size={14} /> Historique clinique</h3>
                                    
                                    {historyLoading ? (
                                        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-[#003366] dark:text-blue-400" /></div>
                                    ) : consultations.length === 0 ? (
                                        <div className="text-center py-12 bg-slate-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700"><FileText size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" /><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Première consultation.</p></div>
                                    ) : (
                                        <div className="space-y-4">
                                            {consultations.map((consult) => (
                                                <div 
                                                    key={consult.id}
                                                    onClick={() => setPreviewConsultationId(consult.id)}
                                                    className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm space-y-2 cursor-pointer hover:border-[#00a896] dark:hover:border-[#00a896] hover:shadow-md transition-all group"
                                                >
                                                    <div className="flex justify-between items-center text-xs font-mono border-b border-gray-50 dark:border-gray-700 pb-1.5 text-gray-400 dark:text-gray-500">
                                                        <span className="group-hover:text-[#00a896] transition-colors">Consulter les détails #{consult.id} &rarr;</span>
                                                        <span>{new Date(consult.created_at).toLocaleDateString('fr-FR')}</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-gray-200">Motif : <span className="font-medium text-gray-600 dark:text-gray-400">{consult.chief_complaint}</span></p>
                                                </div>
                                            ))}
                                            
                                            {/* PAGINATION DE L'HISTORIQUE DU PATIENT SÉLECTIONNÉ */}
                                            {historyPagination && historyPagination.lastPage > 1 && (
                                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                    <button 
                                                        onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                                        disabled={historyPage === 1 || historyLoading}
                                                        className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                    >
                                                        &larr; Précédent
                                                    </button>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium font-mono">
                                                        Page {historyPage} sur {historyPagination.lastPage}
                                                    </span>
                                                    <button 
                                                        onClick={() => setHistoryPage(p => Math.min(historyPagination.lastPage, p + 1))}
                                                        disabled={historyPage === historyPagination.lastPage || historyLoading}
                                                        className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                    >
                                                        Suivant &rarr;
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400 dark:text-gray-500"><Activity size={56} className="text-gray-200 dark:text-gray-700 mb-3 animate-pulse" /><p className="text-base font-bold text-slate-700 dark:text-gray-300 font-brand">Aucun patient sélectionné</p></div>
                    )}
                </div>
            </div>

            {/* --- MODALES --- */}
            {selectedAppointment && (
                <>
                    <AdmitToWaitingRoomModal 
                        isOpen={isAdmitWaitingModalOpen}
                        onClose={() => { setIsAdmitWaitingModalOpen(false); refreshQueue(); }}
                        appointment={selectedAppointment}
                        currentDepartmentId={departmentId}
                    />

                    <AdmitToConsultationModal 
                        isOpen={isAdmitModalOpen}
                        onClose={() => { setIsAdmitModalOpen(false); refreshQueue(); }}
                        appointment={selectedAppointment} 
                        currentDepartmentId={departmentId}
                    />

                    {selectedAppointment.visit && (
                        <ConsultationModal 
                            isOpen={isConsultModalOpen}
                            onClose={() => { setIsConsultModalOpen(false); setSelectedAppointment(null); refreshQueue(); }}
                            visit={{ ...selectedAppointment.visit, patient: selectedAppointment.patient }} 
                        />
                    )}
                </>
            )}

            <PastConsultationPreviewModal
                isOpen={!!previewConsultationId}
                onClose={() => setPreviewConsultationId(null)}
                consultationId={previewConsultationId}
            />

        </div>
    );
};

export default DoctorDashboard;