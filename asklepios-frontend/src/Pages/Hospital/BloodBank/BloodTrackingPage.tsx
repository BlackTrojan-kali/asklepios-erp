import React, { useState, useEffect, useCallback } from 'react';
import { 
    Droplet, RefreshCw, Printer, Filter, Calendar, 
    User, Stethoscope, Activity, ChevronLeft, ChevronRight, Search 
} from 'lucide-react';
import useBloodTrackingStore from '../../../functions/bloodBank/useBloodTrackingStore';
import type { BloodTrackingDto, BloodTrackingFilters } from '../../../types/BloodManageType';

const BloodTrackingPage = () => {
    // --- STORES ---
    const { trackings, loading, actionLoading, pagination, getTrackings, exportTrackingPdf } = useBloodTrackingStore();

    // --- ETATS LOCAUX ---
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<BloodTrackingFilters>({
        status: '',
        start_date: '',
        end_date: '',
        blood_type: ''
    });

    // --- CHARGEMENT DES DONNEES ---
    const loadData = useCallback(() => {
        getTrackings(page, filters);
    }, [page, filters, getTrackings]);

    // Recharger quand la page change
    useEffect(() => {
        loadData();
    }, [loadData]);

    // --- ACTIONS ---
    const handleRefresh = () => {
        loadData();
    };

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1); // Retour à la page 1 lors d'une nouvelle recherche
        loadData();
    };

    const handleExport = () => {
        exportTrackingPdf(filters, 'stream');
    };

    // --- HELPERS D'AFFICHAGE ---
    const getPatient = (t: BloodTrackingDto) => {
        return t.consultation?.patient_visit?.patient || t.consultation?.admission?.patient;
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            
            {/* --- EN-TÊTE --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity className="text-red-500" size={28} /> 
                        Suivi des Transfusions Sanguines
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Registre opérationnel et traçabilité des poches de sang administrées.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm disabled:opacity-50"
                        title="Rafraîchir les données"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin text-[#00a896]" : ""} />
                    </button>
                    <button 
                        onClick={handleExport}
                        disabled={actionLoading || trackings.length === 0}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
                    >
                        <Printer size={18} /> Exporter (PDF)
                    </button>
                </div>
            </div>

            {/* --- ZONE DE FILTRES --- */}
            <form onSubmit={handleFilterSubmit} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold text-sm shrink-0">
                    <Filter size={18} /> Filtres :
                </div>
                
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Groupe Sanguin */}
                    <select 
                        value={filters.blood_type}
                        onChange={(e) => setFilters({...filters, blood_type: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none text-slate-700 dark:text-gray-300"
                    >
                        <option value="">Tous les groupes</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>

                    {/* Statut */}
                    <select 
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none text-slate-700 dark:text-gray-300"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="ON_GOING">En cours</option>
                        <option value="FINISHED">Terminées</option>
                    </select>

                    {/* Date de début */}
                    <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="date" 
                            title="Date de début"
                            value={filters.start_date}
                            onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-slate-700 dark:text-gray-300 [color-scheme:light] dark:[color-scheme:dark]"
                        />
                    </div>

                    {/* Date de fin */}
                    <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="date" 
                            title="Date de fin"
                            value={filters.end_date}
                            onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-slate-700 dark:text-gray-300 [color-scheme:light] dark:[color-scheme:dark]"
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    className="px-5 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <Search size={18} /> Filtrer
                </button>
            </form>

            {/* --- TABLEAU DES RÉSULTATS --- */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="py-3 px-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Date / Heure</th>
                                <th className="py-3 px-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Patient</th>
                                <th className="py-3 px-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Poche de Sang</th>
                                <th className="py-3 px-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Médecin</th>
                                <th className="py-3 px-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-400">
                                        <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-[#00a896]" />
                                        <p>Chargement des données...</p>
                                    </td>
                                </tr>
                            ) : trackings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-500 font-medium">
                                        Aucune transfusion trouvée pour ces critères.
                                    </td>
                                </tr>
                            ) : (
                                trackings.map((t) => {
                                    const patient = getPatient(t);
                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/80 transition-colors">
                                            {/* Date */}
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-gray-800 dark:text-gray-200">
                                                    {new Date(t.start_time).toLocaleDateString('fr-FR')}
                                                </div>
                                                <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                                    À {new Date(t.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>

                                            {/* Patient */}
                                            <td className="py-3 px-4">
                                                {patient ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                            <User size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800 dark:text-gray-200 leading-tight">
                                                                {patient.first_name} {patient.last_name}
                                                            </p>
                                                            <p className="text-[10px] text-gray-500 font-mono">{patient.patient_code}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-red-500 italic text-xs">Patient introuvable</span>
                                                )}
                                            </td>

                                            {/* Poche de sang */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Droplet size={16} className="text-red-500 shrink-0" />
                                                    <div>
                                                        <p className="font-bold text-gray-800 dark:text-gray-200 text-xs">
                                                            <span className="text-red-600 dark:text-red-400 mr-1">Gr. {t.blood_bag?.blood_type}</span>
                                                            {t.blood_bag?.type === 'WHOLE_BLOOD' ? 'Sang Total' : t.blood_bag?.type === 'RED_CELLS' ? 'Glob. Rouges' : 'Plasma'}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 mt-0.5">
                                                            Code: {t.blood_bag?.barcode || `ID-${t.blood_bag_id}`} | {t.blood_bag?.volume_ml}ml
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Medecin */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                                                    <Stethoscope size={14} className="text-gray-400" />
                                                    <span className="font-medium text-xs">
                                                        Dr. {t.consultation?.profile_doctor?.user?.last_name || 'Inconnu'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Statut */}
                                            <td className="py-3 px-4">
                                                {t.status === 'ON_GOING' ? (
                                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                                                        EN COURS
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                                        TERMINÉE
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- PAGINATION --- */}
                {pagination && pagination.lastPage > 1 && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Affichage de la page <span className="font-bold">{pagination.currentPage}</span> sur {pagination.lastPage}
                        </span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button 
                                onClick={() => setPage(p => Math.min(pagination.lastPage, p + 1))}
                                disabled={page === pagination.lastPage || loading}
                                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BloodTrackingPage;