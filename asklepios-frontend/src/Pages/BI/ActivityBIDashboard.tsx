import React, { useEffect, useState, useMemo } from 'react';
import { 
    Activity, Filter, Calendar, RefreshCw, Users, AlertCircle, 
    BriefcaseMedical, BedDouble, TrendingUp, BarChart3, Stethoscope, Clock
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Cell, Legend
} from 'recharts';
import Select from 'react-select';

// --- STORES ---
import useHospitalActivityBiStore from '../../functions/bi/useHospitalActivityBiStore';
// ⚠️ Ajustez le chemin vers votre store de centres (celui utilisé dans vos autres pages)
import useCenterStore from '../../functions/center/useCenterStore'; 

const ActivityBIDashboard = () => {
    // 1. Store BI Activité
    const {
        kpis,
        visitTrends = [],
        consultationsByDoctor = [],
        topMedicalActs = [],
        activeAdmissions = [],
        loadingKpis,
        loadingVisitTrends,
        loadingConsultationsByDoctor,
        loadingTopMedicalActs,
        loadingActiveAdmissions,
        fetchAllActivityDashboardData
    } = useHospitalActivityBiStore();

    // 2. Store Référentiel (Centres)
    const { centers, getCenters } = useCenterStore();

    // --- ÉTATS DES FILTRES GLOBAUX ---
    const defaultStartDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30); // Par défaut: les 30 derniers jours
        return d.toISOString().split('T')[0];
    }, []);
    const defaultEndDate = useMemo(() => new Date().toISOString().split('T')[0], []);

    const [startDate, setStartDate] = useState<string>(defaultStartDate);
    const [endDate, setEndDate] = useState<string>(defaultEndDate);
    const [selectedCenter, setSelectedCenter] = useState<any>(null);

    // --- INITIALISATION ---
    useEffect(() => {
        getCenters(1, {}, 100);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const centerOptions = useMemo(() => 
        centers.map(c => ({ value: c.id, label: c.name })), 
    [centers]);

    // --- CHARGEMENT DES DONNÉES BI ---
    const loadData = () => {
        fetchAllActivityDashboardData({
            start_date: startDate,
            end_date: endDate,
            center_id: selectedCenter?.value,
        });
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate, selectedCenter]);

    // --- UTILITAIRES ---
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    // Style React-Select adaptatif Dark Mode
    const selectStyles = {
        control: (base: any) => ({
            ...base,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#f8fafc',
            borderColor: document.documentElement.classList.contains('dark') ? '#374151' : '#e2e8f0',
            color: document.documentElement.classList.contains('dark') ? 'white' : 'black',
            minHeight: '38px',
            boxShadow: 'none',
        }),
        menu: (base: any) => ({ ...base, backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : 'white', zIndex: 50 }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isFocused ? (document.documentElement.classList.contains('dark') ? '#374151' : '#f1f5f9') : 'transparent',
            color: document.documentElement.classList.contains('dark') ? 'white' : 'black',
        }),
        singleValue: (base: any) => ({ ...base, color: document.documentElement.classList.contains('dark') ? 'white' : '#333' }),
        placeholder: (base: any) => ({ ...base, color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#94a3b8' })
    };

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

    return (
        <div className="space-y-6">
            
            {/* --- HEADER --- */}
            <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                    <Activity className="text-blue-600 dark:text-blue-400" />
                    Dashboard BI : Activité Médicale
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Vue consolidée de la charge clinique, du flux des patients et de l'occupation des lits.
                </p>
            </div>

            {/* --- BARRE D'OUTILS (Filtres) --- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-wrap gap-4 items-center z-20 relative">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <Filter size={16} /> Filtres
                </div>
                
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg">
                    <Calendar size={16} className="text-blue-500" />
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 dark:text-white outline-none [color-scheme:light] dark:[color-scheme:dark]" />
                    <span className="text-gray-400">à</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 dark:text-white outline-none [color-scheme:light] dark:[color-scheme:dark]" />
                </div>

                <div className="flex-1 min-w-[200px] max-w-sm">
                    <Select 
                        isClearable 
                        placeholder="Tous les centres médicaux..."
                        value={selectedCenter}
                        onChange={setSelectedCenter}
                        styles={selectStyles}
                        options={centerOptions}
                    />
                </div>

                <button onClick={loadData} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ml-auto">
                    <RefreshCw size={20} className={loadingKpis ? "animate-spin" : ""} />
                </button>
            </div>

            {/* --- SECTION 1 : KPIs GLOBAUX --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-5 dark:opacity-10"><Users size={100} /></div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Visites</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white">
                        {loadingKpis ? "..." : kpis?.total_visits || 0}
                    </h3>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-red-200 dark:border-red-900/30 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-5 dark:opacity-10 text-red-500"><AlertCircle size={100} /></div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Urgences</p>
                    <h3 className="text-3xl font-black text-red-600 dark:text-red-500">
                        {loadingKpis ? "..." : kpis?.emergency_visits || 0}
                    </h3>
                    <div className="text-[10px] mt-1 font-bold bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 inline-block px-2 py-0.5 rounded">
                        {loadingKpis ? "..." : (kpis?.total_visits ? Math.round((kpis.emergency_visits / kpis.total_visits) * 100) : 0)}% du flux
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Consultations</p>
                    <h3 className="text-3xl font-black text-blue-600 dark:text-blue-500">
                        {loadingKpis ? "..." : kpis?.total_consultations || 0}
                    </h3>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Actes Médicaux</p>
                    <h3 className="text-3xl font-black text-purple-600 dark:text-purple-500">
                        {loadingKpis ? "..." : kpis?.total_medical_acts || 0}
                    </h3>
                </div>

                <div className="bg-[#181b1f] rounded-xl p-5 border border-gray-700 shadow-sm text-white">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Hospitalisations</p>
                    <h3 className="text-3xl font-black text-emerald-400">
                        {loadingKpis ? "..." : kpis?.total_admissions || 0}
                    </h3>
                    <div className="text-[10px] mt-1 font-bold bg-emerald-900/50 text-emerald-300 inline-block px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                        Taux d'admission : {loadingKpis ? "..." : kpis?.admission_rate || 0}%
                    </div>
                </div>
            </div>

            {/* --- SECTION 2 : GRAPHIQUES --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Graphique 1 : Flux des patients (Stacked Area) */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                            <TrendingUp className="text-blue-500" size={16} /> Flux Journalier des Patients
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        {loadingVisitTrends ? (
                            <div className="h-full flex items-center justify-center text-gray-400"><RefreshCw className="animate-spin" /></div>
                        ) : visitTrends.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Aucune visite sur cette période</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={visitTrends} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRoutine" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        </linearGradient>
                                        <linearGradient id="colorEmergency" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                                        </linearGradient>
                                        <linearGradient id="colorFollowUp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.2} />
                                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <Tooltip labelFormatter={formatDate} contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    {/* stackId="1" permet d'empiler les courbes */}
                                    <Area type="monotone" dataKey="ROUTINE" stackId="1" name="Routine" stroke="#3b82f6" fill="url(#colorRoutine)" />
                                    <Area type="monotone" dataKey="FOLLOW_UP" stackId="1" name="Suivi / Contrôle" stroke="#f59e0b" fill="url(#colorFollowUp)" />
                                    <Area type="monotone" dataKey="EMERGENCY" stackId="1" name="Urgences" stroke="#ef4444" fill="url(#colorEmergency)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Graphique 2 : Top Actes Médicaux */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider mb-6">
                        <BarChart3 className="text-purple-500" size={16} /> Palmarès des Soins Dispensés
                    </h3>
                    <div className="h-[300px] w-full">
                        {loadingTopMedicalActs ? (
                            <div className="h-full flex items-center justify-center text-gray-400"><RefreshCw className="animate-spin" /></div>
                        ) : topMedicalActs.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Aucun acte médical enregistré</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topMedicalActs} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" strokeOpacity={0.2} />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} />
                                    <YAxis dataKey="act_name" type="category" tick={{ fontSize: 10, fill: '#9ca3af' }} width={90} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px' }} />
                                    <Bar dataKey="total_performed" name="Réalisations" radius={[0, 4, 4, 0]} barSize={20}>
                                        {topMedicalActs.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* --- SECTION 3 : TABLEAUX DÉTAILLÉS --- */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                
                {/* TABLEAU 1 : OCCUPATION DES LITS (Temps Réel) */}
                <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm overflow-hidden flex flex-col h-[400px]">
                    <div className="p-4 border-b border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10">
                        <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                            <BedDouble size={16} /> Occupation Hospitalière (Temps Réel)
                        </h3>
                        <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-1 font-medium">
                            Liste des patients actuellement alités. Indépendant du filtre de date.
                        </p>
                    </div>
                    <div className="overflow-x-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-10">
                                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="p-3">Patient</th>
                                    <th className="p-3">Emplacement (Chambre/Lit)</th>
                                    <th className="p-3">Date d'Admission</th>
                                    <th className="p-3 text-center">Durée Séjour</th>
                                    <th className="p-3">Motif Médical</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loadingActiveAdmissions ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-500"><RefreshCw className="animate-spin mx-auto mb-2"/></td></tr>
                                ) : activeAdmissions.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-emerald-500 font-medium">Aucun patient hospitalisé actuellement.</td></tr>
                                ) : (
                                    activeAdmissions.map((patient, idx) => {
                                        // Highlight si le séjour est très long (> 14 jours)
                                        const isLongStay = patient.days_admitted > 14;

                                        return (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-700/30">
                                                <td className="p-3">
                                                    <div className="font-bold text-slate-800 dark:text-gray-200">{patient.first_name} {patient.last_name}</div>
                                                    <div className="text-[10px] text-gray-500 font-mono">ID: {patient.patient_code}</div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-bold text-emerald-600 dark:text-emerald-400">{patient.room_name}</div>
                                                    <div className="text-[10px] text-gray-500 uppercase">Lit N° {patient.bed_number}</div>
                                                </td>
                                                <td className="p-3 text-gray-600 dark:text-gray-300">
                                                    {formatDateTime(patient.admission_date)}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`font-mono font-bold px-2 py-1 rounded ${isLongStay ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                        {patient.days_admitted} jours
                                                    </span>
                                                </td>
                                                <td className="p-3 text-gray-500 dark:text-gray-400 truncate max-w-[200px]" title={patient.reason_for_admission}>
                                                    {patient.reason_for_admission || "Non spécifié"}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* TABLEAU 2 : PRODUCTIVITÉ DES MÉDECINS */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-[400px]">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                            <Stethoscope size={16} className="text-blue-500" /> Rendement Clinique (Médecins)
                        </h3>
                    </div>
                    <div className="overflow-x-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-10">
                                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="p-3">Médecin</th>
                                    <th className="p-3 text-center">Consultations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loadingConsultationsByDoctor ? (
                                    <tr><td colSpan={2} className="p-8 text-center text-gray-500"><RefreshCw className="animate-spin mx-auto mb-2"/></td></tr>
                                ) : consultationsByDoctor.length === 0 ? (
                                    <tr><td colSpan={2} className="p-8 text-center text-gray-500 font-medium">Aucune donnée de consultation.</td></tr>
                                ) : (
                                    consultationsByDoctor.map((doc, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-700/30">
                                            <td className="p-3">
                                                <div className="font-bold text-slate-800 dark:text-gray-200 flex items-center gap-2">
                                                    <span className="text-gray-400 font-normal">#{idx + 1}</span> 
                                                    Dr. {doc.first_name} {doc.last_name}
                                                </div>
                                                <div className="text-[10px] text-gray-500">{doc.speciality}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                                                    {doc.total_consultations}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ActivityBIDashboard;