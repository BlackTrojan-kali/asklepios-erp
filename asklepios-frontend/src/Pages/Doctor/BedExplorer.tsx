import React, { useEffect, useState } from 'react';
import { 
    BedDouble, Activity, LogOut, CheckCircle, 
    AlertTriangle, RefreshCw, Loader2, Filter, User, FileText
} from 'lucide-react';
import useBedStore from '../../functions/base_hospital/useBedStore';
import type { FacilityRoomDto } from '../../types/FacilityRoomTypes';
import type { BedDto } from '../../types/AdmissionTypes';

interface BedExplorerProps {
    room: FacilityRoomDto;
    onAdmitPatient: (bed: BedDto) => void;
    onDischargePatient: (admission: any) => void;
    onStartConsultation: (admission: any) => void;
    onViewPatient: (patient: any) => void;
    // Ajoute cette ligne si tu as implémenté le changement de statut (AVAILABLE/CLEANING)
    onUpdateBedStatus?: (bed: BedDto) => void; 
}

export const BedExplorer: React.FC<BedExplorerProps> = ({
    room,
    onAdmitPatient,
    onDischargePatient,
    onStartConsultation,
    onViewPatient,
    onUpdateBedStatus
}) => {
    // --- STORES ---
    const { beds, getBeds, loading, pagination } = useBedStore();

    // --- ÉTATS LOCAUX ---
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);

    // --- CHARGEMENT DES LITS DE LA CHAMBRE ---
    const fetchBeds = () => {
        if (room?.id) {
            getBeds(room.id, currentPage, { state: statusFilter || undefined }, 18);
        }
    };

    useEffect(() => {
        fetchBeds();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room.id, currentPage, statusFilter]);

    // Revenir à la page 1 si le filtre change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter]);

    // Helpers pour le style CSS dynamique selon l'état du lit
    const getCardStyles = (state: string) => {
        switch (state) {
            case 'AVAILABLE':
                return 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10 hover:border-emerald-400';
            case 'OCCUPIED':
                return 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10 hover:border-blue-400';
            case 'CLEANING':
                return 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10 hover:border-amber-400';
            case 'MAINTENANCE':
                return 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10 hover:border-red-400';
            default:
                return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800';
        }
    };

    const getStateBadge = (state: string) => {
        switch (state) {
            case 'AVAILABLE':
                return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Libre</span>;
            case 'OCCUPIED':
                return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Occupé</span>;
            case 'CLEANING':
                return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Nettoyage</span>;
            case 'MAINTENANCE':
                return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Maintenance</span>;
            default:
                return null;
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            
            {/* BARRE D'OUTILS ET FILTRES (Style explorateur) */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    <Filter size={14} /> Filtrer par statut :
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
                            {state === '' ? 'Tous les lits' : state === 'AVAILABLE' ? 'Libres' : state === 'OCCUPIED' ? 'Occupés' : state === 'CLEANING' ? 'En Nettoyage' : 'Hors service'}
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

            {/* GRILLE DES LITS */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50 dark:bg-gray-900/10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <Loader2 size={32} className="animate-spin text-[#00a896] mb-2" />
                        <p className="text-xs font-mono uppercase tracking-widest">Inspection de la chambre...</p>
                    </div>
                ) : beds.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                        <BedDouble size={48} className="mx-auto opacity-30 mb-2" />
                        <p className="text-sm font-medium">Aucun lit ne correspond aux critères de recherche.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {beds.map((bed) => {
                            // --- RÉCUPÉRATION ROBUSTE DE L'ADMISSION ---
                            // On fouille dans les clés possibles renvoyées par Laravel
                            const admissionsArray = (bed as any).admissions || [];
                            const activeAdmission = (bed as any).current_admission || 
                                                    (bed as any).active_admission || 
                                                    admissionsArray.find((a: any) => a.status === 'ADMITTED') || 
                                                    null;
                            
                            const isOccupied = bed.state === 'OCCUPIED';

                            return (
                                <div 
                                    key={bed.id}
                                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all shadow-sm h-44 ${getCardStyles(bed.state)}`}
                                >
                                    {/* Ligne haute : Numéro de lit et Statut */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-lg ${isOccupied ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'}`}>
                                                <BedDouble size={18} />
                                            </div>
                                            <span className="font-bold text-sm text-slate-800 dark:text-white font-brand">Lit {bed.bed_number}</span>
                                        </div>
                                        {getStateBadge(bed.state)}
                                    </div>

                                    {/* Zone centrale : Identité du patient si occupé */}
                                    <div className="flex-1 flex flex-col justify-center min-w-0 mt-3 mb-3">
                                        {isOccupied ? (
                                            activeAdmission && activeAdmission.patient ? (
                                                <div className="space-y-0.5">
                                                    <p className="text-xs text-gray-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                                                        <User size={12}/> Occupant
                                                    </p>
                                                    <p className="font-bold text-sm text-slate-800 dark:text-white truncate font-brand">
                                                        {activeAdmission.patient.first_name} {activeAdmission.patient.last_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 font-mono">
                                                        Code: {activeAdmission.patient.patient_code || `ID_${activeAdmission.patient.id}`}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800">
                                                    <p className="text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                                                        <AlertTriangle size={12}/> En cours de synchronisation...
                                                    </p>
                                                    <p className="text-[10px] text-red-500 mt-1">L'API n'a pas inclus les informations du patient.</p>
                                                </div>
                                            )
                                        ) : bed.state === 'CLEANING' ? (
                                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium italic flex items-center gap-1">
                                                <CheckCircle size={14}/> Désinfection requise
                                            </p>
                                        ) : bed.state === 'MAINTENANCE' ? (
                                            <p className="text-xs text-red-500 dark:text-red-400 font-medium italic flex items-center gap-1">
                                                <AlertTriangle size={14}/> Équipement défectueux
                                            </p>
                                        ) : (
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium italic">
                                                Lit prêt à recevoir un patient
                                            </p>
                                        )}
                                    </div>

                                    {/* Ligne basse : Actions contextuelles */}
                                    <div className="border-t border-gray-100 dark:border-gray-700/60 pt-2.5 flex items-center justify-end gap-2 shrink-0">
                                        
                                        {/* Action: Admettre */}
                                        {bed.state === 'AVAILABLE' && (
                                            <button 
                                                onClick={() => onAdmitPatient(bed)}
                                                className="w-full text-center py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm transition-colors"
                                            >
                                                Hospitaliser un patient
                                            </button>
                                        )}

                                        {/* Actions: Patient Occupé */}
                                        {isOccupied && activeAdmission && activeAdmission.patient ? (
                                            <>
                                                {/* DOSSIER */}
                                                <button 
                                                    onClick={() => onViewPatient(activeAdmission.patient)}
                                                    className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg text-xs shadow-sm transition-colors flex items-center justify-center gap-1"
                                                    title="Voir le dossier médical"
                                                >
                                                    <FileText size={12} /> Dossier
                                                </button>

                                                {/* VISITE */}
                                                <button 
                                                    onClick={() => onStartConsultation(activeAdmission)}
                                                    className="flex-1 py-1.5 bg-[#00a896] hover:bg-[#008f7f] text-white font-bold rounded-lg text-xs shadow-sm transition-colors flex items-center justify-center gap-1"
                                                    title="Faire une visite médicale"
                                                >
                                                    <Activity size={12} /> Visite
                                                </button>

                                                {/* SORTIE */}
                                                <button 
                                                    onClick={() => onDischargePatient(activeAdmission)}
                                                    className="p-1.5 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                                    title="Autoriser la sortie"
                                                >
                                                    <LogOut size={12} />
                                                </button>
                                            </>
                                        ) : isOccupied ? (
                                            <span className="text-[10px] text-gray-400 font-mono italic">Actions bloquées (API incomplète)</span>
                                        ) : null}

                                        {/* Action: Déverrouiller le lit (Nettoyage/Maintenance) */}
                                        {(bed.state === 'CLEANING' || bed.state === 'MAINTENANCE') && (
                                            onUpdateBedStatus ? (
                                                <button 
                                                    onClick={() => onUpdateBedStatus(bed)}
                                                    className="w-full text-center py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 font-bold rounded-lg text-xs shadow-sm transition-colors"
                                                >
                                                    Marquer Disponible
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-gray-400 font-mono italic">Verrouillé</span>
                                            )
                                        )}
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                )}

                {/* PAGINATION DE L'EXPLORATEUR */}
                {pagination && pagination.lastPage > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between shrink-0 mt-auto">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading}
                            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 transition-colors"
                        >
                            &larr; Précédent
                        </button>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            Page {currentPage} sur {pagination.lastPage}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(pagination.lastPage, p + 1))}
                            disabled={currentPage === pagination.lastPage || loading}
                            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 transition-colors"
                        >
                            Suivant &rarr;
                        </button>
                    </div>
                )}
            </div>

        </div>
    );
};