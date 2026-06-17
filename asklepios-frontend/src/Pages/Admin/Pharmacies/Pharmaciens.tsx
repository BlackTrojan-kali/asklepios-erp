import React, { useEffect, useState } from 'react';
import { 
    Users, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Mail, 
    Phone, 
    Shield, 
    MapPin, 
    Loader2,
    UserCircle,
    ChevronLeft,
    ChevronRight,
    RefreshCw  // <-- Nouvelle icône pour le rafraîchissement
} from 'lucide-react';
import Swal from 'sweetalert2';

// Stores
import usePharmacienStore from '../../../functions/pharmacy/usePharmacienStore'; 
import usePharmacyStore from '../../../functions/pharmacy/usePharmacyStore'; 

// Modèles et Types
import type { PharmacienDto } from '../../../types/PharmTypes';

// Modales
import { CreatePharmacienModal } from '../../../components/modals/Pharmacy/Pharmacien/CreatePharmacienModal'; 
import { UpdatePharmacienModal } from '../../../components/modals/Pharmacy/Pharmacien/UpdatePharmacienModal'; 

const Pharmaciens = () => {
    // Hooks des stores
    const { 
        pharmaciens, 
        pagination, 
        loading, 
        getPharmaciens, 
        deletePharmacien 
    } = usePharmacienStore();

    // Récupération des succursales via ton usePharmacyStore
    const { 
        pharmacyBranches: branches, 
        getPharmacyBranches: getBranches 
    } = usePharmacyStore();

    // États pour les filtres
    const [filters, setFilters] = useState({
        search: '',
        position: '',
        branch_id: ''
    });

    // États pour les modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedPharmacien, setSelectedPharmacien] = useState<PharmacienDto | null>(null);

    // Chargement initial des données
    useEffect(() => {
        getPharmaciens({});
        getBranches({}); 
    }, [getPharmaciens, getBranches]);

    // Action de rafraîchissement manuel
    const handleRefresh = () => {
        getPharmaciens({ ...filters, page: pagination.current_page || 1 });
    };

    // Soumission du formulaire de filtre (on force la page 1)
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        getPharmaciens({ ...filters, page: 1 });
    };

    // Réinitialisation des filtres
    const handleResetFilters = () => {
        setFilters({ search: '', position: '', branch_id: '' });
        getPharmaciens({ page: 1 });
    };

    // Gestion du changement de page
    const handlePageChange = (page: number) => {
        getPharmaciens({ ...filters, page });
    };

    // Action : Supprimer un pharmacien
    const handleDelete = async (id: number, name: string) => {
        const result = await Swal.fire({
            title: 'Supprimer ce pharmacien ?',
            text: `Le compte utilisateur de ${name} et ses accès seront définitivement supprimés.`,
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
            await deletePharmacien(id);
        }
    };

    // Calculs pour le texte d'affichage de la pagination
    const fromItem = pagination.total === 0 ? 0 : (pagination.current_page - 1) * pagination.per_page + 1;
    const toItem = Math.min(pagination.current_page * pagination.per_page, pagination.total);

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg">
                        <Users size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Équipe Officinale</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez les comptes, rôles et affectations de vos pharmaciens.</p>
                    </div>
                </div>
                
                {/* Actions de l'en-tête (Rafraîchir + Nouveau) */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button 
                        type="button"
                        onClick={handleRefresh}
                        disabled={loading}
                        title="Rafraîchir la liste"
                        className="p-2 text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors bg-white dark:bg-gray-800 disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 bg-[#00a896] hover:bg-[#008f7e] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap"
                    >
                        <Plus size={18} />
                        Nouveau Pharmacien
                    </button>
                </div>
            </div>

            {/* BARRE DE FILTRES */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
                    
                    <div className="md:col-span-2 lg:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Recherche (Nom, Email, Tél)</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Jean Dupont, jean@..."
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value})}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Rôle / Poste</label>
                        <select 
                            value={filters.position}
                            onChange={(e) => setFilters({...filters, position: e.target.value})}
                            className="w-full p-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white transition-colors"
                        >
                            <option value="">Tous les postes</option>
                            <option value="magasin">Magasinier</option>
                            <option value="vente">Vendeur</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Succursale</label>
                        <select 
                            value={filters.branch_id}
                            onChange={(e) => setFilters({...filters, branch_id: e.target.value})}
                            className="w-full p-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white transition-colors"
                        >
                            <option value="">Toutes les succursales</option>
                            {branches?.map(branch => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2 lg:col-span-1">
                        <button 
                            type="submit" 
                            className="flex-1 bg-slate-800 hover:bg-slate-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex justify-center items-center gap-2"
                        >
                            <Search size={16} /> Filtrer
                        </button>
                        <button 
                            type="button"
                            onClick={handleResetFilters}
                            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border dark:border-gray-600 rounded-lg font-medium transition-colors text-sm"
                            title="Réinitialiser les filtres"
                        >
                            X
                        </button>
                    </div>
                </form>
            </div>

            {/* TABLEAU DES PHARMACIENS & PAGINATION */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Identité & Contact</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Poste</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Succursale</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center">
                                        <Loader2 size={32} className="animate-spin text-[#00a896] mx-auto mb-2" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement de l'équipe...</p>
                                    </td>
                                </tr>
                            ) : pharmaciens.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Users size={48} className="mb-3 opacity-50" />
                                            <p>Aucun pharmacien trouvé.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                pharmaciens.map((pharmacien) => (
                                    <tr key={pharmacien.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-slate-500 dark:text-gray-300">
                                                    <UserCircle size={28} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 dark:text-gray-200">
                                                        {pharmacien.user?.first_name} {pharmacien.user?.last_name || ''}
                                                    </span>
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-xs text-slate-500 dark:text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Mail size={12} /> {pharmacien.user?.email}
                                                        </span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Phone size={12} /> {pharmacien.user?.phone}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="p-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                                                pharmacien.position === 'magasin' 
                                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50' 
                                                : 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800/50'
                                            }`}>
                                                <Shield size={14} />
                                                {pharmacien.position === 'magasin' ? 'Magasinier' : 'Vendeur'}
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-gray-300">
                                                <MapPin size={16} className="text-gray-400" />
                                                {pharmacien.branch?.name || "Non affecté"}
                                            </div>
                                        </td>

                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button 
                                                    onClick={() => setSelectedPharmacien(pharmacien)} 
                                                    title="Modifier" 
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(pharmacien.id, pharmacien.user?.first_name || 'Ce pharmacien')} 
                                                    title="Supprimer" 
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- BARRE DE PAGINATION --- */}
                {pagination.total > 0 && (
                    <div className="bg-slate-50 dark:bg-gray-900/30 px-4 py-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1 || loading}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                Précédent
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page || loading}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                Suivant
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700 dark:text-gray-400">
                                    Affichage de{' '}
                                    <span className="font-semibold text-slate-800 dark:text-white">{fromItem}</span>
                                    {' '}à{' '}
                                    <span className="font-semibold text-slate-800 dark:text-white">{toItem}</span>
                                    {' '}sur{' '}
                                    <span className="font-semibold text-slate-800 dark:text-white">{pagination.total}</span>
                                    {' '}éléments
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1 || loading}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                    >
                                        <span className="sr-only">Précédent</span>
                                        <ChevronLeft size={16} />
                                    </button>
                                    
                                    <div className="px-4 py-2 border-t border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-slate-700 dark:text-gray-300 select-none">
                                        Page {pagination.current_page} sur {pagination.last_page}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(pagination.current_page + 1)}
                                        disabled={pagination.current_page === pagination.last_page || loading}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                    >
                                        <span className="sr-only">Suivant</span>
                                        <ChevronRight size={16} />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALES */}
            <CreatePharmacienModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                branches={branches || []}
            />

            <UpdatePharmacienModal 
                isOpen={!!selectedPharmacien} 
                onClose={() => setSelectedPharmacien(null)} 
                pharmacien={selectedPharmacien}
                branches={branches || []}
            />

        </div>
    );
};

export default Pharmaciens;