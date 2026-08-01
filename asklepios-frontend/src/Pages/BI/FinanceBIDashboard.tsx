import React, { useEffect, useState, useMemo } from 'react';
import { 
    Activity, Filter, Calendar, RefreshCw, DollarSign, 
    CreditCard, ShoppingCart, Wallet, TrendingUp, PieChart as PieChartIcon, BarChart3, Award
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import Select from 'react-select';

// --- STORES ---
import useFinanceBiStore from '../../functions/bi/useFinanceBiStore';
import usePharmacyStore from '../../functions/pharmacy/usePharmacyStore'; // ⚠️ Ajustez le chemin

const FinanceBIDashboard = () => {
    // 1. Store BI Finance
    const {
        kpis,
        revenueTrends = [],
        revenueByPaymentMethod = [],
        revenueByCategory = [],
        topArticles = [],
        cashFlow = [],
        loadingKpis,
        loadingTrends,
        loadingPaymentMethod,
        loadingCategory,
        loadingTopArticles,
        loadingCashFlow,
        fetchAllFinanceDashboardData
    } = useFinanceBiStore();

    // 2. Store Référentiel (Pharmacies)
    const { pharmacyBranches, getPharmacyBranches } = usePharmacyStore();

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
    const [selectedPharmacy, setSelectedPharmacy] = useState<any>(null);

    // --- INITIALISATION ---
    useEffect(() => {
        getPharmacyBranches(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const pharmacyOptions = useMemo(() => 
        pharmacyBranches.map(p => ({ value: p.id, label: p.name })), 
    [pharmacyBranches]);

    // --- CHARGEMENT DES DONNÉES BI ---
    const loadData = () => {
        fetchAllFinanceDashboardData({
            start_date: startDate,
            end_date: endDate,
            pharmacy_branch_id: selectedPharmacy?.value,
        });
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate, selectedPharmacy]);

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

    // Couleurs pour les graphiques
    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6'];
    const PIE_COLORS = ['#3b82f6', '#10b981', '#6366f1'];

    return (
        <div className="space-y-6">
            
            {/* --- HEADER --- */}
            <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                    <Wallet className="text-emerald-600 dark:text-emerald-400" />
                    Dashboard BI : Finances & Ventes
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Vue consolidée du chiffre d'affaires, de la trésorerie et de la rentabilité des pharmacies.
                </p>
            </div>

            {/* --- BARRE D'OUTILS (Filtres) --- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-wrap gap-4 items-center z-20 relative">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <Filter size={16} /> Filtres
                </div>
                
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg">
                    <Calendar size={16} className="text-emerald-500" />
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 dark:text-white outline-none [color-scheme:light] dark:[color-scheme:dark]" />
                    <span className="text-gray-400">à</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 dark:text-white outline-none [color-scheme:light] dark:[color-scheme:dark]" />
                </div>

                <div className="flex-1 min-w-[200px] max-w-sm">
                    <Select 
                        isClearable 
                        placeholder="Toutes les pharmacies..."
                        value={selectedPharmacy}
                        onChange={setSelectedPharmacy}
                        styles={selectStyles}
                        options={pharmacyOptions}
                    />
                </div>

                <button onClick={loadData} className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors ml-auto">
                    <RefreshCw size={20} className={loadingKpis ? "animate-spin" : ""} />
                </button>
            </div>

            {/* --- SECTION 1 : KPIs GLOBAUX --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-5 dark:opacity-10"><DollarSign size={100} /></div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Chiffre d'Affaires</p>
                    <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        {loadingKpis ? "..." : formatCurrency(kpis?.total_revenue || 0)}
                    </h3>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Volume de Ventes</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        {loadingKpis ? "..." : kpis?.total_sales || 0} <span className="text-sm font-normal text-gray-400">factures</span>
                    </h3>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Panier Moyen</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white">
                        {loadingKpis ? "..." : formatCurrency(kpis?.average_basket || 0)}
                    </h3>
                    <div className="text-xs mt-1 font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 inline-block px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                        <ShoppingCart size={12} /> Par patient
                    </div>
                </div>

                <div className="bg-[#181b1f] rounded-xl p-5 border border-gray-700 shadow-sm text-white flex flex-col justify-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Trésorerie Actuelle</p>
                    <h3 className="text-3xl font-black text-emerald-500">
                        {loadingKpis ? "..." : formatCurrency(kpis?.total_treasury || 0)}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Tous comptes actifs confondus</p>
                </div>
            </div>

            {/* --- SECTION 2 : GRAPHIQUES --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Graphique 1 : Évolution du CA (Prend 2 colonnes sur grand écran) */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                            <TrendingUp className="text-emerald-500" size={16} /> Évolution du Chiffre d'Affaires
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
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.2} />
                                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <Tooltip formatter={(value: number) => [formatCurrency(value), "CA"]} labelFormatter={formatDate} contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px' }} />
                                    <Area type="monotone" dataKey="daily_revenue" name="Chiffre d'Affaires" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6 }} dot={{ r: 3, fill: '#10b981' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Graphique 2 : Modes de Paiement (Donut) */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider mb-2">
                        <CreditCard className="text-blue-500" size={16} /> Répartition des Paiements
                    </h3>
                    <div className="flex-1 w-full min-h-[250px]">
                        {loadingPaymentMethod ? (
                            <div className="h-full flex items-center justify-center text-gray-400"><RefreshCw className="animate-spin" /></div>
                        ) : revenueByPaymentMethod.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={revenueByPaymentMethod}
                                        cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                                        paddingAngle={5} dataKey="value"
                                    >
                                        {revenueByPaymentMethod.map((entry, index) => (
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

            {/* --- SECTION 3 : ANALYSE PRODUITS ET CATÉGORIES --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Graphique : CA par Catégorie */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider mb-6">
                        <BarChart3 className="text-indigo-500" size={16} /> CA par Catégorie
                    </h3>
                    <div className="h-[300px] w-full">
                        {loadingCategory ? (
                            <div className="h-full flex items-center justify-center text-gray-400"><RefreshCw className="animate-spin" /></div>
                        ) : revenueByCategory.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueByCategory} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" strokeOpacity={0.2} />
                                    <XAxis type="number" tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} />
                                    <YAxis dataKey="category_name" type="category" tick={{ fontSize: 10, fill: '#9ca3af' }} width={90} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} formatter={(value: number) => [formatCurrency(value), "CA"]} contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px' }} />
                                    <Bar dataKey="revenue" name="Chiffre d'Affaires" radius={[0, 4, 4, 0]} barSize={20}>
                                        {revenueByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Tableau : Top Articles Vendeurs */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-[380px]">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                            <Award className="text-amber-500" size={16} /> Palmarès : Top Articles (Revenus)
                        </h3>
                    </div>
                    <div className="overflow-x-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-10">
                                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="p-3">Rang</th>
                                    <th className="p-3">Article</th>
                                    <th className="p-3 text-center">Qté Vendue</th>
                                    <th className="p-3 text-right">CA Généré</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loadingTopArticles ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-500"><RefreshCw className="animate-spin mx-auto mb-2"/></td></tr>
                                ) : topArticles.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-emerald-500 font-medium">Aucune vente enregistrée.</td></tr>
                                ) : (
                                    topArticles.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="p-3 font-bold text-gray-400 dark:text-gray-500">#{idx + 1}</td>
                                            <td className="p-3 font-bold text-slate-800 dark:text-gray-200">{item.article_name}</td>
                                            <td className="p-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">{item.total_qty}</td>
                                            <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(item.revenue)}
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

export default FinanceBIDashboard;