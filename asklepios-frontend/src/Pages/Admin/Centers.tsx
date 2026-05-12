import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Building2, MapPin, Phone, Globe, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

// Stores
import useCenterStore from '../../functions/center/useCenterStore';
import useCountryStore from '../../functions/country/useCountryStore';

// Modèles et Types
import type { CenterDto } from '../../types/types';

// Modales
import { CreateCenterModal } from '../../components/modals/center/CreateCenterModal';
import { UpdateCenterModal } from '../../components/modals/center/UpdateCenterModal';

const Centers = () => {
    // Hooks des stores
    const { 
        centers, loading, pagination, 
        getCenters, deleteCenter 
    } = useCenterStore();
    
    const { countries, getCountries } = useCountryStore();

    // États pour les filtres
    const [filters, setFilters] = useState({
        search: '',
        address: '',
        country_id: ''
    });

    // États pour les modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedCenter, setSelectedCenter] = useState<CenterDto | null>(null);

    // Chargement initial des données
    useEffect(() => {
        getCenters(1, {});
        getCountries(1, "", 100); // Récupère les pays pour le filtre et les modales
    }, [getCenters, getCountries]);

    // Soumission du formulaire de filtre
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        getCenters(1, filters);
    };

    // Réinitialisation des filtres
    const handleResetFilters = () => {
        setFilters({ search: '', address: '', country_id: '' });
        getCenters(1, {});
    };

    // Action : Supprimer un centre
    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer ce centre ?',
            text: "Cette action est irréversible. Les données liées à ce centre pourraient être impactées.",
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
            await deleteCenter(id);
        }
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 text-[#00a896] dark:bg-teal-900/30 dark:text-teal-400 rounded-lg">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Centres Médicaux</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez les différentes succursales et annexes de votre hôpital.</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 bg-[#00a896] hover:bg-[#008f7e] dark:bg-teal-600 dark:hover:bg-teal-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Nouveau Centre
                </button>
            </div>

            {/* BARRE DE FILTRES */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nom du centre</label>
                        <input 
                            type="text" 
                            placeholder="Rechercher..."
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                            className="w-full p-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Adresse</label>
                        <input 
                            type="text" 
                            placeholder="Quartier, ville..."
                            value={filters.address}
                            onChange={(e) => setFilters({...filters, address: e.target.value})}
                            className="w-full p-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Pays</label>
                        <select 
                            value={filters.country_id}
                            onChange={(e) => setFilters({...filters, country_id: e.target.value})}
                            className="w-full p-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white"
                        >
                            <option value="">Tous les pays</option>
                            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            type="submit" 
                            className="flex-1 bg-slate-800 hover:bg-slate-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex justify-center items-center gap-2"
                        >
                            <Search size={16} /> Filtrer
                        </button>
                        <button 
                            type="button"
                            onClick={handleResetFilters}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border dark:border-gray-600 rounded-lg font-medium transition-colors text-sm"
                        >
                            Réinitialiser
                        </button>
                    </div>
                </form>
            </div>

            {/* TABLEAU DES CENTRES */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Centre Médical</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contacts</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Localisation</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center">
                                        <Loader2 size={32} className="animate-spin text-[#00a896] mx-auto mb-2" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des centres...</p>
                                    </td>
                                </tr>
                            ) : centers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Building2 size={48} className="mb-3 opacity-50" />
                                            <p>Aucun centre trouvé.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                centers.map((center) => (
                                    <tr key={center.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        
                                        {/* NOM & ADRESSE */}
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-gray-200">{center.name}</div>
                                            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 dark:text-gray-400">
                                                <MapPin size={12} />
                                                <span className="truncate max-w-[200px]">{center.address || 'Adresse non renseignée'}</span>
                                            </div>
                                        </td>
                                        
                                        {/* CONTACTS */}
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1 text-sm text-slate-600 dark:text-gray-300">
                                                {center.phone_1 ? (
                                                    <div className="flex items-center gap-2">
                                                        <Phone size={14} className="text-gray-400" />
                                                        <span>{center.phone_1}</span>
                                                    </div>
                                                ) : <span className="text-gray-400 italic text-xs">Aucun contact</span>}
                                                
                                                {center.phone_2 && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone size={14} className="text-gray-400" />
                                                        <span>{center.phone_2}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* PAYS */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-gray-300">
                                                <Globe size={16} className="text-[#00a896]" />
                                                {center.country?.name || 'Non spécifié'}
                                            </div>
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button 
                                                    onClick={() => setSelectedCenter(center)} 
                                                    title="Modifier" 
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(center.id)} 
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

                {/* PAGINATION */}
                {!loading && centers.length > 0 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Page <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.currentPage}</span> sur <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.lastPage}</span>
                        </span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => getCenters(pagination.currentPage - 1, filters)} 
                                disabled={pagination.currentPage === 1} 
                                className="p-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                                <ChevronLeft size={18}/>
                            </button>
                            <button 
                                onClick={() => getCenters(pagination.currentPage + 1, filters)} 
                                disabled={pagination.currentPage === pagination.lastPage} 
                                className="p-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                                <ChevronRight size={18}/>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALES */}
            <CreateCenterModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                countries={countries} 
            />

            <UpdateCenterModal 
                isOpen={!!selectedCenter} 
                onClose={() => setSelectedCenter(null)} 
                center={selectedCenter}
                countries={countries} 
            />

        </div>
    );
};

export default Centers;