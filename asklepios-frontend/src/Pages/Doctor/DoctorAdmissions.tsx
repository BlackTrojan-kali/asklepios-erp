import React, { useEffect, useState } from 'react';
import { 
    BedDouble, Activity, LogOut, CalendarDays, 
    User, AlertCircle, RefreshCw, FileText, Loader2
} from 'lucide-react';

// --- STORES & CONTEXTS ---
import { useAuth } from '../../contexts/AuthContext';
import useAdmissionStore from '../../functions/base_hospital/useAdmissionStore';

// --- MODALES ---
import { ConsultationModal } from '../../components/modals/Base_hopital/Consultation/ConsultationModal';
import { DischargePatientModal } from '../../components/modals/Base_hopital/Admission/DischargePatientModal';

const DoctorAdmissions = () => {
    const { profile } = useAuth();
    const doctorName = profile?.first_name || "Docteur";

    // --- STORES ---
    const { admissions, getAdmissions, loading } = useAdmissionStore();

    // --- ÉTATS LOCAUX ---
    const [consultingAdmission, setConsultingAdmission] = useState<any | null>(null);
    const [dischargingAdmission, setDischargingAdmission] = useState<any | null>(null);

    // --- CHARGEMENT INITIAL ---
    const fetchAdmissions = () => {
        // On récupère uniquement les patients actuellement dans un lit (ADMITTED)
        getAdmissions(1, { status: 'ADMITTED' }, 100); 
    };

    useEffect(() => {
        fetchAdmissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- UTILITAIRE : Calculer les jours d'hospitalisation ---
    const getDaysAdmitted = (dateStr: string) => {
        const admissionDate = new Date(dateStr);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - admissionDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-6 relative overflow-hidden">
            
            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl">
                        <BedDouble size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-[#003366] dark:text-blue-400 font-brand">Service d'Hospitalisation</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-lato">
                            Dr. {doctorName} - Suivi des patients admis et visites de contrôle.
                        </p>
                    </div>
                </div>
                
                <button 
                    onClick={fetchAdmissions}
                    disabled={loading}
                    className="flex items-center gap-2 bg-[#faf8f1] dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                    <RefreshCw size={18} className={loading ? "animate-spin text-blue-600" : ""} />
                    Actualiser le service
                </button>
            </div>

            {/* CONTENU PRINCIPAL : GRILLE DES LITS */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-[#003366] dark:text-blue-400">
                        <Loader2 size={48} className="animate-spin mb-4" />
                        <p className="text-sm font-medium font-mono tracking-widest uppercase">Inspection des chambres...</p>
                    </div>
                ) : admissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                        <AlertCircle size={48} className="mb-3 opacity-50" />
                        <p className="text-lg font-bold text-slate-600 dark:text-gray-300 font-brand">Service vide</p>
                        <p className="text-sm mt-1">Aucun patient n'est actuellement hospitalisé.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {admissions.map((admission) => {
                            const days = getDaysAdmitted(admission.admission_date);
                            
                            return (
                                <div key={admission.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group">
                                    
                                    {/* En-tête de la carte (Chambre / Lit) */}
                                    <div className="bg-[#003366] p-4 flex justify-between items-center text-white">
                                        <div className="flex items-center gap-2 font-bold font-brand">
                                            <BedDouble size={18} className="text-blue-300" />
                                            <span>
                                                {admission.bed?.facilityRoom?.name ? `Ch. ${admission.bed.facilityRoom.name}` : 'Chambre indéfinie'} 
                                                <span className="opacity-60 mx-1">|</span> 
                                                Lit {admission.bed?.bed_number || '?'}
                                            </span>
                                        </div>
                                        <div className="text-[10px] bg-blue-500/30 px-2 py-1 rounded font-mono font-bold tracking-wider">
                                            JOUR {days}
                                        </div>
                                    </div>

                                    {/* Corps de la carte (Patient & Infos) */}
                                    <div className="p-5 flex-1 flex flex-col space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-[#00a896]/10 text-[#00a896] flex items-center justify-center shrink-0">
                                                <User size={24} />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-slate-800 dark:text-white text-lg truncate font-brand">
                                                    {admission.patient?.first_name} {admission.patient?.last_name}
                                                </h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                    Code: {admission.patient?.code || `ID_${admission.patient?.id}`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-sm bg-slate-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex-1">
                                            <p className="text-xs text-gray-400 font-bold uppercase mb-1 flex items-center gap-1"><FileText size={12}/> Motif d'admission</p>
                                            <p className="text-gray-700 dark:text-gray-300 line-clamp-3 font-medium">
                                                {admission.reason_for_admission}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
                                            <span className="flex items-center gap-1"><CalendarDays size={14} /> Entré le {new Date(admission.admission_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Actions (Pied de carte) */}
                                    <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 grid grid-cols-2 gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                                        {/* Action 1 : Visite de contrôle (Créer une consultation liée à la visite de l'admission) */}
                                        <button 
                                            onClick={() => {
                                                if(!admission.patient_visit_id) {
                                                    alert("Ce patient n'a pas de dossier de visite actif lié à son admission.");
                                                    return;
                                                }
                                                setConsultingAdmission(admission);
                                            }}
                                            className="flex items-center justify-center gap-1.5 py-2.5 bg-[#00a896] hover:bg-[#008f7f] text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                                        >
                                            <Activity size={16} /> Constantes & Soins
                                        </button>
                                        
                                        {/* Action 2 : Autoriser la sortie */}
                                        <button 
                                            onClick={() => setDischargingAdmission(admission)}
                                            className="flex items-center justify-center gap-1.5 py-2.5 bg-white dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                        >
                                            <LogOut size={16} /> Autoriser Sortie
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* --- MODALES PROTOCOLAIRES --- */}
            
            {/* 1. Modale de Consultation (Tournée du médecin) */}
            {consultingAdmission && consultingAdmission.patientVisit && (
                <ConsultationModal 
                    isOpen={!!consultingAdmission}
                    onClose={() => setConsultingAdmission(null)}
                    isHospitalization={true}
                    visit={{ 
                        ...consultingAdmission.patientVisit, 
                        patient: consultingAdmission.patient,
                        id: consultingAdmission.patient_visit_id 
                    }} 
                />
            )}

            {/* 2. Modale de Sortie d'hospitalisation */}
            {dischargingAdmission && (
                <DischargePatientModal
                    isOpen={!!dischargingAdmission}
                    onClose={() => {
                        setDischargingAdmission(null);
                        fetchAdmissions(); // CRITIQUE : Rafraîchir pour voir le lit disparaître de la grille !
                    }}
                    admission={dischargingAdmission}
                />
            )}

        </div>
    );
};

export default DoctorAdmissions;