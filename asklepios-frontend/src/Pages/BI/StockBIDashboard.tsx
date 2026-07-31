import React, { useEffect, useState, useMemo } from 'react';
import { 
    TrendingDown, TrendingUp, AlertTriangle, PackageX, 
    Calendar, RefreshCw, BarChart3, PieChart, Activity, Filter, Box
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Legend, Cell
} from 'recharts';
import Select from 'react-select';

// --- STORES ---
import useStockBiStore from '../../functions/bi/useStockBiStore'; 
import usePharmacyStore from '../../functions/pharmacy/usePharmacyStore'; // ⚠️ Ajustez le chemin si nécessaire
import useArticleCategoryStore from '../../functions/pharmacy/useArticleCategoryStore'; // ⚠️ Ajustez le chemin
import useArticleStore from '../../functions/pharmacy/useArticleStore'; // ⚠️ Ajustez le chemin

const StockBIDashboard = () => {
    // 1. Store BI
    const {
        kpis,
        valuations = [],
        expiringStock = [],
        movementTrends = [],
        lowStockDetails = [], // 🟢 Sécurité anti-crash
        loadingKpis,
        loadingValuations,
        loadingExpiring,
        loadingTrends,
        loadingLowStock,
        fetchAllDashboardData
    } = useStockBiStore();

    // 2. Stores de Référentiels (Pour les filtres)
    const { pharmacyBranches, getPharmacyBranches } = usePharmacyStore();
    const { allCategories, getAllArticleCategories } = useArticleCategoryStore();
    const { allArticles, getAllArticles } = useArticleStore();

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
    const [daysFilter, setDaysFilter] = useState<number>(90);
    
    const [selectedPharmacy, setSelectedPharmacy] = useState<any>(null);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [selectedArticle, setSelectedArticle] = useState<any>(null);

    // --- INITIALISATION DES RÉFÉRENTIELS (Pour les listes déroulantes) ---
    useEffect(() => {
        getPharmacyBranches(1); // Charge les pharmacies
        getAllArticleCategories(); // Charge toutes les catégories
        getAllArticles(); // Charge tous les articles
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Formatage des données pour React-Select
    const pharmacyOptions = useMemo(() => 
        pharmacyBranches.map(p => ({ value: p.id, label: p.name })), 
    [pharmacyBranches]);

    const categoryOptions = useMemo(() => 
        allCategories.map(c => ({ value: c.id, label: c.name })), 
    [allCategories]);

    const articleOptions = useMemo(() => 
        allArticles.map(a => ({ value: a.id, label: a.name })), 
    [allArticles]);

    // --- CHARGEMENT DES DONNÉES BI ---
    const loadData = () => {
        fetchAllDashboardData({
            start_date: startDate,
            end_date: endDate,
            days: daysFilter,
            pharmacy_branch_id: selectedPharmacy?.value,
            category_id: selectedCategory?.value,
            article_id: selectedArticle?.value,
        });
    };

    // Déclenche un rechargement dès qu'un filtre change
    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate, daysFilter, selectedPharmacy, selectedCategory, selectedArticle]);

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
        menu: (base: any) => ({
            ...base, backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : 'white', zIndex: 50
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isFocused ? (document.documentElement.classList.contains('dark') ? '#374151' : '#f1f5f9') : 'transparent',
            color: document.documentElement.classList.contains('dark') ? 'white' : 'black',
        }),
        singleValue: (base: any) => ({ ...base, color: document.documentElement.classList.contains('dark') ? 'white' : '#333' }),
        placeholder: (base: any) => ({ ...base, color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#94a3b8' })
    };

    const COLORS = ['#4f46e5', '#0ea5e9', '#06b6d4', '#14b8a6', '#0d9488'];

    return (
        <div className="space-y-6">
            
            {/* --- HEADER --- */}
            <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                    <Activity className="text-indigo-600 dark:text-indigo-400" />
                    Dashboard BI : Stocks & Flux
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Vue consolidée de la valorisation et des risques liés aux inventaires médicaux.
                </p>
            </div>

            {/* --- BARRE D'OUTILS GRAFANA-STYLE (Filtres) --- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-wrap gap-4 items-center z-20 relative">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <Filter size={16} /> Filtres
                </div>
                
                {/* Sélecteur de Dates */}
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg">
                    <Calendar size={16} className="text-indigo-500" />
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 dark:text-white outline-none [color-scheme:light] dark:[color-scheme:dark]" />
                    <span className="text-gray-400">à</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 dark:text-white outline-none [color-scheme:light] dark:[color-scheme:dark]" />
                </div>

                {/* Filtre Pharmacie */}
                <div className="flex-1 min-w-[180px]">
                    <Select 
                        isClearable 
                        placeholder="Toutes les pharmacies..."
                        value={selectedPharmacy}
                        onChange={setSelectedPharmacy}
                        styles={selectStyles}
                        options={pharmacyOptions}
                    />
                </div>

                {/* Filtre Catégorie */}
                <div className="flex-1 min-w-[180px]">
                    <Select 
                        isClearable 
                        placeholder="Toutes les catégories..."
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        styles={selectStyles}
                        options={categoryOptions}
                    />
                </div>

                {/* Filtre Article */}
                <div className="flex-1 min-w-[180px]">
                    <Select 
                        isClearable 
                        placeholder="Article spécifique..."
                        value={selectedArticle}
                        onChange={setSelectedArticle}
                        styles={selectStyles}
                        options={articleOptions}
                    />
                </div>

                <button onClick={loadData} className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                    <RefreshCw size={20} className={loadingKpis ? "animate-spin" : ""} />
                </button>
            </div>

            {/* --- SECTION 1 : KPIs GLOBAUX --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-5 dark:opacity-10"><BarChart3 size={100} /></div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Valeur Totale Immobilisée</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white">
                        {loadingKpis ? "..." : formatCurrency(kpis?.total_stock_value || 0)}
                    </h3>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Valeur Expirée (Perte)</p>
                    <h3 className="text-3xl font-black text-red-600 dark:text-red-500">
                        {loadingKpis ? "..." : formatCurrency(kpis?.expired_stock_value || 0)}
                    </h3>
                    <div className="text-xs mt-1 font-medium bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 inline-block px-2 py-0.5 rounded">
                        {loadingKpis ? "..." : kpis?.loss_percentage}% du stock total
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Articles en Alerte (Rupture)</p>
                    <h3 className="text-3xl font-black text-orange-600 dark:text-orange-500">
                        {loadingKpis ? "..." : kpis?.articles_in_low_stock || 0}
                    </h3>
                    <div className="text-xs mt-1 font-medium bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 inline-block px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                        <PackageX size={12} /> Réapprovisionnement requis
                    </div>
                </div>

                <div className="bg-[#181b1f] rounded-xl p-5 border border-gray-700 shadow-sm text-white flex flex-col justify-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Santé du stock</p>
                    <div className="flex items-center gap-3 mt-2">
                        {kpis && kpis.loss_percentage > 5 ? (
                            <><AlertTriangle size={32} className="text-red-500" /> <span className="text-xl font-bold">Critique</span></>
                        ) : kpis && kpis.articles_in_low_stock > 10 ? (
                            <><PackageX size={32} className="text-orange-500" /> <span className="text-xl font-bold">Ruptures</span></>
                        ) : (
                            <><TrendingUp size={32} className="text-emerald-500" /> <span className="text-xl font-bold">Optimale</span></>
                        )}
                    </div>
                </div>
            </div>

            {/* --- SECTION 2 : GRAPHIQUES --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Graphique Flux */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                            <TrendingUp className="text-indigo-500" size={16} /> Valorisation des Flux Financiers
                        </h3>
                    </div>
                    <div className="h-[250px] w-full">
                        {loadingTrends ? (
                            <div className="h-full flex items-center justify-center text-gray-400"><RefreshCw className="animate-spin" /></div>
                        ) : movementTrends.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={movementTrends} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorEntry" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                                        <linearGradient id="colorExit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.2} />
                                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <Tooltip formatter={(value: number) => [formatCurrency(value), ""]} labelFormatter={formatDate} contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                    <Area type="monotone" dataKey="ENTRY" name="Entrées (Achats/Transferts)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEntry)" activeDot={{ r: 6 }} dot={{ r: 3, fill: '#10b981' }} />
                                    <Area type="monotone" dataKey="EXIT" name="Sorties (Ventes/Pertes)" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExit)" activeDot={{ r: 6 }} dot={{ r: 3, fill: '#f43f5e' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Graphique Catégories */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider mb-6">
                        <PieChart className="text-indigo-500" size={16} /> Concentration de Valeur par Catégorie
                    </h3>
                    <div className="h-[250px] w-full">
                        {loadingValuations ? (
                            <div className="h-full flex items-center justify-center text-gray-400"><RefreshCw className="animate-spin" /></div>
                        ) : valuations.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={valuations} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" strokeOpacity={0.2} />
                                    <XAxis type="number" tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} />
                                    <YAxis dataKey="category_name" type="category" tick={{ fontSize: 10, fill: '#9ca3af' }} width={80} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} formatter={(value: number) => [formatCurrency(value), "Valeur"]} contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px' }} />
                                    <Bar dataKey="total_value" name="Valeur" radius={[0, 4, 4, 0]} barSize={20}>
                                        {valuations.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* --- SECTION 3 : PANNEAUX DE DÉTAILS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* PANNEAU : ARTICLES EN RUPTURE */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden flex flex-col h-[400px]">
                    <div className="p-4 border-b border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                        <h3 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2 uppercase tracking-wider">
                            <Box size={16} /> Alerte : Ruptures et Seuils Critiques
                        </h3>
                    </div>
                    <div className="overflow-x-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-10">
                                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="p-3">Article</th>
                                    <th className="p-3">Catégorie</th>
                                    <th className="p-3 text-center">Qté Min.</th>
                                    <th className="p-3 text-center">Qté Actuelle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loadingLowStock ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-500"><RefreshCw className="animate-spin mx-auto mb-2"/></td></tr>
                                ) : lowStockDetails.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-emerald-500 font-medium">Aucune rupture détectée.</td></tr>
                                ) : (
                                    lowStockDetails.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30">
                                            <td className="p-3 font-bold text-slate-800 dark:text-gray-200">{item.article_name}</td>
                                            <td className="p-3 text-gray-500 dark:text-gray-400">{item.category_name}</td>
                                            <td className="p-3 text-center font-mono text-gray-500">{item.global_min_qty}</td>
                                            <td className="p-3 text-center">
                                                <span className={`font-mono font-bold px-2 py-1 rounded ${item.current_qty <= 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400'}`}>
                                                    {item.current_qty}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PANNEAU : RISQUE D'EXPIRATION */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-orange-900/50 shadow-sm overflow-hidden flex flex-col h-[400px]">
                    <div className="p-4 border-b border-orange-100 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-900/10 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2 uppercase tracking-wider">
                            <TrendingDown size={16} /> Risque : Expirations Proches
                        </h3>
                        <select 
                            value={daysFilter} onChange={(e) => setDaysFilter(Number(e.target.value))}
                            className="p-1 text-xs bg-transparent border border-orange-200 dark:border-orange-800 rounded outline-none text-orange-700 dark:text-orange-400 font-bold cursor-pointer"
                        >
                            <option value={30}>30 jours</option>
                            <option value={90}>3 mois</option>
                            <option value={180}>6 mois</option>
                        </select>
                    </div>
                    <div className="overflow-x-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-10">
                                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="p-3">Article & Lot</th>
                                    <th className="p-3 text-center">Qté</th>
                                    <th className="p-3">Date Exp.</th>
                                    <th className="p-3 text-right">Valeur Perdue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loadingExpiring ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-500"><RefreshCw className="animate-spin mx-auto mb-2"/></td></tr>
                                ) : expiringStock.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-emerald-500 font-medium">Aucun risque financier immédiat.</td></tr>
                                ) : (
                                    expiringStock.map((item, idx) => {
                                        const daysLeft = Math.ceil((new Date(item.expire_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-700/30">
                                                <td className="p-3">
                                                    <div className="font-bold text-slate-800 dark:text-gray-200">{item.article_name}</div>
                                                    <div className="text-[10px] text-gray-500 font-mono">Lot: {item.batch_number}</div>
                                                </td>
                                                <td className="p-3 text-center font-mono text-gray-500">{item.qty}</td>
                                                <td className="p-3">
                                                    <div className="font-bold text-orange-600 dark:text-orange-400">{new Date(item.expire_date).toLocaleDateString('fr-FR')}</div>
                                                    <div className="text-[10px] text-gray-500">Dans {daysLeft}j</div>
                                                </td>
                                                <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-gray-200">
                                                    {formatCurrency(item.risk_value)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StockBIDashboard;