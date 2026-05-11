import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, ShieldCheck, ChevronLeft, ChevronRight, Loader2, KeyRound } from 'lucide-react';
import Swal from 'sweetalert2';
import useAdminStore from '../../../functions/admin/useAdminStore'; // Ajuste le chemin
import AdminModal from '../../../components/modals/admin/AdminModal'; // Ajuste le chemin
import PasswordAdminModal from '../../../components/modals/admin/PasswordAdminModal'; // Ajuste le chemin
import type { AdminDto } from '../../../types/types';

const Admins = () => {
    const { admins, loading, pagination, getAdmins, deleteAdmin } = useAdminStore();
    
    // États locaux pour la recherche
    const [searchInput, setSearchInput] = useState('');
    
    // États pour la modale des infos (Création / Modification)
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<AdminDto | null>(null);

    // États pour la modale du mot de passe
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [adminForPassword, setAdminForPassword] = useState<AdminDto | null>(null);

    // Chargement initial
    useEffect(() => {
        getAdmins(1, '');
    }, [getAdmins]);

    // Gérer la recherche
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        getAdmins(1, searchInput);
    };

    // --- HANDLERS POUR LES MODALES ---

    const handleOpenCreate = () => {
        setSelectedAdmin(null);
        setIsAdminModalOpen(true);
    };

    const handleOpenEdit = (admin: AdminDto) => {
        setSelectedAdmin(admin);
        setIsAdminModalOpen(true);
    };

    const handleOpenPassword = (admin: AdminDto) => {
        setAdminForPassword(admin);
        setIsPasswordModalOpen(true);
    };

    // --- SUPPRESSION ---
    const handleDelete = async (id: number, firstName: string, lastName: string | null) => {
        const fullName = `${firstName} ${lastName || ''}`.trim();
        
        const result = await Swal.fire({
            title: 'Êtes-vous sûr ?',
            html: `Voulez-vous vraiment révoquer l'accès de l'administrateur <b>"${fullName}"</b> ?<br/><br/><span class="text-sm text-gray-500">Cette action supprimera définitivement son compte.</span>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444', 
            cancelButtonColor: '#64748b',  
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
            await deleteAdmin(id);
        }
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#003366] dark:text-white">Administrateurs</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez les accès administratifs par hôpital.</p>
                    </div>
                </div>
                
                <button 
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 bg-[#00a896] hover:bg-[#008f7e] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Nouvel administrateur
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
                            placeholder="Rechercher par nom, prénom ou email..." 
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
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Identité & Contact</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Téléphone</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hôpital Assigné</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Loader2 size={32} className="animate-spin text-[#00a896] mb-2" />
                                            <span>Chargement des administrateurs...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : admins.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        Aucun administrateur trouvé.
                                    </td>
                                </tr>
                            ) : (
                                admins.map((admin) => (
                                    <tr key={admin.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors group">
                                        
                                        {/* Colonne IDENTITÉ */}
                                        <td className="p-4">
                                            <div className="font-medium text-slate-800 dark:text-gray-200">
                                                {admin.first_name} {admin.last_name}
                                            </div>
                                            <div className="text-sm text-slate-500 dark:text-gray-400">
                                                {admin.email}
                                            </div>
                                        </td>
                                        
                                        {/* Colonne TÉLÉPHONE */}
                                        <td className="p-4 text-slate-600 dark:text-gray-400 font-mono text-sm">
                                            {admin.phone}
                                        </td>

                                        {/* Colonne HÔPITAL */}
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                                {admin.profile_admin?.hospital?.name || 'Non assigné'}
                                            </span>
                                        </td>

                                        {/* Colonne ACTIONS */}
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button 
                                                    onClick={() => handleOpenPassword(admin)}
                                                    className="p-2 text-orange-500 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                                                    title="Changer le mot de passe"
                                                >
                                                    <KeyRound size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleOpenEdit(admin)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="Modifier les informations"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(admin.id, admin.first_name, admin.last_name)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="Supprimer l'accès"
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
                {!loading && admins.length > 0 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Page <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.currentPage}</span> sur <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.lastPage}</span>
                            <span className="ml-2 hidden sm:inline">({pagination.total} administrateurs)</span>
                        </span>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => getAdmins(pagination.currentPage - 1, searchInput)}
                                disabled={pagination.currentPage === 1}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button 
                                onClick={() => getAdmins(pagination.currentPage + 1, searchInput)}
                                disabled={pagination.currentPage === pagination.lastPage}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALE DE CRÉATION / MODIFICATION INFOS */}
            <AdminModal 
                isOpen={isAdminModalOpen} 
                onClose={() => setIsAdminModalOpen(false)} 
                adminToEdit={selectedAdmin} 
            />

            {/* MODALE DE MOT DE PASSE */}
            <PasswordAdminModal 
                isOpen={isPasswordModalOpen} 
                onClose={() => setIsPasswordModalOpen(false)} 
                adminId={adminForPassword?.id || null} 
                adminName={`${adminForPassword?.first_name || ''} ${adminForPassword?.last_name || ''}`.trim()}
            />

        </div>
    );
};

export default Admins;