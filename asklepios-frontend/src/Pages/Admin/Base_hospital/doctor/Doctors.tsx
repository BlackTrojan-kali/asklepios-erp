import React, { useEffect, useState } from 'react';
import { 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Loader2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Phone,
    Stethoscope,
    Building2,
    Mail
} from 'lucide-react';
import Swal from 'sweetalert2';

// --- STORES ---
import useDoctorStore from '../../../../functions/base_hospital/useDoctorStore'; // Ajuste le chemin
import useCenterStore from '../../../../functions/center/useCenterStore'; 
import useDepartmentStore from '../../../../functions/departments/useDepartmentStore'; 

// --- TYPES ---
import type { DoctorDto } from '../../../../types/DoctorTypes';

// --- MODALES ---
import { CreateDoctorModal } from '../../../../components/modals/Base_hopital/Doctor/CreateDoctorModal';
import { UpdateDoctorModal } from '../../../../components/modals/Base_hopital/Doctor/UpdateDoctorModal';

const Doctors = () => {
    // --- STORES MÉDECINS ---
    const { 
        doctors, loading, pagination, 
        getDoctors, deleteDoctor 
    } = useDoctorStore();

    // --- STORES DÉPENDANCES (Pour les filtres et les formulaires) ---
    const { centers, getCenters } = useCenterStore();
    const { departments, getDepartments } = useDepartmentStore();

    // --- ÉTATS ---
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCenterFilter, setSelectedCenterFilter] = useState('');
    const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

    // États pour l'ouverture des modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorDto | null>(null);

    // --- CHARGEMENT INITIAL ---
    useEffect(() => {
        // Chargement des données de référence (Centres & Départements) pour les dropdowns
        // On demande 100 éléments par page pour s'assurer de récupérer la liste complète
        getCenters(1, {}, 100);
        getDepartments(1, {}, 100);
    }, [getCenters, getDepartments]);

    
    const fetchDoctors = (targetPage: number = 1) => {
        getDoctors(targetPage, { 
            search: searchQuery,
            center_id: selectedCenterFilter,
            department_id: selectedDeptFilter
        });
    };

    useEffect(() => {
        // Chargement des médecins avec les filtres actuels
        fetchDoctors(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);
// Action : Rafraîchir la liste actuelle
    const handleRefresh = () => {
        fetchDoctors(page);
    };

    // Soumission du formulaire de recherche/filtre
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchDoctors(1);
    };

    // Réinitialisation des filtres
    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedCenterFilter('');
        setSelectedDeptFilter('');
        setPage(1);
        getDoctors(1, { search: '', center_id: '', department_id: '' });
    };

    // Action : Supprimer un médecin
    const handleDelete = async (id: number, name: string) => {
        const result = await Swal.fire({
            title: 'Supprimer ce profil ?',
            text: `Le compte et le profil de Dr. ${name} seront définitivement supprimés.`,
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
            await deleteDoctor(id);
        }
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                        <Stethoscope size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Personnel Médical</h1>
                            {pagination && (
                                <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                                    {pagination.total} {pagination.total > 1 ? 'médecins' : 'médecin'}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez les profils, les spécialités et les affectations des médecins.</p>
                    </div>
                </div>
                
                {/* Boutons d'action rapides */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 flex-1 sm:flex-none"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin text-indigo-600" : ""} />
                        <span className="hidden sm:inline">Rafraîchir</span>
                    </button>

                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex-1 sm:flex-none"
                    >
                        <Plus size={18} />
                        Ajouter un médecin
                    </button>
                </div>
            </div>

            {/* SECTION DE FILTRES */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    
                    {/* Recherche Texte */}
                    <div className="relative md:col-span-2">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Rechercher par nom, email, téléphone ou spécialité..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 p-2 min-h-[42px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-sm text-slate-800 dark:text-white transition-colors"
                        />
                    </div>

                    {/* Filtre Centre */}
                    <div>
                        <select
                            value={selectedCenterFilter}
                            onChange={(e) => {
                                setSelectedCenterFilter(e.target.value);
                                setSelectedDeptFilter(''); // Reset dept if center changes
                            }}
                            className="w-full p-2 min-h-[42px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-sm text-slate-800 dark:text-white transition-colors"
                        >
                            <option value="">Tous les centres</option>
                            {centers.map(center => (
                                <option key={center.id} value={center.id}>{center.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button 
                            type="submit" 
                            className="flex-1 bg-slate-800 hover:bg-slate-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 min-h-[42px] rounded-lg font-medium transition-colors text-sm shadow-sm"
                        >
                            Filtrer
                        </button>
                        {(searchQuery || selectedCenterFilter || selectedDeptFilter) && (
                            <button 
                                type="button"
                                onClick={handleResetFilters}
                                className="px-4 py-2 min-h-[42px] bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border dark:border-gray-600 rounded-lg font-medium transition-colors text-sm"
                            >
                                Effacer
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* LISTE / TABLEAU DES MÉDECINS */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Identité & Contact</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Spécialité</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Affectation</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-2" />
                                        <p className="text-gray-500 dark:text-gray-400">Chargement des profils...</p>
                                    </td>
                                </tr>
                            ) : doctors.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Stethoscope size={48} className="mb-3 opacity-40 text-indigo-500" />
                                            <p className="font-medium">Aucun médecin trouvé.</p>
                                            <p className="text-xs text-gray-400 mt-1">Modifiez vos filtres ou ajoutez un nouveau profil.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                doctors.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        
                                        {/* IDENTITÉ & CONTACT */}
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 dark:text-gray-200">
                                                    Dr. {item.user?.first_name} {item.user?.last_name || ''}
                                                </span>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1"><Phone size={12} /> {item.user?.phone}</span>
                                                    <span className="flex items-center gap-1"><Mail size={12} /> {item.user?.email}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* SPÉCIALITÉ */}
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                                    {item.speciality}
                                                </span>
                                                {item.specifications && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {item.specifications}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* AFFECTATION */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                                                <Building2 size={16} className="text-gray-400" />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{item.center?.name || 'Non assigné'}</span>
                                                    {item.department && (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">Dép: {item.department.name}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button 
                                                    onClick={() => setSelectedDoctor(item)} 
                                                    title="Modifier le profil" 
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id, `${item.user?.first_name} ${item.user?.last_name || ''}`)} 
                                                    title="Supprimer le médecin" 
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
                {!loading && doctors.length > 0 && pagination && pagination.lastPage > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Page <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.currentPage}</span> sur <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.lastPage}</span>
                        </span>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPage(page - 1)}
                                disabled={pagination.currentPage === 1}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button 
                                onClick={() => setPage(page + 1)}
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
            <CreateDoctorModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                centers={centers}
                departments={departments}
            />

            <UpdateDoctorModal 
                isOpen={!!selectedDoctor} 
                onClose={() => setSelectedDoctor(null)} 
                doctor={selectedDoctor}
                centers={centers}
                departments={departments}
            />

        </div>
    );
};

export default Doctors;