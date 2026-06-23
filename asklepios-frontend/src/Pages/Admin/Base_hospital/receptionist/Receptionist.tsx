import React, { useEffect, useState } from 'react';
import { 
    Users, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Loader2,
    Building2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Monitor
} from 'lucide-react';
import Swal from 'sweetalert2';
import Select from 'react-select';

// Stores
import useReceptionistStore from '../../../../functions/receptionist/useReceptionistStore';
import useCenterStore from '../../../../functions/center/useCenterStore';

// Types
import type { ReceptionistDto } from '../../../../types/ReceptionistTypes';

// Modales
import { CreateReceptionistModal } from '../../../../components/modals/Base_hopital/receptionist/CreateReceptionistModal';
import { UpdateReceptionistModal } from '../../../../components/modals/Base_hopital/receptionist/UpdateReceptionistModal';

const Receptionists = () => {
    // --- STORES ---
    const { 
        receptionists, loading, pagination, 
        getReceptionists, deleteReceptionist 
    } = useReceptionistStore();
    
    const { centers, getCenters } = useCenterStore();

    // --- ÉTATS ---
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        search: '',
        center_id: ''
    });

    // États pour l'ouverture des modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedReceptionist, setSelectedReceptionist] = useState<ReceptionistDto | null>(null);

    // --- CHARGEMENT INITIAL ---
    useEffect(() => {
        getReceptionists(page, filters);
        getCenters(1, {}, 100); // Récupère une liste large de centres pour le filtre
    }, [getReceptionists, getCenters, page]);

    // Action : Rafraîchir la liste actuelle
    const handleRefresh = () => {
        getReceptionists(page, filters);
    };

    // Soumission du formulaire de filtrage
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1); // Retour à la page 1 lors d'une nouvelle recherche
        getReceptionists(1, filters);
    };

    // Réinitialisation globale des filtres
    const handleResetFilters = () => {
        setFilters({ search: '', center_id: '' });
        setPage(1);
        getReceptionists(1, { search: '', center_id: '' });
    };

    // Action : Supprimer un réceptionniste
    const handleDelete = async (id: number, name: string) => {
        const result = await Swal.fire({
            title: 'Supprimer ce réceptionniste ?',
            text: `Le compte de ${name} ainsi que son profil d'accès seront définitivement supprimés de la plateforme.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, supprimer',
            customClass: {
                popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200'
            }
        });
        
        if (result.isConfirmed) {
            await deleteReceptionist(id);
        }
    };

    // Options des centres formatées pour react-select
    const centerOptions = centers.map(c => ({ value: c.id, label: c.name }));

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                        <Users size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Équipe de Réception</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez les profils des réceptionnistes, leurs guichets et leurs centres d'affectation.</p>
                    </div>
                </div>
                
                {/* Boutons d'action rapides */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
                        title="Rafraîchir la liste"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin text-indigo-600" : ""} />
                        <span className="hidden sm:inline">Rafraîchir</span>
                    </button>

                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex-1 sm:flex-none"
                    >
                        <Plus size={18} />
                        Nouveau Réceptionniste
                    </button>
                </div>
            </div>

            {/* SECTION DES FILTRES */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    
                    {/* Recherche par mot-clé */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Recherche rapide</label>
                        <input 
                            type="text" 
                            placeholder="Rechercher par nom, email, téléphone, guichet..."
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                            className="w-full p-2 min-h-[40px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-sm text-slate-800 dark:text-white transition-colors"
                        />
                    </div>

                    {/* Filtre par Centre */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Filtrer par centre d'affectation</label>
                        <Select 
                            options={centerOptions}
                            value={centerOptions.find(opt => opt.value === filters.center_id) || null}
                            onChange={(selected) => setFilters({...filters, center_id: selected ? selected.value : ''})}
                            placeholder="Tous les centres"
                            isClearable
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    backgroundColor: '#ffffff',
                                    borderColor: state.isFocused ? '#4f46e5' : '#e5e7eb',
                                    boxShadow: state.isFocused ? '0 0 0 1px #4f46e5' : 'none',
                                    minHeight: '40px',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer'
                                }),
                                menu: (base) => ({ ...base, backgroundColor: '#ffffff', zIndex: 50 }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isSelected ? '#e0e7ff' : state.isFocused ? '#f3f4f6' : '#ffffff',
                                    color: state.isSelected ? '#4f46e5' : '#000000',
                                    cursor: 'pointer',
                                }),
                                singleValue: (base) => ({ ...base, color: '#000000' }),
                                input: (base) => ({ ...base, color: '#000000' }),
                                placeholder: (base) => ({ ...base, color: '#6b7280' }),
                            }}
                        />
                    </div>

                    {/* Boutons d'action de filtrage */}
                    <div className="flex gap-2">
                        <button 
                            type="submit" 
                            className="flex-1 bg-slate-800 hover:bg-slate-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 min-h-[40px] rounded-lg font-medium transition-colors text-sm flex justify-center items-center gap-2 shadow-sm"
                        >
                            <Search size={16} /> Filtrer
                        </button>
                        <button 
                            type="button"
                            onClick={handleResetFilters}
                            className="px-4 py-2 min-h-[40px] bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border dark:border-gray-600 rounded-lg font-medium transition-colors text-sm"
                        >
                            Réinitialiser
                        </button>
                    </div>
                </form>
            </div>

            {/* LISTE / TABLEAU DES RÉCEPTIONNISTES */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Réceptionniste</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Centre d'affectation</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guichet / Poste</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-2" />
                                        <p className="text-gray-500 dark:text-gray-400">Chargement des réceptionnistes...</p>
                                    </td>
                                </tr>
                            ) : receptionists.length === 0 ? ( // CORRECTION ICI (avec le "s")
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Users size={48} className="mb-3 opacity-40 text-indigo-500" />
                                            <p className="font-medium">Aucun réceptionniste trouvé.</p>
                                            <p className="text-xs text-gray-400 mt-1">Modifiez vos filtres ou créez un nouveau profil d'accès.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                receptionists.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        
                                        {/* IDENTITÉ */}
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-gray-200">
                                                {item.user?.first_name} {item.user?.last_name}
                                            </div>
                                            <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                                {item.user?.email}
                                            </div>
                                        </td>

                                        {/* CONTACT */}
                                        <td className="p-4 font-medium text-slate-700 dark:text-gray-300">
                                            {item.user?.phone || 'N/A'}
                                        </td>
                                        
                                        {/* CENTRE MÉDICAL */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-gray-300">
                                                <Building2 size={14} className="text-gray-400 shrink-0" />
                                                <span className="font-medium">{item.center?.name || 'Centre inconnu'}</span>
                                            </div>
                                        </td>

                                        {/* GUICHET / BUREAU */}
                                        <td className="p-4">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50 text-xs font-semibold">
                                                <Monitor size={13} />
                                                {item.desk_name}
                                            </div>
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button 
                                                    onClick={() => setSelectedReceptionist(item)} 
                                                    title="Modifier le profil" 
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id, `${item.user?.first_name} ${item.user?.last_name}`)} 
                                                    title="Supprimer définitivement" 
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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

                {/* LOGIQUE DE PAGINATION */}
                {!loading && receptionists.length > 0 && pagination && pagination.lastPage > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Page <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.currentPage}</span> sur <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.lastPage}</span>
                            <span className="ml-2 hidden sm:inline">({pagination.total} réceptionnistes enregistrés)</span>
                        </span>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => { setPage(page - 1); getReceptionists(page - 1, filters); }}
                                disabled={pagination.currentPage === 1}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button 
                                onClick={() => { setPage(page + 1); getReceptionists(page + 1, filters); }}
                                disabled={pagination.currentPage === pagination.lastPage}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* RENDU DES MODALES */}
            <CreateReceptionistModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                centers={centers} 
            />

            <UpdateReceptionistModal 
                isOpen={!!selectedReceptionist} 
                onClose={() => setSelectedReceptionist(null)} 
                receptionist={selectedReceptionist}
                centers={centers} 
            />

        </div>
    );
};

export default Receptionists; 