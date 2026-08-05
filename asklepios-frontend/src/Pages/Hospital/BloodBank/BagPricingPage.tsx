import React, { useEffect, useState } from 'react';
import { Coins, Droplet, Plus, Filter, Edit, Building, RefreshCw } from 'lucide-react';

// --- STORES & COMPOSANTS ---
import useBagPricingStore from '../../../functions/bloodBank/useBagPricingStore';
import useCenterStore from '../../../functions/center/useCenterStore';
import BagPricingModal from '../../../components/modals/Base_hopital/BloodBank/BagPricingModal';
import type { BagPricingDto } from '../../../types/BloodManageType';

const BagPricingPage = () => {
    // --- STORES ---
    const { pricings, loading, getPricings } = useBagPricingStore();
    const { centers, getCenters } = useCenterStore();

    // --- ÉTATS ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pricingToEdit, setPricingToEdit] = useState<BagPricingDto | null>(null);
    const [centerFilter, setCenterFilter] = useState<string>('');

    // --- INITIALISATION ---
    useEffect(() => {
        getCenters(1, {}, 100);
    }, [getCenters]);

    // Recharger les prix quand le filtre de centre change
    useEffect(() => {
        getPricings({ center_id: centerFilter });
    }, [centerFilter, getPricings]);

    // --- ACTIONS ---
    const handleRefresh = () => {
        getPricings({ center_id: centerFilter });
    };

    const handleAdd = () => {
        setPricingToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (pricing: BagPricingDto) => {
        setPricingToEdit(pricing);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            
            {/* --- EN-TÊTE --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                        <Coins className="text-amber-500" />
                        Tarification des Poches de Sang
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Configurez les prix de facturation des poches pour les transfusions selon le centre et le groupe sanguin.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm disabled:opacity-50"
                        title="Rafraîchir les données"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin text-amber-500" : ""} />
                    </button>
                    <button 
                        onClick={handleAdd}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/30"
                    >
                        <Plus size={18} /> Ajouter un tarif
                    </button>
                </div>
            </div>

            {/* --- BARRE DE FILTRE --- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
                <div className="flex items-center gap-3 w-full md:w-1/3">
                    <Filter className="text-gray-400" size={18} />
                    <select 
                        value={centerFilter}
                        onChange={(e) => setCenterFilter(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm py-2 px-3 outline-none text-slate-700 dark:text-white"
                    >
                        <option value="">Tous les centres</option>
                        {centers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* --- TABLEAU --- */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Groupe Sanguin</th>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Centre Médical</th>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs text-right">Prix Unitaire (FCFA)</th>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-amber-500" />
                                        Chargement des tarifs...
                                    </td>
                                </tr>
                            ) : pricings.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-500 font-medium">Aucun tarif configuré.</td></tr>
                            ) : (
                                pricings.map((pricing) => (
                                    <tr key={pricing.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4 text-center w-32">
                                            <span className="font-black text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded text-lg flex items-center justify-center gap-2 w-fit">
                                                <Droplet size={16}/> {pricing.blood_type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                                            <Building size={16} className="text-gray-400" />
                                            {pricing.center?.name || `Centre #${pricing.center_id}`}
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold text-slate-800 dark:text-white text-base">
                                            {new Intl.NumberFormat('fr-FR').format(pricing.price)} <span className="text-xs text-gray-500 ml-1">FCFA</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => handleEdit(pricing)}
                                                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors flex items-center gap-2 ml-auto"
                                                title="Modifier le prix"
                                            >
                                                <Edit size={16} /> <span className="text-xs font-bold">Modifier</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODALE --- */}
            <BagPricingModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => setIsModalOpen(false)}
                centers={centers}
                pricingToEdit={pricingToEdit}
            />

        </div>
    );
};

export default BagPricingPage;