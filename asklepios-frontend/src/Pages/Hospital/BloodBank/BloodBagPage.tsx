import React, { useEffect, useState, useMemo } from 'react';
import { 
    Droplet, Plus, Search, Filter, Edit, Trash2, 
    Download, Activity, CheckCircle, XCircle, Clock, 
    ThermometerSnowflake, Building, Beaker, Package, AlertTriangle, RefreshCw
} from 'lucide-react';

// --- STORES & COMPOSANTS ---
import useBloodBagStore from '../../../functions/bloodBank/useBloodBagStore';
import useCenterStore from '../../../functions/center/useCenterStore';
import useBloodRefrigeratorStore from '../../../functions/bloodBank/useBloodRefrigeratorStore';
import useBloodDonorStore from '../../../functions/bloodBank/useBloodDonorStore';

import BloodBagModal from '../../../components/modals/Base_hopital/BloodBank/BloodBagModal';
import BloodBagExportModal from '../../../components/modals/Base_hopital/BloodBank/BloodBagExportModal';
import type { BloodBagDto } from '../../../types/BloodManageType';

const BloodBagPage = () => {
    // --- STORES ---
    const { bloodBags, pagination, loading, getBloodBags, deleteBloodBag } = useBloodBagStore();
    
    // Stores pour les listes déroulantes (Modales et Filtres)
    const { centers, getCenters } = useCenterStore();
    const { bloodRefrigerators, getBloodRefrigerators } = useBloodRefrigeratorStore();
    const { bloodDonors, getBloodDonors } = useBloodDonorStore();

    // --- ÉTATS DES MODALES ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [bagToEdit, setBagToEdit] = useState<BloodBagDto | null>(null);

    // --- ÉTATS DES FILTRES ---
    const [searchTerm, setSearchTerm] = useState('');
    const [bloodTypeFilter, setBloodTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [centerFilter, setCenterFilter] = useState('');
    const [refrigeratorFilter, setRefrigeratorFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // --- INITIALISATION (Chargement des référentiels) ---
    useEffect(() => {
        getCenters(1, {}, 100);
        getBloodRefrigerators(1, {}, 500); // Limite haute pour tout récupérer
        getBloodDonors(1, {}, 1000); // Limite haute pour lister les donneurs dans le select
    }, [getCenters, getBloodRefrigerators, getBloodDonors]);

    // --- RECHARGEMENT DES DONNÉES (Avec Debounce) ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            getBloodBags(currentPage, {
                search: searchTerm,
                blood_type: bloodTypeFilter,
                status: statusFilter,
                center_id: centerFilter,
                blood_refrigerator_id: refrigeratorFilter
            });
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, bloodTypeFilter, statusFilter, centerFilter, refrigeratorFilter, currentPage, getBloodBags]);

    // --- ACTIONS ---
    const handleRefresh = () => {
        getBloodBags(currentPage, {
            search: searchTerm,
            blood_type: bloodTypeFilter,
            status: statusFilter,
            center_id: centerFilter,
            blood_refrigerator_id: refrigeratorFilter
        });
    };

    const handleAdd = () => {
        setBagToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (bag: BloodBagDto) => {
        setBagToEdit(bag);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette poche de sang du stock ?")) {
            await deleteBloodBag(id);
        }
    };

    // --- CALCUL DES STATISTIQUES (Aperçu de la page courante) ---
    const stats = useMemo(() => {
        let available = 0;
        let quarantine = 0;
        let expired = 0;
        let used = 0;

        bloodBags.forEach(bag => {
            const isExpiredDate = new Date(bag.expiry_date) < new Date() && bag.status !== 'USED';
            if (isExpiredDate || bag.status === 'EXPIRED') {
                expired++;
            } else if (bag.status === 'AVAILABLE') {
                available++;
            } else if (bag.status === 'QUARANTINE') {
                quarantine++;
            } else if (bag.status === 'USED') {
                used++;
            }
        });

        return { available, quarantine, expired, used };
    }, [bloodBags]);

    // --- UTILITAIRES DE RENDU ---
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded text-[10px] font-bold flex items-center gap-1 w-fit"><CheckCircle size={12}/> Disponible</span>;
            case 'QUARANTINE': return <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded text-[10px] font-bold flex items-center gap-1 w-fit"><Clock size={12}/> Quarantaine</span>;
            case 'USED': return <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-[10px] font-bold flex items-center gap-1 w-fit"><Activity size={12}/> Utilisée</span>;
            case 'EXPIRED': return <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded text-[10px] font-bold flex items-center gap-1 w-fit"><XCircle size={12}/> Expirée</span>;
            default: return null;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'WHOLE_BLOOD': return 'Sang Total';
            case 'RED_CELLS': return 'Globules Rouges';
            case 'PLASMA': return 'Plasma';
            default: return type;
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            
            {/* --- EN-TÊTE ET BOUTONS D'ACTION --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                        <Droplet className="text-red-600" />
                        Stock de Sang
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gérez les poches de sang, leur emplacement et leur date de péremption.
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm disabled:opacity-50"
                        title="Rafraîchir les données"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin text-red-500" : ""} />
                    </button>
                    <button 
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex-1 xl:flex-none bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all"
                    >
                        <Download size={18} /> Rapport PDF
                    </button>
                    <button 
                        onClick={handleAdd}
                        className="flex-1 xl:flex-none bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-red-500/30"
                    >
                        <Plus size={18} /> Ajouter au stock
                    </button>
                </div>
            </div>

            {/* --- CARTOUCHES DE STATISTIQUES (Aperçu Dynamique) --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Aperçu Total</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{pagination?.total || 0}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <Package size={24} className="text-gray-400" />
                    </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Disponibles</p>
                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{stats.available}</p>
                    </div>
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                        <CheckCircle size={24} className="text-emerald-500" />
                    </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl shadow-sm border border-amber-100 dark:border-amber-800/30 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Quarantaine</p>
                        <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{stats.quarantine}</p>
                    </div>
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                        <Clock size={24} className="text-amber-500" />
                    </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl shadow-sm border border-red-100 dark:border-red-800/30 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Expirées</p>
                        <p className="text-2xl font-black text-red-700 dark:text-red-300">{stats.expired}</p>
                    </div>
                    <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
                        <AlertTriangle size={24} className="text-red-500" />
                    </div>
                </div>
            </div>

            {/* --- BARRE DE FILTRES --- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Code-barre ou fournisseur..." 
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none text-slate-700 dark:text-white"
                    />
                </div>
                
                <div className="flex gap-2 flex-wrap xl:flex-nowrap">
                    {/* Filtre Groupe Sanguin */}
                    <div className="flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2">
                        <Droplet size={16} className="text-red-400 mr-2" />
                        <select 
                            value={bloodTypeFilter}
                            onChange={(e) => { setBloodTypeFilter(e.target.value); setCurrentPage(1); }}
                            className="bg-transparent text-sm py-2 outline-none text-slate-700 dark:text-white font-medium"
                        >
                            <option value="">Tous Groupes</option>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                    </div>

                    {/* Filtre Statut */}
                    <div className="flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2">
                        <Filter size={16} className="text-gray-400 mr-2" />
                        <select 
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="bg-transparent text-sm py-2 outline-none text-slate-700 dark:text-white"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="AVAILABLE">Disponible</option>
                            <option value="QUARANTINE">Quarantaine</option>
                            <option value="USED">Utilisée</option>
                            <option value="EXPIRED">Expirée</option>
                        </select>
                    </div>

                    {/* Filtre Frigo */}
                    <select 
                        value={refrigeratorFilter}
                        onChange={(e) => { setRefrigeratorFilter(e.target.value); setCurrentPage(1); }}
                        className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm py-2 px-3 outline-none text-slate-700 dark:text-white"
                    >
                        <option value="">Tous les frigos</option>
                        {bloodRefrigerators.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
            </div>

            {/* --- TABLEAU DU STOCK --- */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Poche (Code / Vol)</th>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs text-center">Groupe Sanguin</th>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Composant</th>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Emplacement / Source</th>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Expiration</th>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Statut</th>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-red-500" />
                                        Chargement du stock...
                                    </td>
                                </tr>
                            ) : bloodBags.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-500 font-medium">Aucune poche de sang trouvée.</td></tr>
                            ) : (
                                bloodBags.map((bag) => {
                                    // Vérification visuelle de la date d'expiration
                                    const isExpired = new Date(bag.expiry_date) < new Date() && bag.status !== 'EXPIRED';

                                    return (
                                        <tr key={bag.id} className={`hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors ${isExpired ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800 dark:text-gray-200 font-mono text-xs flex items-center gap-2">
                                                    {bag.barcode || `ID-${bag.id}`}
                                                </div>
                                                <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                                    <Beaker size={10} /> {bag.volume_ml} ml
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="font-black text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-lg text-base">
                                                    {bag.blood_type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-300 font-medium">
                                                {getTypeLabel(bag.type)}
                                            </td>
                                            <td className="p-4">
                                                <div className="text-xs text-slate-700 dark:text-gray-300 flex items-center gap-1 font-medium">
                                                    <ThermometerSnowflake size={12} className="text-blue-500"/> 
                                                    {bag.blood_refrigerator?.name || 'N/A'}
                                                </div>
                                                <div className="text-[10px] text-gray-500 mt-1 line-clamp-1">
                                                    Source: {bag.blood_donor_id ? `Donneur interne (${bag.blood_donor?.first_name})` : (bag.external_supplier || 'Externe inconnu')}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className={`text-sm font-medium ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
                                                    {new Date(bag.expiry_date).toLocaleDateString('fr-FR')}
                                                </div>
                                                {isExpired && <span className="text-[10px] text-red-500 font-bold">À DÉTRUIRE</span>}
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(isExpired && bag.status !== 'USED' ? 'EXPIRED' : bag.status)}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleEdit(bag)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(bag.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
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
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                            Total : {pagination.total} poche(s)
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

            {/* --- MODALES --- */}
            <BloodBagModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={() => setIsModalOpen(false)}
                bagToEdit={bagToEdit}
                centers={centers}
                refrigerators={bloodRefrigerators}
                donors={bloodDonors}
            />

            <BloodBagExportModal 
                isOpen={isExportModalOpen} 
                onClose={() => setIsExportModalOpen(false)}
                centers={centers}
                refrigerators={bloodRefrigerators}
            />

        </div>
    );
};

export default BloodBagPage;