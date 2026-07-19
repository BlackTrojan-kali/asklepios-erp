import React, { useEffect, useState } from 'react';
import { 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    ShieldAlert, 
    Building2, 
    Mail, 
    Phone, 
    Loader2,
    Briefcase
} from 'lucide-react';
import Swal from 'sweetalert2';

// --- STORES ---
import useCeoStore from '../../../functions/admin/useCeoStore';
// N'oubliez pas d'ajuster l'import ci-dessous selon votre architecture réelle
import useHospitalStore from '../../../functions/hospital/useHospitalStore'; 

// --- TYPES ---
import type { ProfileCeoDto } from '../../../types/CeoTypes';

// --- MODALES ---
import { ManageCeoModal } from '../../../components/modals/admin/ManageCeoModal';

const CeoManagement = () => {
    // --- STORES ---
    const { ceos, loading, getCeos, deleteCeo } = useCeoStore();
    const { hospitals, getHospitals } = useHospitalStore(); // Ajustez selon votre store

    // --- ÉTATS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCeo, setSelectedCeo] = useState<ProfileCeoDto | null>(null);
    const [autoRefreshPage, setAutoRefreshPage] = useState<boolean>(false);

    // --- INITIALISATION ---
    useEffect(() => {
        getCeos();
        // S'assurer que les hôpitaux sont chargés pour le select de la modale
        getHospitals(); 
    }, [getCeos, getHospitals, autoRefreshPage]);

    const handleAutoRefresh = () => {
        setAutoRefreshPage(!autoRefreshPage);
    };

    // --- ACTIONS ---
    const handleOpenCreateModal = () => {
        setSelectedCeo(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (ceo: ProfileCeoDto) => {
        setSelectedCeo(ceo);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer ce profil ?',
            text: "Cette action est irréversible. L'utilisateur perdra instantanément son accès à la plateforme.",
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
            await deleteCeo(id);
        }
    };

    // --- FILTRAGE ---
    const filteredCeos = ceos?.filter(ceo => {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${ceo.user?.first_name || ''} ${ceo.user?.last_name || ''}`.toLowerCase();
        const email = (ceo.user?.email || '').toLowerCase();
        const hospitalName = (ceo.hospital?.name || '').toLowerCase();
        
        return fullName.includes(searchLower) || 
               email.includes(searchLower) || 
               hospitalName.includes(searchLower);
    }) || [];

    // --- HELPERS ---
    const getRoleBadge = (type: string) => {
        switch(type) {
            case 'ceo':
                return <span className="px-2.5 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-md text-xs font-bold border border-purple-200 dark:border-purple-800/50">PDG / CEO</span>;
            case 'dsi':
                return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md text-xs font-bold border border-blue-200 dark:border-blue-800/50">DSI</span>;
            case 'daf':
                return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md text-xs font-bold border border-emerald-200 dark:border-emerald-800/50">DAF</span>;
            default:
                return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-md text-xs font-bold border border-gray-200 dark:border-gray-700">Inconnu</span>;
        }
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg shadow-sm">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Directions d'Hôpitaux</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez les accès des Directeurs (CEO), DSI et DAF.</p>
                    </div>
                </div>
                
                <button 
                    onClick={handleOpenCreateModal}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-md w-full sm:w-auto"
                >
                    <Plus size={18} strokeWidth={3} />
                    Nouveau Profil
                </button>
            </div>

            {/* BARRE DE RECHERCHE */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Rechercher par nom, email ou hôpital..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 text-sm text-slate-800 dark:text-white transition-colors"
                    />
                </div>
            </div>

            {/* TABLEAU */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Utilisateur</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rôle</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hôpital Rattaché</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des profils de direction...</p>
                                    </td>
                                </tr>
                            ) : filteredCeos.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <ShieldAlert size={48} className="mb-4 opacity-50" />
                                            <p className="font-medium text-slate-600 dark:text-gray-300">Aucun profil trouvé</p>
                                            <p className="text-sm mt-1">Modifiez votre recherche ou créez un nouveau profil.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCeos.map((ceo) => (
                                    <tr key={ceo.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors group">
                                        
                                        {/* UTILISATEUR */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-200 dark:border-blue-800/50">
                                                    {ceo.user?.first_name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 dark:text-gray-200 truncate max-w-[200px]">
                                                        {ceo.user?.first_name} {ceo.user?.last_name}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        Ajouté le {new Date(ceo.created_at || '').toLocaleDateString('fr-FR')}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        {/* ROLE */}
                                        <td className="p-4">
                                            {getRoleBadge(ceo.type)}
                                        </td>

                                        {/* HOPITAL RATTACHÉ */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-gray-300 font-medium">
                                                <Building2 size={16} className="text-gray-400 shrink-0" />
                                                <span className="truncate max-w-[200px]">{ceo.hospital?.name || <span className="text-red-500 italic">Non assigné</span>}</span>
                                            </div>
                                        </td>

                                        {/* CONTACT */}
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Mail size={12} className="text-gray-400" />
                                                    <span className="truncate max-w-[150px]">{ceo.user?.email}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Phone size={12} className="text-gray-400" />
                                                    <span>{ceo.user?.phone || 'Non renseigné'}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleOpenEditModal(ceo)} 
                                                    title="Modifier" 
                                                    className="p-2 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30 rounded-lg transition-colors border border-transparent hover:border-amber-200 dark:hover:border-amber-800"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(ceo.id)} 
                                                    title="Supprimer" 
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                            {/* Fallback for touch devices where group-hover is less reliable */}
                                            <div className="md:hidden flex justify-end items-center gap-2 mt-2">
                                                <button onClick={() => handleOpenEditModal(ceo)} className="p-2 text-amber-600"><Edit size={18} /></button>
                                                <button onClick={() => handleDelete(ceo.id)} className="p-2 text-red-500"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODALE DE CRÉATION/ÉDITION */}
            <ManageCeoModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                ceoToEdit={selectedCeo}
                hospitals={hospitals} // On passe la liste des hôpitaux
                AutoRefreshPage={handleAutoRefresh}
            />

        </div>
    );
};

export default CeoManagement;