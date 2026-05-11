import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, FileBadge, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import useLicenceStore from '../../../functions/licence/useLicenceStore'; // Ajuste le chemin
import LicenceModal from '../../../components/modals/licence/LicenceModal';
import type { LicenceDto } from '../../../types/types'; 

const Licences = () => {
    const { licences, loading, pagination, getLicences, deleteLicence } = useLicenceStore();
    
    // États locaux
    const [searchInput, setSearchInput] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLicence, setSelectedLicence] = useState<LicenceDto | null>(null);

    // Chargement initial
    useEffect(() => {
        getLicences(1, '');
    }, [getLicences]);

    // Gérer la recherche
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        getLicences(1, searchInput);
    };

    // Ouvrir la modale pour Créer
    const handleOpenCreate = () => {
        setSelectedLicence(null);
        setIsModalOpen(true);
    };

    // Ouvrir la modale pour Modifier
    const handleOpenEdit = (licence: LicenceDto) => {
        setSelectedLicence(licence);
        setIsModalOpen(true);
    };

    // Gérer la suppression avec confirmation SweetAlert2
    const handleDelete = async (id: number, name: string) => {
        const result = await Swal.fire({
            title: 'Êtes-vous sûr ?',
            html: `Voulez-vous vraiment supprimer la licence <b>"${name}"</b> ?<br/><br/><span class="text-sm text-gray-500">Cette action est irréversible et pourrait impacter les hôpitaux qui utilisent cette licence.</span>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444', // Rouge
            cancelButtonColor: '#64748b',  // Gris
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler',
            reverseButtons: true, 
            customClass: {
                popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200',
                confirmButton: 'rounded-lg px-4 py-2 font-medium shadow-sm',
                cancelButton: 'rounded-lg px-4 py-2 font-medium shadow-sm'
            }
        });
        
        if (result.isConfirmed) {
            await deleteLicence(id);
        }
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#00a896]/10 text-[#00a896] dark:bg-teal-900/30 dark:text-teal-400 rounded-lg">
                        <FileBadge size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#003366] dark:text-white">Licences Systèmes</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez les modules et abonnements disponibles dans l'ERP.</p>
                    </div>
                </div>
                
                <button 
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 bg-[#00a896] hover:bg-[#008f7e] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Nouvelle licence
                </button>
            </div>

            {/* BARRE DE RECHERCHE */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Search size={18} />
                        </div>
                        <input 
                            type="text" 
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Rechercher par nom de licence..." 
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="bg-[#003366] hover:bg-[#002244] dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Rechercher
                    </button>
                </form>
            </div>

            {/* TABLEAU DES DONNÉES */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/3">Nom de la Licence</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Loader2 size={32} className="animate-spin text-[#00a896] mb-2" />
                                            <span>Chargement des licences...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : licences.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        Aucune licence trouvée.
                                    </td>
                                </tr>
                            ) : (
                                licences.map((licence) => (
                                    <tr key={licence.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors group">
                                        
                                        {/* Colonne NOM */}
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-bold bg-slate-100 text-slate-800 dark:bg-gray-700 dark:text-gray-200">
                                                {licence.name}
                                            </span>
                                        </td>
                                        
                                        {/* Colonne DESCRIPTION */}
                                        <td className="p-4 text-slate-600 dark:text-gray-400 text-sm">
                                            {licence.description ? (
                                                <span className="line-clamp-2">{licence.description}</span>
                                            ) : (
                                                <span className="text-gray-400 italic">Aucune description</span>
                                            )}
                                        </td>

                                        {/* Colonne ACTIONS */}
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleOpenEdit(licence)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(licence.id, licence.name)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="Supprimer"
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
                {!loading && licences.length > 0 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Page <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.currentPage}</span> sur <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.lastPage}</span>
                            <span className="ml-2 hidden sm:inline">({pagination.total} licences)</span>
                        </span>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => getLicences(pagination.currentPage - 1, searchInput)}
                                disabled={pagination.currentPage === 1}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button 
                                onClick={() => getLicences(pagination.currentPage + 1, searchInput)}
                                disabled={pagination.currentPage === pagination.lastPage}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALE DE CRÉATION / MODIFICATION */}
            <LicenceModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                licenceToEdit={selectedLicence} 
            />

        </div>
    );
};

export default Licences;