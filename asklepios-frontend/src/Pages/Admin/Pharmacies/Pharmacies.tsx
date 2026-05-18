import React, { useEffect, useState } from 'react';
import { 
    Store, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    MapPin, 
    Package, 
    ShoppingCart, 
    Loader2 
} from 'lucide-react';
import Swal from 'sweetalert2';

// Stores
import usePharmacyStore from '../../../functions/pharmacy/usePharmacyStore'; 

// Modèles et Types
import type { PharmacyBranchDto } from '../../../types/PharmTypes';

// Modales
import { CreatePharmacyBranchModal } from '../../../components/modals/Pharmacy/CreatePharmacyBranchModal';
import { UpdatePharmacyBranchModal } from '../../../components/modals/Pharmacy/UpdatePharmacyBranchModal';

const Pharmacies = () => {
    // Hook du store
    const { 
        pharmacyBranches, loading, 
        getPharmacyBranches, deletePharmacyBranch 
    } = usePharmacyStore();

    // États pour les filtres
    const [filters, setFilters] = useState({
        search: '',
        type: ''
    });

    // États pour les modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<PharmacyBranchDto | null>(null);

    // Chargement initial des données
    useEffect(() => {
        getPharmacyBranches({});
    }, [getPharmacyBranches]);

    // Soumission du formulaire de filtre
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        getPharmacyBranches(filters);
    };

    // Réinitialisation des filtres
    const handleResetFilters = () => {
        setFilters({ search: '', type: '' });
        getPharmacyBranches({});
    };

    // Action : Supprimer une succursale
    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer cette succursale ?',
            text: "Cette action est irréversible. Les stocks liés pourraient être impactés.",
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
            await deletePharmacyBranch(id);
        }
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg">
                        <Store size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Pharmacies & Stocks</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez vos magasins centraux et points de vente au détail.</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 bg-[#00a896] hover:bg-[#008f7e] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Nouvelle Succursale
                </button>
            </div>

            {/* BARRE DE FILTRES */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Recherche rapide</label>
                        <input 
                            type="text" 
                            placeholder="Nom ou adresse..."
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                            className="w-full p-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type de structure</label>
                        <select 
                            value={filters.type}
                            onChange={(e) => setFilters({...filters, type: e.target.value})}
                            className="w-full p-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white transition-colors"
                        >
                            <option value="">Tous les types</option>
                            <option value="central_warehouse">Magasin Central</option>
                            <option value="retail_pos">Point de Vente</option>
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

            {/* TABLEAU DES SUCCURSALES */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Succursale</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Adresse</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center">
                                        <Loader2 size={32} className="animate-spin text-[#00a896] mx-auto mb-2" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des données...</p>
                                    </td>
                                </tr>
                            ) : pharmacyBranches.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Store size={48} className="mb-3 opacity-50" />
                                            <p>Aucune succursale trouvée.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                pharmacyBranches.map((branch) => (
                                    <tr key={branch.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        
                                        {/* NOM */}
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-gray-200">{branch.name}</div>
                                        </td>
                                        
                                        {/* ADRESSE */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                                <MapPin size={16} className="text-gray-400" />
                                                <span>{branch.adress}</span>
                                            </div>
                                        </td>

                                        {/* TYPE (Avec Badges Stylisés) */}
                                        <td className="p-4">
                                            {branch.type === 'central_warehouse' ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50 text-xs font-medium">
                                                    <Package size={14} />
                                                    Magasin Central
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50 text-xs font-medium">
                                                    <ShoppingCart size={14} />
                                                    Point de Vente
                                                </div>
                                            )}
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button 
                                                    onClick={() => setSelectedBranch(branch)} 
                                                    title="Modifier" 
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(branch.id)} 
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
            </div>

            {/* MODALES */}
            <CreatePharmacyBranchModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
            />

            <UpdatePharmacyBranchModal 
                isOpen={!!selectedBranch} 
                onClose={() => setSelectedBranch(null)} 
                branch={selectedBranch}
            />

        </div>
    );
};

export default Pharmacies;