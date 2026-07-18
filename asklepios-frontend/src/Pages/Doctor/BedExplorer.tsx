import React, { useEffect, useState } from 'react';
import { 
    BedDouble, Activity, LogOut, CheckCircle, 
    AlertTriangle, RefreshCw, Loader2, Filter, 
    User, FileText, History, X, ClipboardCopy, ChevronRight
} from 'lucide-react';

// --- STORES ---
import useBedStore from '../../functions/base_hospital/useBedStore';
import useConsultationStore from '../../functions/base_hospital/useConsultationStore'; // 👉 Import direct

// --- TYPES & MODALES ---
import type { FacilityRoomDto } from '../../types/FacilityRoomTypes';
import type { BedDto } from '../../types/AdmissionTypes';
import { PastConsultationPreviewModal } from '../../components/modals/Base_hopital/Consultation/PastConsultationPreviewModal';

interface BedExplorerProps {
    room: FacilityRoomDto;
    refreshTrigger?: number;
    onAdmitPatient: (bed: BedDto) => void;
    onDischargePatient: (admission: any) => void;
    onStartConsultation: (admission: any) => void;
    onViewPatient: (patient: any) => void;
    onUpdateBedStatus?: (bed: BedDto) => void; 
}

export const BedExplorer: React.FC<BedExplorerProps> = ({
    room,
    refreshTrigger = 0,
    onAdmitPatient,
    onDischargePatient,
    onStartConsultation,
    onViewPatient,
    onUpdateBedStatus,
}) => {
    // --- STORES ---
    const { beds, getBeds, loading, pagination } = useBedStore();
    const { consultations, loading: historyLoading, getConsultations, pagination: historyPagination } = useConsultationStore();

    // --- ÉTATS LOCAUX ---
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    
    // États pour le panneau d'historique intégré
    const [patientForHistory, setPatientForHistory] = useState<any | null>(null);
    const [historyPage, setHistoryPage] = useState(1);
    const [previewConsultationId, setPreviewConsultationId] = useState<number | null>(null);

    // --- CHARGEMENT DES LITS ---
    const fetchBeds = () => {
        if (room?.id) {
            getBeds(room.id, currentPage, { state: statusFilter || undefined }, 18);
        }
    };

    useEffect(() => {
        fetchBeds();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room.id, currentPage, statusFilter, refreshTrigger]);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter]);

    // --- CHARGEMENT DE L'HISTORIQUE ---
    const handleViewHistory = (patient: any) => {
        setPatientForHistory(patient);
        setHistoryPage(1);
        getConsultations(1, { patient_id: patient.id });
    };

    const changeHistoryPage = (newPage: number) => {
        setHistoryPage(newPage);
        if (patientForHistory) {
            getConsultations(newPage, { patient_id: patientForHistory.id });
        }
    };

    // --- HELPERS CSS ---
    const getCardStyles = (state: string) => {
        switch (state) {
            case 'AVAILABLE': return 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10 hover:border-emerald-400';
            case 'OCCUPIED': return 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10 hover:border-blue-400';
            case 'CLEANING': return 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10 hover:border-amber-400';
            case 'MAINTENANCE': return 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10 hover:border-red-400';
            default: return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800';
        }
    };

    const getStateBadge = (state: string) => {
        switch (state) {
            case 'AVAILABLE': return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Libre</span>;
            case 'OCCUPIED': return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Occupé</span>;
            case 'CLEANING': return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Nettoyage</span>;
            case 'MAINTENANCE': return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Maintenance</span>;
            default: return null;
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            
            {/* BARRE D'OUTILS ET FILTRES */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    <Filter size={14} /> Filtrer :
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {['', 'AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'].map((state) => (
                        <button
                            key={state}
                            onClick={() => setStatusFilter(state)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                statusFilter === state
                                    ? 'bg-[#003366] text-white shadow-sm dark:bg-blue-600'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {state === '' ? 'Tous' : state === 'AVAILABLE' ? 'Libres' : state === 'OCCUPIED' ? 'Occupés' : state === 'CLEANING' ? 'Nettoyage' : 'Hors service'}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={fetchBeds}
                    className="p-2 text-gray-500 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm"
                    title="Actualiser la chambre"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin text-[#00a896]" : ""} />
                </button>
            </div>

            {/* CONTENEUR PRINCIPAL (Split Screen avec l'historique) */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
                
                {/* COLONNE GAUCHE : GRILLE DES LITS */}
                <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-100 dark:border-gray-800">
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/50 dark:bg-gray-900/10">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                <Loader2 size={32} className="animate-spin text-[#00a896] mb-2" />
                                <p className="text-xs font-mono uppercase tracking-widest">Inspection...</p>
                            </div>
                        ) : beds.length === 0 ? (
                            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                                <BedDouble size={48} className="mx-auto opacity-30 mb-2" />
                                <p className="text-sm font-medium">Aucun lit trouvé.</p>
                            </div>
                        ) : (
                            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${patientForHistory ? 'xl:grid-cols-2' : 'lg:grid-cols-3 xl:grid-cols-4'}`}>
                                {beds.map((bed) => {
                                    const admissionsArray = (bed as any).admissions || [];
                                    const activeAdmission = (bed as any).current_admission || 
                                                            (bed as any).active_admission || 
                                                            admissionsArray.find((a: any) => a.status === 'ADMITTED') || 
                                                            null;
                                    const isOccupied = bed.state === 'OCCUPIED';

                                    return (
                                        <div 
                                            key={bed.id}
                                            className={`p-4 rounded-xl border flex flex-col h-full min-h-[12rem] transition-all shadow-sm ${getCardStyles(bed.state)}`}
                                        >
                                            {/* Header Carte */}
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-2 rounded-lg ${isOccupied ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'}`}>
                                                        <BedDouble size={16} />
                                                    </div>
                                                    <span className="font-bold text-sm text-slate-800 dark:text-white font-brand">Lit {bed.bed_number}</span>
                                                </div>
                                                {getStateBadge(bed.state)}
                                            </div>

                                            {/* Corps Carte */}
                                            <div className="flex-1 flex flex-col justify-center min-w-0 mt-3 mb-3">
                                                {isOccupied ? (
                                                    activeAdmission && activeAdmission.patient ? (
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                                                                <User size={10}/> Occupant
                                                            </p>
                                                            <p className="font-bold text-sm text-slate-800 dark:text-white truncate">
                                                                {activeAdmission.patient.first_name} {activeAdmission.patient.last_name}
                                                            </p>
                                                            <p className="text-[11px] text-gray-500 font-mono truncate">
                                                                {activeAdmission.patient.patient_code || `ID_${activeAdmission.patient.id}`}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                                            <p className="text-xs text-red-600 font-bold flex items-center gap-1"><AlertTriangle size={12}/> Synchro...</p>
                                                        </div>
                                                    )
                                                ) : bed.state === 'CLEANING' ? (
                                                    <p className="text-xs text-amber-600 font-medium flex items-center gap-1"><CheckCircle size={14}/> Désinfection requise</p>
                                                ) : bed.state === 'MAINTENANCE' ? (
                                                    <p className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertTriangle size={14}/> Hors service</p>
                                                ) : (
                                                    <p className="text-xs text-emerald-600 font-medium italic">Prêt à recevoir un patient</p>
                                                )}
                                            </div>

                                            {/* Pied de Carte (Boutons d'action Responsive) */}
                                            <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700/60 flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                                                
                                                {bed.state === 'AVAILABLE' && (
                                                    <button onClick={() => onAdmitPatient(bed)} className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-xs transition-colors">
                                                        Hospitaliser
                                                    </button>
                                                )}

                                                {isOccupied && activeAdmission && activeAdmission.patient && (
                                                    <div className="flex flex-wrap w-full gap-1.5">
                                                        {/* Dossier */}
                                                        <button 
                                                            onClick={() => onViewPatient(activeAdmission.patient)}
                                                            className="flex-1 min-w-[70px] flex items-center justify-center gap-1.5 px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-bold rounded-md text-[11px] lg:text-xs transition-colors"
                                                            title="Dossier Médical"
                                                        >
                                                            <FileText size={14} /> <span className="hidden sm:inline">Dossier</span>
                                                        </button>

                                                        {/* 👉 BOUTON HISTORIQUE (Déclenche l'appel et le panneau droit) */}
                                                        <button 
                                                            onClick={() => handleViewHistory(activeAdmission.patient)}
                                                            className={`flex-1 min-w-[70px] flex items-center justify-center gap-1.5 px-2 py-1.5 font-bold rounded-md text-[11px] lg:text-xs transition-colors ${
                                                                patientForHistory?.id === activeAdmission.patient.id 
                                                                    ? 'bg-[#003366] text-white shadow-inner' 
                                                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-gray-700 dark:text-gray-300'
                                                            }`}
                                                            title="Historique des consultations"
                                                        >
                                                            <History size={14} /> <span className="hidden sm:inline">Hist.</span>
                                                        </button>

                                                        {/* Visite */}
                                                        <button 
                                                            onClick={() => onStartConsultation(activeAdmission)}
                                                            className="flex-1 min-w-[70px] flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#00a896] hover:bg-[#008f7f] text-white font-bold rounded-md text-[11px] lg:text-xs transition-colors"
                                                            title="Visite Médicale"
                                                        >
                                                            <Activity size={14} /> <span className="hidden sm:inline">Visite</span>
                                                        </button>

                                                        {/* Sortie (Bouton Icône) */}
                                                        <button 
                                                            onClick={() => onDischargePatient(activeAdmission)}
                                                            className="px-2.5 py-1.5 border border-amber-200 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                                                            title="Autoriser la sortie"
                                                        >
                                                            <LogOut size={14} />
                                                        </button>
                                                    </div>
                                                )}

                                                {(bed.state === 'CLEANING' || bed.state === 'MAINTENANCE') && onUpdateBedStatus && (
                                                    <button onClick={() => onUpdateBedStatus(bed)} className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-bold rounded-md text-xs border dark:border-gray-600 transition-colors">
                                                        Marquer Disponible
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    
                    {/* Pagination des lits */}
                    {pagination && pagination.lastPage > 1 && (
                        <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between shrink-0">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading} className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50">Précédent</button>
                            <span className="text-xs text-gray-500">Page {currentPage} / {pagination.lastPage}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(pagination.lastPage, p + 1))} disabled={currentPage === pagination.lastPage || loading} className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50">Suivant</button>
                        </div>
                    )}
                </div>

                {/* COLONNE DROITE : PANNEAU HISTORIQUE (Apparaît au clic) */}
                {patientForHistory && (
                    <div className="w-full lg:w-96 xl:w-[400px] flex flex-col bg-white dark:bg-gray-800 shadow-[inset_1px_0_0_rgba(0,0,0,0.1)] dark:shadow-[inset_1px_0_0_rgba(255,255,255,0.05)] z-10">
                        {/* Header Panel */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <ClipboardCopy size={18} />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm font-bold text-slate-800 dark:text-white font-brand truncate">Historique Clinique</h2>
                                    <p className="text-[11px] text-gray-500 font-mono truncate">{patientForHistory.first_name} {patientForHistory.last_name}</p>
                                </div>
                            </div>
                            <button onClick={() => setPatientForHistory(null)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content Panel */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30 dark:bg-gray-900/20">
                            {historyLoading ? (
                                <div className="flex flex-col items-center justify-center py-10">
                                    <Loader2 size={24} className="animate-spin text-[#00a896] mb-2" />
                                </div>
                            ) : consultations.length === 0 ? (
                                <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                    <FileText size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                    <p className="text-xs font-medium text-gray-500">Aucune consultation passée.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {consultations.map((consult) => (
                                        <div 
                                            key={consult.id}
                                            onClick={() => setPreviewConsultationId(consult.id)}
                                            className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm cursor-pointer hover:border-[#00a896] dark:hover:border-[#00a896] transition-all group"
                                        >
                                            <div className="flex justify-between items-center text-[11px] font-mono border-b border-gray-50 dark:border-gray-700 pb-1.5 mb-1.5 text-gray-400">
                                                <span className="font-bold text-slate-700 dark:text-gray-300">Consult. #{consult.id}</span>
                                                <span className="flex items-center gap-1">
                                                    {new Date(consult.created_at).toLocaleDateString('fr-FR')}
                                                    <ChevronRight size={12} className="group-hover:text-[#00a896] transition-colors" />
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-800 dark:text-gray-200 line-clamp-2 leading-relaxed">
                                                <span className="text-gray-500 font-medium">Motif:</span> {consult.chief_complaint}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination Historique */}
                            {historyPagination && historyPagination.lastPage > 1 && (
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <button onClick={() => changeHistoryPage(Math.max(1, historyPage - 1))} disabled={historyPage === 1 || historyLoading} className="px-2 py-1 text-[11px] bg-white border rounded disabled:opacity-50">&larr; Préc</button>
                                    <span className="text-[10px] text-gray-500">{historyPage} / {historyPagination.lastPage}</span>
                                    <button onClick={() => changeHistoryPage(Math.min(historyPagination.lastPage, historyPage + 1))} disabled={historyPage === historyPagination.lastPage || historyLoading} className="px-2 py-1 text-[11px] bg-white border rounded disabled:opacity-50">Suiv &rarr;</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <PastConsultationPreviewModal
                isOpen={!!previewConsultationId}
                onClose={() => setPreviewConsultationId(null)}
                consultationId={previewConsultationId}
            />
        </div>
    );
};