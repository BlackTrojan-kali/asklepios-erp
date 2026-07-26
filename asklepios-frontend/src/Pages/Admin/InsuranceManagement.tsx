import React, { useEffect, useState } from 'react';
import { 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    ShieldAlert, 
    Mail, 
    Phone, 
    Loader2,
    Shield
} from 'lucide-react';
import Swal from 'sweetalert2';

// --- STORES & CONTEXTS ---
import useInsuranceStore from '../../functions/insurance/useInsuranceStore';
import { useAuth } from '../../contexts/AuthContext'; // Ajustez selon votre architecture

// --- TYPES ---
import type { InsuranceCompanyDto } from '../../types/InsuranceTypes';

// --- MODALES ---
import { ManageInsuranceModal } from '../../components/modals/insurance/ManageInsuranceModal';

const InsuranceManagement = () => {
    // --- AUTH ---
    const { profile } = useAuth();
    // On suppose que l'admin est rattaché à un hôpital via son profil
    const currentHospitalId = profile?.hospital_id || profile?.profile_admin?.hospital_id || 0;

    // --- STORES ---
    const { insurances, loading, getInsurances, deleteInsurance } = useInsuranceStore();

    // --- ÉTATS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInsurance, setSelectedInsurance] = useState<InsuranceCompanyDto | null>(null);
    const [autoRefreshPage, setAutoRefreshPage] = useState<boolean>(false);

    // --- INITIALISATION ---
    useEffect(() => {
        // On récupère les assurances de l'hôpital de l'admin connecté
        if (currentHospitalId) {
            getInsurances({ hospital_id: currentHospitalId });
        }
    }, [getInsurances, currentHospitalId, autoRefreshPage]);

    const handleAutoRefresh = () => {
        setAutoRefreshPage(!autoRefreshPage);
    };

    // --- ACTIONS ---
    const handleOpenCreateModal = () => {
        setSelectedInsurance(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (insurance: InsuranceCompanyDto) => {
        setSelectedInsurance(insurance);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer cette assurance ?',
            text: "Cette action est irréversible. Les patients rattachés à cette assurance pourraient être impactés.",
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
            await deleteInsurance(id);
        }
    };

    // --- FILTRAGE ---
    const filteredInsurances = insurances?.filter(insurance => {
        const searchLower = searchTerm.toLowerCase();
        const name = (insurance.name || '').toLowerCase();
        const email = (insurance.email || '').toLowerCase();
        const contact = (insurance.contact || '').toLowerCase();
        
        return name.includes(searchLower) || 
               email.includes(searchLower) || 
               contact.includes(searchLower);
    }) || [];

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg shadow-sm">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Compagnies d'Assurance</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez les partenaires d'assurance de votre établissement.</p>
                    </div>
                </div>
                
                <button 
                    onClick={handleOpenCreateModal}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-md w-full sm:w-auto"
                >
                    <Plus size={18} strokeWidth={3} />
                    Nouvelle Assurance
                </button>
            </div>

            {/* BARRE DE RECHERCHE */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Rechercher par nom, email ou contact..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 text-sm text-slate-800 dark:text-white transition-colors"
                    />
                </div>
            </div>

            {/* TABLEAU */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Compagnie</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact Principal</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date d'ajout</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des assurances...</p>
                                    </td>
                                </tr>
                            ) : filteredInsurances.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <ShieldAlert size={48} className="mb-4 opacity-50" />
                                            <p className="font-medium text-slate-600 dark:text-gray-300">Aucune assurance trouvée</p>
                                            <p className="text-sm mt-1">Modifiez votre recherche ou ajoutez un nouveau partenaire.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInsurances.map((insurance) => (
                                    <tr key={insurance.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors group">
                                        
                                        {/* COMPAGNIE */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-100 dark:border-blue-800/50 shrink-0">
                                                    {insurance.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-slate-800 dark:text-gray-200 truncate max-w-[250px]">
                                                    {insurance.name}
                                                </span>
                                            </div>
                                        </td>
                                        
                                        {/* CONTACT */}
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1.5 text-sm text-slate-600 dark:text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <Phone size={14} className="text-gray-400 shrink-0" />
                                                    <span>{insurance.contact || <span className="italic text-gray-400">Non renseigné</span>}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Mail size={14} className="text-gray-400 shrink-0" />
                                                    <span className="truncate max-w-[200px]">{insurance.email || <span className="italic text-gray-400">Non renseigné</span>}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* DATE */}
                                        <td className="p-4 text-sm text-slate-600 dark:text-gray-400">
                                            {insurance.created_at ? new Date(insurance.created_at).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            }) : '---'}
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleOpenEditModal(insurance)} 
                                                    title="Modifier" 
                                                    className="p-2 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30 rounded-lg transition-colors border border-transparent hover:border-amber-200 dark:hover:border-amber-800"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(insurance.id)} 
                                                    title="Supprimer" 
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                            {/* Fallback pour les écrans tactiles */}
                                            <div className="md:hidden flex justify-end items-center gap-2 mt-2">
                                                <button onClick={() => handleOpenEditModal(insurance)} className="p-2 text-amber-600"><Edit size={18} /></button>
                                                <button onClick={() => handleDelete(insurance.id)} className="p-2 text-red-500"><Trash2 size={18} /></button>
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
            <ManageInsuranceModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                insuranceToEdit={selectedInsurance}
                currentHospitalId={currentHospitalId} // On passe l'ID de l'hôpital de l'admin
                AutoRefreshPage={handleAutoRefresh}
            />

        </div>
    );
};

export default InsuranceManagement;