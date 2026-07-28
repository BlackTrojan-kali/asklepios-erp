import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, Activity, Package, ShieldAlert, AlertTriangle, 
    Calendar, Building2, Loader2, RefreshCw, DollarSign, Pill, 
    PieChart as PieChartIcon, BarChart2, AlertCircle
} from 'lucide-react';
import Select from 'react-select';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

// --- STORES & TYPES ---
import usePharmacyBiStore from '../../../functions/bi/usePharmacyBiStore';
import useCenterStore from '../../../functions/center/useCenterStore';
import type { PharmacyBiFilters } from '../../../types/BiTypes';

// --- UTILITAIRES ---
const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })
        .format(amount)
        .replace('XAF', 'FCFA');
};

const COLORS = ['#00a896', '#003366', '#f59e0b', '#ef4444', '#8b5cf6'];

export const PharmacyBiDashboard = () => {
    // --- STORES ---
    const { 
        kpis, salesAnalytics, inventoryValuation, minsanteCompliance, 
        globalLoading, fetchAllBiData 
    } = usePharmacyBiStore();
    const { centers, getCenters } = useCenterStore();

    // --- ÉTATS ---
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SALES' | 'VALUATION' | 'COMPLIANCE'>('OVERVIEW');
    const [filters, setFilters] = useState<PharmacyBiFilters>({
        group_by: 'date'
    });
    const [selectedCenter, setSelectedCenter] = useState<{value: string, label: string} | null>(null);

    // --- INITIALISATION ---
    useEffect(() => {
        getCenters(1, {}, 50);
        fetchAllBiData(filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Au chargement initial

    // --- GESTION DES FILTRES ---
    const handleApplyFilters = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const currentFilters: PharmacyBiFilters = {
            ...filters,
            center_id: selectedCenter ? Number(selectedCenter.value) : undefined
        };
        fetchAllBiData(currentFilters);
    };

    const handleResetFilters = () => {
        setFilters({ group_by: 'date' });
        setSelectedCenter(null);
        fetchAllBiData({ group_by: 'date' });
    };

    const centerOptions = centers.map(c => ({ value: c.id.toString(), label: c.name }));

    // ========================================================================
    // SOUS-COMPOSANTS D'AFFICHAGE
    // ========================================================================

    const renderOverview = () => {
        if (!kpis) return null;
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
                {/* CA Total */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chiffre d'Affaires</p>
                            <h3 className="text-2xl font-black text-[#003366] dark:text-white mt-1">{formatFCFA(kpis.total_revenue)}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl"><DollarSign size={24} /></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-4">Sur {kpis.total_transactions} transactions</p>
                </div>

                {/* Marge Brute */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marge Brute</p>
                            <h3 className="text-2xl font-black text-[#00a896] mt-1">{formatFCFA(kpis.gross_margin)}</h3>
                        </div>
                        <div className="p-3 bg-teal-50 dark:bg-teal-900/30 text-[#00a896] rounded-xl"><TrendingUp size={24} /></div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="px-2 py-1 bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 text-xs font-bold rounded-lg">
                            {kpis.margin_percentage}%
                        </span>
                        <p className="text-xs text-slate-400">Taux de marge global</p>
                    </div>
                </div>

                {/* Panier Moyen */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Panier Moyen</p>
                            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{formatFCFA(kpis.average_basket)}</h3>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl"><Activity size={24} /></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-4">Par ordonnance / client</p>
                </div>

                {/* Info Conformité (Raccourci) */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alertes MINSANTE</p>
                            <h3 className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
                                {(minsanteCompliance?.expired_batches_count || 0) + (minsanteCompliance?.low_stock_alerts_count || 0)}
                            </h3>
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-xl"><ShieldAlert size={24} /></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-4">Péremptions ou ruptures détectées</p>
                </div>
            </div>
        );
    };

    const renderSalesAnalytics = () => {
        if (!salesAnalytics) return null;

        // Préparation des données pour les PieCharts
        const paymentPieData = salesAnalytics.payment_methods.map(pm => ({ name: pm.payment_method, value: pm.revenue }));
        const prescriptionPieData = [
            { name: 'Sous Ordonnance', value: salesAnalytics.prescription_ratio.prescription_revenue },
            { name: 'Vente Libre (OTC)', value: salesAnalytics.prescription_ratio.otc_revenue }
        ];

        return (
            <div className="space-y-6 animate-fadeIn">
                {/* Graphique des tendances */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-[#00a896]" /> Évolution du Chiffre d'Affaires
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={salesAnalytics.sales_trends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="period" tick={{fontSize: 10}} stroke="#94a3b8" />
                                <YAxis tick={{fontSize: 10}} stroke="#94a3b8" tickFormatter={(val) => `${val / 1000}k`} />
                                <Tooltip formatter={(value: number) => formatFCFA(value)} labelStyle={{color: '#0f172a'}} />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" name="Chiffre d'Affaires" stroke="#00a896" strokeWidth={3} dot={{r: 4}} activeDot={{r: 8}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Répartition des paiements */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <PieChartIcon size={18} className="text-[#003366]" /> Modes de Paiement
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={paymentPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {paymentPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatFCFA(value)} />
                                    <Legend wrapperStyle={{fontSize: '11px'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Ventes Libres vs Ordonnances */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <Pill size={18} className="text-[#003366]" /> Ratio Prescriptions
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={prescriptionPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                                        <Cell fill="#00a896" />
                                        <Cell fill="#f59e0b" />
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatFCFA(value)} />
                                    <Legend wrapperStyle={{fontSize: '11px'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top 10 Articles */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <BarChart2 size={18} className="text-[#003366]" /> Top Articles (CA)
                        </h3>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                            {salesAnalytics.top_articles.map((art, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b border-slate-50 dark:border-slate-700 pb-2">
                                    <div className="truncate pr-4">
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{art.article_name}</p>
                                        <p className="text-[10px] text-slate-400">{art.total_qty} vendus • {art.category_name}</p>
                                    </div>
                                    <span className="text-xs font-black text-[#00a896] shrink-0">{formatFCFA(art.total_revenue)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderInventoryValuation = () => {
        if (!inventoryValuation) return null;
        return (
            <div className="space-y-6 animate-fadeIn">
                {/* Cartes de valorisation */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-[#003366] text-white p-6 rounded-2xl shadow-md">
                        <p className="text-xs font-medium text-blue-200 uppercase tracking-wider">Valeur d'Achat (Immobilisée)</p>
                        <h3 className="text-3xl font-black mt-2">{formatFCFA(inventoryValuation.total_purchase_value)}</h3>
                        <p className="text-xs text-blue-300 mt-2">Capital actuellement bloqué en stock</p>
                    </div>
                    <div className="bg-[#00a896] text-white p-6 rounded-2xl shadow-md">
                        <p className="text-xs font-medium text-teal-100 uppercase tracking-wider">Valeur de Vente Potentielle</p>
                        <h3 className="text-3xl font-black mt-2">{formatFCFA(inventoryValuation.total_selling_value)}</h3>
                        <p className="text-xs text-teal-100 mt-2">Projection du CA à la revente totale</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bénéfice Brut Espéré</p>
                        <h3 className="text-3xl font-black text-amber-500 mt-2">{formatFCFA(inventoryValuation.potential_profit)}</h3>
                        <p className="text-xs text-slate-400 mt-2">En l'absence de péremptions ou pertes</p>
                    </div>
                </div>

                {/* Graphique par Catégorie */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Package size={18} className="text-[#003366]" /> Immobilisation Financière par Catégorie
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={inventoryValuation.by_category} layout="vertical" margin={{ left: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" tickFormatter={(val) => `${val / 1000}k`} tick={{fontSize: 10}} stroke="#94a3b8" />
                                <YAxis dataKey="category_name" type="category" tick={{fontSize: 10}} stroke="#94a3b8" width={100} />
                                <Tooltip formatter={(value: number) => formatFCFA(value)} />
                                <Bar dataKey="purchase_value" name="Valeur d'Achat" fill="#003366" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    const renderMinsanteCompliance = () => {
        if (!minsanteCompliance) return null;
        return (
            <div className="space-y-6 animate-fadeIn">
                {/* Cartes d'Alerte */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-2">
                            <ShieldAlert size={24} />
                            <h3 className="font-bold">Lots Périmés</h3>
                        </div>
                        <p className="text-3xl font-black text-red-700 dark:text-red-300">{minsanteCompliance.expired_batches_count}</p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">À retirer immédiatement des rayons</p>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400 mb-2">
                            <AlertTriangle size={24} />
                            <h3 className="font-bold">Péremptions imminentes</h3>
                        </div>
                        <p className="text-3xl font-black text-orange-700 dark:text-orange-300">{minsanteCompliance.expiring_batches_count - minsanteCompliance.expired_batches_count}</p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Dans les 6 prochains mois</p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 mb-2">
                            <AlertCircle size={24} />
                            <h3 className="font-bold">Ruptures de Stock</h3>
                        </div>
                        <p className="text-3xl font-black text-blue-700 dark:text-blue-300">{minsanteCompliance.low_stock_alerts_count}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Sous le seuil minimum de sécurité</p>
                    </div>
                </div>

                {/* Tableaux Détaillés */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tableau Péremptions */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Détail des lots à risque</h3>
                        </div>
                        <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 sticky top-0">
                                    <tr>
                                        <th className="p-3">Article & Lot</th>
                                        <th className="p-3">Succursale</th>
                                        <th className="p-3">Expiration</th>
                                        <th className="p-3">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {minsanteCompliance.expiring_batches_list.map((batch, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="p-3">
                                                <p className="font-bold dark:text-white">{batch.article_name}</p>
                                                <p className="text-slate-400 font-mono">Lot: {batch.batch_number}</p>
                                            </td>
                                            <td className="p-3 text-slate-600 dark:text-slate-300">{batch.branch_name}</td>
                                            <td className="p-3 text-slate-600 dark:text-slate-300">{new Date(batch.expire_date).toLocaleDateString('fr-FR')}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded font-bold text-[9px] uppercase tracking-wider ${
                                                    batch.status === 'EXPIRED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                    {batch.status === 'EXPIRED' ? 'Périmé' : 'À risque'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tableau Ruptures */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Articles en rupture (Sous le seuil)</h3>
                        </div>
                        <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 sticky top-0">
                                    <tr>
                                        <th className="p-3">Article</th>
                                        <th className="p-3 text-right">Seuil d'Alerte</th>
                                        <th className="p-3 text-right">Stock Actuel</th>
                                        <th className="p-3 text-center">Déficit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {minsanteCompliance.low_stock_articles.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="p-3 font-bold dark:text-white">{item.name}</td>
                                            <td className="p-3 text-right text-slate-500">{item.global_min_qty}</td>
                                            <td className="p-3 text-right font-bold text-red-500">{item.total_qty}</td>
                                            <td className="p-3 text-center text-orange-500 font-bold">-{item.global_min_qty - item.total_qty}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-12">
            
            {/* --- EN-TÊTE ET FILTRES --- */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Direction Pharmacie (BI)</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tableau de bord consolidé pour l'aide à la décision stratégique.</p>
                    </div>
                    <button 
                        onClick={() => handleApplyFilters()}
                        className="flex items-center gap-2 bg-[#003366] hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md"
                    >
                        {globalLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                        Actualiser les données
                    </button>
                </div>

                <form className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5"><Calendar size={14}/> Date Début</label>
                        <input type="date" value={filters.start_date || ''} onChange={(e) => setFilters({...filters, start_date: e.target.value})} className="w-full text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white outline-none focus:border-[#00a896]" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5"><Calendar size={14}/> Date Fin</label>
                        <input type="date" value={filters.end_date || ''} onChange={(e) => setFilters({...filters, end_date: e.target.value})} className="w-full text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white outline-none focus:border-[#00a896]" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5"><Building2 size={14}/> Restreindre à un Centre</label>
                        <Select
                            options={centerOptions}
                            value={selectedCenter}
                            onChange={(option) => setSelectedCenter(option)}
                            isClearable placeholder="Tous les centres..."
                            className="text-sm" styles={{ control: (base) => ({...base, borderRadius: '0.5rem'}) }}
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <button type="button" onClick={() => handleApplyFilters()} className="flex-1 bg-[#00a896] text-white p-2.5 rounded-lg font-bold text-sm hover:bg-[#008f7f] transition-colors">Filtrer</button>
                        <button type="button" onClick={handleResetFilters} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 p-2.5 rounded-lg font-bold text-sm hover:bg-slate-300 transition-colors">Effacer</button>
                    </div>
                </form>
            </div>

            {/* --- NAVIGATION DES ONGLETS --- */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700">
                {[
                    { id: 'OVERVIEW', label: "Vue d'ensemble", icon: <Activity size={16} /> },
                    { id: 'SALES', label: "Ventes & Tendances", icon: <TrendingUp size={16} /> },
                    { id: 'VALUATION', label: "Valorisation du Stock", icon: <Package size={16} /> },
                    { id: 'COMPLIANCE', label: "Conformité & Alertes", icon: <ShieldAlert size={16} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
                            activeTab === tab.id 
                            ? 'border-[#00a896] text-[#00a896]' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* --- CONTENU --- */}
            {globalLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 size={40} className="animate-spin text-[#00a896] mb-4" />
                    <p className="font-medium">Calcul des données consolidées en cours...</p>
                </div>
            ) : (
                <div className="pt-4">
                    {activeTab === 'OVERVIEW' && renderOverview()}
                    {activeTab === 'SALES' && renderSalesAnalytics()}
                    {activeTab === 'VALUATION' && renderInventoryValuation()}
                    {activeTab === 'COMPLIANCE' && renderMinsanteCompliance()}
                </div>
            )}

        </div>
    );
};