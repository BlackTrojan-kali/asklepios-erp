import React, { useEffect, useState } from 'react';
import { 
    ThermometerSnowflake, Plus, Search, Filter, 
    Edit, Trash2, Activity, AlertTriangle, XCircle, Eye, RefreshCw 
} from 'lucide-react';

// --- STORES & COMPOSANTS ---
import useBloodRefrigeratorStore from '../../../functions/bloodBank/useBloodRefrigeratorStore';
import useCenterStore from '../../../functions/center/useCenterStore';
import BloodRefrigeratorModal from '../../../components/modals/Base_hopital/BloodBank/BloodRefrigeratorModal';
import BloodRefrigeratorDetailsModal from '../../../components/modals/Base_hopital/BloodBank/BloodRefrigeratorDetailsModal';
import type { BloodRefrigeratorDto } from '../../../types/BloodManageType';

const BloodRefrigeratorPage = () => {
    // Stores
    const { 
        bloodRefrigerators, 
        pagination, 
        loading, 
        getBloodRefrigerators, 
        deleteBloodRefrigerator 
    } = useBloodRefrigeratorStore();
    
    const { centers, getCenters } = useCenterStore();

    // États locaux
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refrigeratorToEdit, setRefrigeratorToEdit] = useState<BloodRefrigeratorDto | null>(null);
    
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [refrigeratorToView, setRefrigeratorToView] = useState<BloodRefrigeratorDto | null>(null);

    // Filtres
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [centerFilter, setCenterFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Initialisation
    useEffect(() => {
        getCenters(1, {}, 100);
    }, [getCenters]);

    // Rechargement des données quand les filtres ou la page changent
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            getBloodRefrigerators(currentPage, {
                search: searchTerm,
                status: statusFilter,
                center_id: centerFilter
            });
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, statusFilter, centerFilter, currentPage, getBloodRefrigerators]);

    // Actions
    const handleRefresh = () => {
        getBloodRefrigerators(currentPage, {
            search: searchTerm,
            status: statusFilter,
            center_id: centerFilter
        });
    };

    const handleAdd = () => {
        setRefrigeratorToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (fridge: BloodRefrigeratorDto) => {
        setRefrigeratorToEdit(fridge);
        setIsModalOpen(true);
    };

    const handleViewDetails = (fridge: BloodRefrigeratorDto) => {
        setRefrigeratorToView(fridge);
        setIsDetailsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce réfrigérateur ?")) {
            await deleteBloodRefrigerator(id);
        }
    };

    // Utilitaires de badges
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded text-[10px] font-bold flex items-center gap-1 w-fit"><Activity size={12}/> Actif</span>;
            case 'MAINTENANCE':
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded text-[10px] font-bold flex items-center gap-1 w-fit"><AlertTriangle size={12}/> Maintenance</span>;
            case 'OUT_OF_SERVICE':
                return <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded text-[10px] font-bold flex items-center gap-1 w-fit"><XCircle size={12}/> Hors Service</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-[10px] font-bold">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            
            {/* EN-TÊTE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                        <ThermometerSnowflake className="text-blue-500" />
                        Banque de Sang : Réfrigérateurs
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gérez les équipements de conservation et assurez la chaîne du froid.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm disabled:opacity-50"
                        title="Rafraîchir les données"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin text-blue-500" : ""} />
                    </button>
                    <button 
                        onClick={handleAdd}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30"
                    >
                        <Plus size={18} /> Ajouter un équipement
                    </button>
                </div>
            </div>

            {/* BARRE DE FILTRES */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Rechercher un frigo..." 
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-white"
                    />
                </div>
                
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2">
                        <Filter size={16} className="text-gray-400 mr-2" />
                        <select 
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="bg-transparent text-sm py-2 outline-none text-slate-700 dark:text-white"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="ACTIVE">Actif</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="OUT_OF_SERVICE">Hors Service</option>
                        </select>
                    </div>

                    <select 
                        value={centerFilter}
                        onChange={(e) => { setCenterFilter(e.target.value); setCurrentPage(1); }}
                        className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm py-2 px-3 outline-none text-slate-700 dark:text-white"
                    >
                        <option value="">Tous les centres</option>
                        {centers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* TABLEAU */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Équipement</th>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Centre</th>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs text-center">Température</th>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Statut</th>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">
                                    <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-blue-500" />
                                    Chargement des équipements...
                                </td></tr>
                            ) : bloodRefrigerators.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-medium">Aucun réfrigérateur trouvé.</td></tr>
                            ) : (
                                bloodRefrigerators.map((fridge) => (
                                    <tr key={fridge.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4 font-bold text-slate-800 dark:text-gray-200">
                                            {fridge.name}
                                        </td>
                                        <td className="p-4 text-gray-600 dark:text-gray-400">
                                            {fridge.center?.name || "Non assigné"}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded">
                                                {fridge.target_temperature} °C
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(fridge.status)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleViewDetails(fridge)}
                                                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded transition-colors"
                                                    title="Voir le contenu"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleEdit(fridge)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(fridge.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {pagination && pagination.lastPage > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                            Total : {pagination.total} équipement(s)
                        </span>
                        <div className="flex gap-1">
                            <button 
                                disabled={currentPage === 1 || loading}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                            >
                                Précédent
                            </button>
                            <span className="px-3 py-1 text-sm font-bold text-gray-700 dark:text-gray-300">
                                {currentPage} / {pagination.lastPage}
                            </span>
                            <button 
                                disabled={currentPage === pagination.lastPage || loading}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALES */}
            <BloodRefrigeratorModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                refrigeratorToEdit={refrigeratorToEdit}
                centers={centers}
            />

            <BloodRefrigeratorDetailsModal 
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                refrigerator={refrigeratorToView}
            />

        </div>
    );
};

export default BloodRefrigeratorPage;