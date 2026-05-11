import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Building2, ChevronLeft, ChevronRight, Loader2, Image as ImageIcon } from 'lucide-react';
import Swal from 'sweetalert2'; // <-- Import de SweetAlert2
import useHospitalStore from '../../../functions/hospital/useHospitalStore'; 
import HospitalModal from '../../../components/modals/hospital/HospitalModal'; 
import type { HospitalDto } from '../../../types/types'; 

const Hospitals = () => {
    const { hospitals, loading, pagination, getHospitals, deleteHospital } = useHospitalStore();
    
    // États locaux
    const [searchInput, setSearchInput] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedHospital, setSelectedHospital] = useState<HospitalDto | null>(null);

    // Chargement initial
    useEffect(() => {
        getHospitals(1, '');
    }, [getHospitals]);

    // Gérer la recherche
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        getHospitals(1, searchInput);
    };

    // Ouvrir la modale pour Créer
    const handleOpenCreate = () => {
        setSelectedHospital(null);
        setIsModalOpen(true);
    };

    // Ouvrir la modale pour Modifier
    const handleOpenEdit = (hospital: HospitalDto) => {
        setSelectedHospital(hospital);
        setIsModalOpen(true);
    };

    // Gérer la suppression avec confirmation SweetAlert2
    const handleDelete = async (id: number | undefined, name: string) => {
        if (!id) return;
        
        const result = await Swal.fire({
            title: 'Êtes-vous sûr ?',
            html: `Voulez-vous vraiment supprimer l'hôpital <b>"${name}"</b> ?<br/><br/><span class="text-sm text-gray-500">Cette action est irréversible et supprimera également son logo du serveur.</span>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444', // Rouge (Tailwind red-500)
            cancelButtonColor: '#64748b',  // Gris bleuté (Tailwind slate-500)
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler',
            reverseButtons: true, // Met le bouton "Annuler" à gauche
            customClass: {
                popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200', // Ajout de classes pour le dark mode si besoin
                confirmButton: 'rounded-lg px-4 py-2 font-medium shadow-sm',
                cancelButton: 'rounded-lg px-4 py-2 font-medium shadow-sm'
            }
        });
        
        if (result.isConfirmed) {
            await deleteHospital(id);
        }
    };

    // Fonction utilitaire pour générer l'URL complète de l'image
    // ⚠️ À ADAPTER : En production, utilise une variable d'environnement comme import.meta.env.VITE_API_BASE_URL
    const getImageUrl = (path: string | null | undefined) => {
        if (!path) return null;
        return `http://localhost:8000/storage/${path}`;
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#003366]/10 text-[#003366] dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#003366] dark:text-white">Hôpitaux Partenaires</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez la liste des établissements de santé (SUPA).</p>
                    </div>
                </div>
                
                <button 
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 bg-[#00a896] hover:bg-[#008f7e] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Ajouter un hôpital
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
                            placeholder="Rechercher par nom ou par NIU..." 
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
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20 text-center">Logo</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nom de l'établissement</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">NIU</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Loader2 size={32} className="animate-spin text-[#00a896] mb-2" />
                                            <span>Chargement des données...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : hospitals.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        Aucun hôpital trouvé.
                                    </td>
                                </tr>
                            ) : (
                                hospitals.map((hospital) => (
                                    <tr key={hospital.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors group">
                                        
                                        {/* Colonne LOGO */}
                                        <td className="p-3 text-center flex justify-center">
                                            {hospital.logo_url ? (
                                                <img 
                                                    src={getImageUrl(hospital.logo_url) as string} 
                                                    alt={`Logo ${hospital.name}`} 
                                                    className="w-10 h-10 object-contain rounded bg-white border border-gray-200 dark:border-gray-600 p-0.5"
                                                    onError={(e) => {
                                                        // Fallback si l'image casse
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                            ) : null}
                                            
                                            {/* Placeholder si pas de logo */}
                                            <div className={`w-10 h-10 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-200 dark:border-gray-700 ${hospital.logo_url ? 'hidden' : ''}`}>
                                                <ImageIcon size={20} />
                                            </div>
                                        </td>

                                        {/* Colonne NOM */}
                                        <td className="p-4 font-medium text-slate-800 dark:text-gray-200">
                                            {hospital.name}
                                        </td>
                                        
                                        {/* Colonne NIU */}
                                        <td className="p-4 text-slate-600 dark:text-gray-400 font-mono text-sm">
                                            {hospital.niu ? (
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{hospital.niu}</span>
                                            ) : (
                                                <span className="text-gray-400 italic">Non renseigné</span>
                                            )}
                                        </td>

                                        {/* Colonne ACTIONS */}
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleOpenEdit(hospital)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(hospital.id, hospital.name)}
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
                {!loading && hospitals.length > 0 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Page <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.currentPage}</span> sur <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.lastPage}</span>
                            <span className="ml-2 hidden sm:inline">({pagination.total} hôpitaux)</span>
                        </span>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => getHospitals(pagination.currentPage - 1, searchInput)}
                                disabled={pagination.currentPage === 1}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button 
                                onClick={() => getHospitals(pagination.currentPage + 1, searchInput)}
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
            <HospitalModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                hospitalToEdit={selectedHospital} 
            />

        </div>
    );
};

export default Hospitals;