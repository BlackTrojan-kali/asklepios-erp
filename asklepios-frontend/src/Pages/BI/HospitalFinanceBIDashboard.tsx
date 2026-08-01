import React, { useEffect, useState, useMemo } from 'react';
import { 
    Activity, Filter, Calendar, RefreshCw, Wallet, 
    FileText, ShieldAlert, Building2, CreditCard, Landmark, PieChart as PieChartIcon, TrendingUp
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import Select from 'react-select';

// --- STORES ---
import useHospitalFinanceBiStore from '../../functions/bi/useHospitalFinanceBiStore';
import useCenterStore from '../../functions/center/useCenterStore'; // ⚠️ Ajustez le chemin

const HospitalFinanceBIDashboard = () => {
    // 1. Store BI Finance Hôpital
    const {
        kpis,
        revenueTrends = [],
        revenueByService = [],
        paymentMethods = [],
        insuranceClaims = [], // Sécurité anti-crash
        loadingKpis,
        loadingTrends,
        loadingServices,
        loadingPaymentMethods,
        loadingInsuranceClaims,
        fetchAllHospitalFinanceDashboardData
    } = useHospitalFinanceBiStore();

    // 2. Store Référentiel (Centres)
    const { centers, getCenters } = useCenterStore();

    // --- ÉTATS DES FILTRES GLOBAUX ---
    const defaultStartDate = useMemo(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        d.setDate(1);
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
        fetchAllHospitalFinanceDashboardData({
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
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(value || 0).replace('XAF', 'FCFA');
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
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

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899'];
    const PIE_COLORS = ['#3b82f6', '#10b981', '#f43f5e'];

    return (
        <div className="space-y-6">
            
            {/* --- HEADER --- */}
            <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                    <Landmark className="text-indigo-600 dark:text-indigo-400" />
                    Dashboard BI : Finances Hôpital
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Analyse de la facturation, des encaissements et du risque de recouvrement (Assurances).
                </p>
            </div>

            {/* --- BARRE D'OUTILS (Filtres) --- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-wrap gap-4 items-center z-20 relative">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <Filter size={16} /> Filtres
                </div>
                
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg">
                    <Calendar size={16} className="text-indigo-500" />
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

                <button onClick={loadData} className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors ml-auto">
                    <RefreshCw size={20} className={loadingKpis ? "animate-spin" : ""} />
                </button>
            </div>

            {/* --- SECTION 1 : KPIs GLOBAUX --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-5 dark:opacity-10"><FileText size={100} /></div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Facturé (Théorique)</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white">
                        {loadingKpis ? "..." : formatCurrency(kpis?.total_invoiced || 0)}
                    </h3>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-emerald-200 dark:border-emerald-900/30 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-5 dark:opacity-10 text-emerald-500"><Wallet size={100} /></div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Encaissé (Réel)</p>
                    <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-500">
                        {loadingKpis ? "..." : formatCurrency(kpis?.total_collected || 0)}
                    </h3>
                    <div className="text-[10px] mt-1 font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 inline-block px-2 py-0.5 rounded">
                        Taux de Recouvrement: {loadingKpis ? "..." : kpis?.collection_rate || 0}%
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-red-200 dark:border-red-900/30 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Reste à Recouvrer (Impayés)</p>
                    <h3 className="text-3xl font-black text-red-600 dark:text-red-500">
                        {loadingKpis ? "..." : formatCurrency(kpis?.total_outstanding || 0)}
                    </h3>
                    <div className="text-[10px] mt-1 font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1 w-fit">
                        <ShieldAlert size={12} /> Patients + Assurances
                    </div>
                </div>

                <div className="bg-[#181b1f] rounded-xl p-5 border border-gray-700 shadow-sm text-white flex flex-col justify-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Structure du Risque (CA Attendu)</p>
                    
                    <div className="flex justify-between text-xs mb-1">
                        <span>Patients ({kpis?.total_invoiced ? Math.round(((kpis?.patient_expected_share || 0) / kpis.total_invoiced) * 100) : 0}%)</span>
                        <span>Assurances ({kpis?.total_invoiced ? Math.round(((kpis?.insurance_expected_share || 0) / kpis.total_invoiced) * 100) : 0}%)</span>
                    </div>
                    {/* Barre de progression Patient vs Assurance */}
                    <div className="w-full bg-indigo-900 rounded-full h-2.5 flex overflow-hidden">
                        <div 
                            className="bg-blue-500 h-2.5" 
                            style={{ width: `${kpis?.total_invoiced ? ((kpis?.patient_expected_share || 0) / kpis.total_invoiced) * 100 : 50}%` }}
                        ></div>
                        <div 
                            className="bg-purple-500 h-2.5" 
                            style={{ width: `${kpis?.total_invoiced ? ((kpis?.insurance_expected_share || 0) / kpis.total_invoiced) * 100 : 50}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* --- SECTION 2 : TENDANCES ET SERVICES --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Graphique 1 : Évolution des Encaissements */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                            <TrendingUp className="text-emerald-500" size={16} /> Flux d'Encaissements Journaliers
                        </h3>
                    </div>
                    <div className="h-[250px] w-full">
                        {loadingTrends ? (
                            <div className="h-full flex items-center justify-center text-gray-400"><RefreshCw className="animate-spin" /></div>
                        ) : revenueTrends.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueTrends} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorHospitalRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.2} />
                                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <Tooltip formatter={(value: number) => [formatCurrency(value), "Encaissé"]} labelFormatter={formatDate} contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px' }} />
                                    <Area type="monotone" dataKey="daily_revenue" name="Encaissements" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHospitalRev)" activeDot={{ r: 6 }} dot={{ r: 3, fill: '#10b981' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Graphique 2 : Modes de Paiement (Donut) */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider mb-2">
                        <CreditCard className="text-blue-500" size={16} /> Méthodes de Paiement
                    </h3>
                    <div className="flex-1 w-full min-h-[250px]">
                        {loadingPaymentMethods ? (
                            <div className="h-full flex items-center justify-center text-gray-400"><RefreshCw className="animate-spin" /></div>
                        ) : paymentMethods.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={paymentMethods}
                                        cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                                        paddingAngle={5} dataKey="value"
                                    >
                                        {paymentMethods.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* --- SECTION 3 : CENTRES DE PROFITS ET ASSURANCES --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Graphique : CA par Centre de Profit (Service) */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider mb-6">
                        <Building2 className="text-indigo-500" size={16} /> CA par Pôles d'Activité
                    </h3>
                    <div className="h-[300px] w-full">
                        {loadingServices ? (
                            <div className="h-full flex items-center justify-center text-gray-400"><RefreshCw className="animate-spin" /></div>
                        ) : revenueByService.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueByService} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" strokeOpacity={0.2} />
                                    <XAxis type="number" tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} />
                                    <YAxis dataKey="service_name" type="category" tick={{ fontSize: 10, fill: '#9ca3af' }} width={120} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} formatter={(value: number) => [formatCurrency(value), "Facturé"]} contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px' }} />
                                    <Bar dataKey="revenue" name="Chiffre d'Affaires" radius={[0, 4, 4, 0]} barSize={20}>
                                        {revenueByService.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Graphique : Statut des Créances d'Assurances (Stacked Bar) */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                            <ShieldAlert className="text-purple-500" size={16} /> Risque de Recouvrement (Assurances)
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        {loadingInsuranceClaims ? (
                            <div className="h-full flex items-center justify-center text-gray-400"><RefreshCw className="animate-spin" /></div>
                        ) : insuranceClaims.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Aucun bordereau d'assurance.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={insuranceClaims} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.2} />
                                    <XAxis dataKey="insurance_name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        formatter={(value: number) => formatCurrency(value)} 
                                        contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px' }} 
                                    />
                                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                    {/* Barres empilées pour voir d'un coup d'oeil où en est l'argent */}
                                    <Bar dataKey="PAID" stackId="a" name="Payé" fill="#10b981" barSize={30} />
                                    <Bar dataKey="SUBMITTED" stackId="a" name="Soumis (En attente)" fill="#3b82f6" />
                                    <Bar dataKey="DRAFT" stackId="a" name="Brouillon (À réclamer)" fill="#9ca3af" />
                                    <Bar dataKey="DISPUTED" stackId="a" name="En litige" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HospitalFinanceBIDashboard;