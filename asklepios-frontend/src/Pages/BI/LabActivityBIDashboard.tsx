import React, { useEffect, useState, useMemo } from 'react';
import { 
    Microscope, Filter, Calendar, RefreshCw, TestTubes, 
    Wallet, AlertTriangle, Activity, PieChart as PieChartIcon, 
    TrendingUp, Award, BarChart3
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import Select from 'react-select';

// --- STORES & HOOKS ---
import useLabActivityBiStore from '../../functions/bi/useLabActivityBiStore'; // ⚠️ Ajustez le chemin de votre store BI
import { useLaboratories } from '../../hooks/laboratory/useLaboratory'; // ⚠️ Ajustez le chemin vers votre hook React Query

const LabActivityBIDashboard = () => {
    // 1. Store BI Laboratoire (Zustand)
    const {
        kpis,
        requestTrends = [],
        topTests = [],
        revenueByCategory = [],
        sampleQuality = [], // Sécurité anti-crash
        loadingKpis,
        loadingRequestTrends,
        loadingTopTests,
        loadingRevenueByCategory,
        loadingSampleQuality,
        fetchAllLabDashboardData
    } = useLabActivityBiStore();

    // 2. Référentiel (React Query : Liste des laboratoires pour le filtre)
    const { data: laboratories = [], isLoading: loadingLabs } = useLaboratories();

    // --- ÉTATS DES FILTRES GLOBAUX ---
    const defaultStartDate = useMemo(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1); // 30 derniers jours par défaut
        d.setDate(1);
        return d.toISOString().split('T')[0];
    }, []);
    const defaultEndDate = useMemo(() => new Date().toISOString().split('T')[0], []);

    const [startDate, setStartDate] = useState<string>(defaultStartDate);
    const [endDate, setEndDate] = useState<string>(defaultEndDate);
    const [selectedLab, setSelectedLab] = useState<any>(null);

    // Formatage des laboratoires pour React-Select
    const labOptions = useMemo(() => {
        if (!Array.isArray(laboratories)) return [];
        return laboratories.map((lab: any) => ({ value: lab.id, label: lab.name }));
    }, [laboratories]);

    // --- CHARGEMENT DES DONNÉES BI ---
    const loadData = () => {
        fetchAllLabDashboardData({
            start_date: startDate,
            end_date: endDate,
            laboratory_id: selectedLab?.value,
        });
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate, selectedLab]);

    // --- UTILITAIRES ---
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(value || 0).replace('XAF', 'FCFA');
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    };

    // Traduction des statuts d'échantillons pour le graphique
    const translateSampleStatus = (status: string) => {
        const translations: Record<string, string> = {
            'COLLECTED': 'Collecté / Conforme',
            'REJECTED_HEMOLYSIS': 'Rejeté (Hémolyse)',
            'ANALYZING': 'En cours d\'analyse',
            'DISCARDED': 'Détruit / Rejeté (Autre)'
        };
        return translations[status] || status;
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

    const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];
    // Couleurs sémantiques pour les prélèvements (Vert = OK, Rouge = Rejeté, Bleu = En cours)
    const QUALITY_COLORS: Record<string, string> = {
        'COLLECTED': '#10b981', 
        'REJECTED_HEMOLYSIS': '#ef4444',
        'ANALYZING': '#3b82f6',
        'DISCARDED': '#f97316'
    };

    return (
        <div className="space-y-6">
            
            {/* --- HEADER --- */}
            <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                    <Microscope className="text-purple-600 dark:text-purple-400" />
                    Dashboard BI : Laboratoire (SIL)
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Analyse du volume d'examens, de la rentabilité et des indicateurs de qualité analytique.
                </p>
            </div>

            {/* --- BARRE D'OUTILS (Filtres) --- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-wrap gap-4 items-center z-20 relative">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <Filter size={16} /> Filtres
                </div>
                
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg">
                    <Calendar size={16} className="text-purple-500" />
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 dark:text-white outline-none [color-scheme:light] dark:[color-scheme:dark]" />
                    <span className="text-gray-400">à</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 dark:text-white outline-none [color-scheme:light] dark:[color-scheme:dark]" />
                </div>

                <div className="flex-1 min-w-[200px] max-w-sm">
                    <Select 
                        isClearable 
                        placeholder={loadingLabs ? "Chargement des labos..." : "Tous les laboratoires..."}
                        value={selectedLab}
                        onChange={setSelectedLab}
                        styles={selectStyles}
                        options={labOptions}
                        isDisabled={loadingLabs}
                    />
                </div>

                <button onClick={loadData} className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors ml-auto">
                    <RefreshCw size={20} className={loadingKpis ? "animate-spin" : ""} />
                </button>
            </div>

            {/* --- SECTION 1 : KPIs GLOBAUX --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-5 dark:opacity-10"><TestTubes size={100} /></div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Dossiers (Requêtes)</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white">
                        {loadingKpis ? "..." : kpis?.total_requests || 0}
                    </h3>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-5 dark:opacity-10 text-purple-500"><Wallet size={100} /></div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">CA Théorique Labo</p>
                    <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                        {loadingKpis ? "..." : formatCurrency(kpis?.total_revenue || 0)}
                    </h3>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Prélèvements</p>
                    <h3 className="text-3xl font-black text-blue-600 dark:text-blue-500">
                        {loadingKpis ? "..." : kpis?.total_samples || 0}
                    </h3>
                </div>

                {/* KPI Qualité : Taux de Rejet */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-orange-200 dark:border-orange-900/30 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Qualité (Taux Rejet)</p>
                    <h3 className="text-3xl font-black text-orange-600 dark:text-orange-500 flex items-center gap-2">
                        {loadingKpis ? "..." : kpis?.rejection_rate || 0}%
                    </h3>
                    <div className="text-[10px] mt-1 font-medium bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 inline-block px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                        <AlertTriangle size={12} /> Hémolyse, Quantité...
                    </div>
                </div>

                {/* KPI Clinique : Résultats anormaux */}
                <div className="bg-[#181b1f] rounded-xl p-5 border border-gray-700 shadow-sm text-white flex flex-col justify-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Alerte Clinique</p>
                    <h3 className="text-3xl font-black text-rose-500">
                        {loadingKpis ? "..." : kpis?.abnormal_rate || 0}%
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Activity size={12} /> de résultats anormaux
                    </p>
                </div>
            </div>

            {/* --- SECTION 2 : TENDANCES ET QUALITÉ --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Graphique 1 : Évolution des requêtes (Volume) */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                            <TrendingUp className="text-purple-500" size={16} /> Flux des dossiers Laboratoire
                        </h3>
                    </div>
                    <div className="h-[250px] w-full">
                        {loadingRequestTrends ? (
                            <div className="h-full flex items-center justify-center text-gray-400"><RefreshCw className="animate-spin" /></div>
                        ) : requestTrends.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={requestTrends} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.2} />
                                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <Tooltip formatter={(value: number) => [value, "Dossiers"]} labelFormatter={formatDate} contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px' }} />
                                    <Area type="monotone" dataKey="total_requests" name="Dossiers Labo" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorReqs)" activeDot={{ r: 6 }} dot={{ r: 3, fill: '#8b5cf6' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Graphique 2 : Qualité des Prélèvements (Donut) */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider mb-2">
                        <PieChartIcon className="text-orange-500" size={16} /> Qualité Pré-analytique
                    </h3>
                    <div className="flex-1 w-full min-h-[250px]">
                        {loadingSampleQuality ? (
                            <div className="h-full flex items-center justify-center text-gray-400"><RefreshCw className="animate-spin" /></div>
                        ) : sampleQuality.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Aucun prélèvement enregistré</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sampleQuality}
                                        cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                                        paddingAngle={5} dataKey="value"
                                    >
                                        {sampleQuality.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={QUALITY_COLORS[entry.name] || '#9ca3af'} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value: number) => value} 
                                        labelFormatter={(label) => translateSampleStatus(label)}
                                        contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px' }} 
                                    />
                                    <Legend 
                                        verticalAlign="bottom" height={48} iconType="circle" 
                                        formatter={(value) => <span className="text-[10px] text-gray-600 dark:text-gray-300">{translateSampleStatus(value)}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* --- SECTION 3 : RENTABILITÉ (Catégories et Top Tests) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Graphique : CA par Catégorie de Laboratoire (Biochimie, Hémato...) */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider mb-6">
                        <BarChart3 className="text-blue-500" size={16} /> CA par Pôle d'Analyse
                    </h3>
                    <div className="h-[350px] w-full">
                        {loadingRevenueByCategory ? (
                            <div className="h-full flex items-center justify-center text-gray-400"><RefreshCw className="animate-spin" /></div>
                        ) : revenueByCategory.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Aucune donnée de facturation</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueByCategory} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" strokeOpacity={0.2} />
                                    <XAxis type="number" tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} />
                                    <YAxis dataKey="category_name" type="category" tick={{ fontSize: 10, fill: '#9ca3af' }} width={110} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} formatter={(value: number) => [formatCurrency(value), "CA Généré"]} contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px' }} />
                                    <Bar dataKey="revenue" name="Chiffre d'Affaires" radius={[0, 4, 4, 0]} barSize={20}>
                                        {revenueByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Tableau : Top Examens (Rentabilité & Volume) */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-[420px]">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                            <Award className="text-amber-500" size={16} /> Top 15 Examens les plus rentables
                        </h3>
                    </div>
                    <div className="overflow-x-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-10">
                                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="p-3">Examen</th>
                                    <th className="p-3">Pôle</th>
                                    <th className="p-3 text-center">Volume</th>
                                    <th className="p-3 text-right">CA Généré</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loadingTopTests ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-500"><RefreshCw className="animate-spin mx-auto mb-2"/></td></tr>
                                ) : topTests.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-emerald-500 font-medium">Aucun examen enregistré.</td></tr>
                                ) : (
                                    topTests.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="p-3">
                                                <div className="font-bold text-slate-800 dark:text-gray-200">{item.test_name}</div>
                                                <div className="text-[10px] text-gray-500 font-mono mt-0.5">{item.test_code}</div>
                                            </td>
                                            <td className="p-3 text-gray-500 dark:text-gray-400">
                                                {item.category_name}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                                                    {item.total_performed}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                                                {formatCurrency(item.total_revenue)}
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

export default LabActivityBIDashboard;