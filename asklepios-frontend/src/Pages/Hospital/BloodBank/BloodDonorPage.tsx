import React, { useEffect, useState } from 'react';
import { 
    Droplet, Plus, Search, Filter, Edit, Trash2, 
    UploadCloud, Download, Activity, CheckCircle, XCircle, Clock, RefreshCw
} from 'lucide-react';

// --- STORES & COMPOSANTS ---
import useBloodDonorStore from '../../../functions/bloodBank/useBloodDonorStore';
import useCenterStore from '../../../functions/center/useCenterStore';
import BloodDonorModal from '../../../components/modals/Base_hopital/BloodBank/BloodDonorModal';
import BloodDonorImportModal from '../../../components/modals/Base_hopital/BloodBank/BloodDonorImportModal';
import BloodDonorExportModal from '../../../components/modals/Base_hopital/BloodBank/BloodDonorExportModal';
import type { BloodDonorDto } from '../../../types/BloodManageType';

const BloodDonorPage = () => {
    // --- STORES ---
    const { 
        bloodDonors, 
        pagination, 
        loading, 
        getBloodDonors, 
        deleteBloodDonor 
    } = useBloodDonorStore();
    
    const { centers, getCenters } = useCenterStore();

    // --- ÉTATS DES MODALES ---
    const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [donorToEdit, setDonorToEdit] = useState<BloodDonorDto | null>(null);

    // --- ÉTATS DES FILTRES ---
    const [searchTerm, setSearchTerm] = useState('');
    const [bloodTypeFilter, setBloodTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [centerFilter, setCenterFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // --- INITIALISATION ---
    useEffect(() => {
        getCenters(1, {}, 100);
    }, [getCenters]);

    // --- RECHARGEMENT DES DONNÉES (Avec Debounce) ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            getBloodDonors(currentPage, {
                search: searchTerm,
                blood_type: bloodTypeFilter,
                serology_status: statusFilter,
                center_id: centerFilter
            });
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, bloodTypeFilter, statusFilter, centerFilter, currentPage, getBloodDonors]);

    // --- ACTIONS ---
    const handleRefresh = () => {
        getBloodDonors(currentPage, {
            search: searchTerm,
            blood_type: bloodTypeFilter,
            serology_status: statusFilter,
            center_id: centerFilter
        });
    };

    const handleAdd = () => {
        setDonorToEdit(null);
        setIsDonorModalOpen(true);
    };

    const handleEdit = (donor: BloodDonorDto) => {
        setDonorToEdit(donor);
        setIsDonorModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce donneur ?")) {
            await deleteBloodDonor(id);
        }
    };

    // --- UTILITAIRES ---
    const calculateAge = (birthDate: string) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CLEARED':
                return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded text-[10px] font-bold flex items-center gap-1 w-fit"><CheckCircle size={12}/> Apte (Conforme)</span>;
            case 'PENDING':
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded text-[10px] font-bold flex items-center gap-1 w-fit"><Clock size={12}/> En attente</span>;
            case 'REJECTED':
                return <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded text-[10px] font-bold flex items-center gap-1 w-fit"><XCircle size={12}/> Rejeté</span>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            
            {/* --- EN-TÊTE ET BOUTONS D'ACTION --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                        <Droplet className="text-red-500" />
                        Banque de Sang : Donneurs
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gérez le registre des donneurs, importez des listes de campagnes et suivez les statuts sérologiques.
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm disabled:opacity-50"
                        title="Rafraîchir les données"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin text-red-500" : ""} />
                    </button>
                    <button 
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex-1 xl:flex-none bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all"
                    >
                        <UploadCloud size={18} /> Importer
                    </button>
                    <button 
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex-1 xl:flex-none bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all"
                    >
                        <Download size={18} /> Exporter
                    </button>
                    <button 
                        onClick={handleAdd}
                        className="flex-1 xl:flex-none bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-red-500/30"
                    >
                        <Plus size={18} /> Nouveau Donneur
                    </button>
                </div>
            </div>

            {/* --- BARRE DE FILTRES --- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Rechercher (Nom, prénom, téléphone)..." 
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none text-slate-700 dark:text-white"
                    />
                </div>
                
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    {/* Filtre Groupe Sanguin */}
                    <div className="flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2">
                        <Droplet size={16} className="text-red-400 mr-2" />
                        <select 
                            value={bloodTypeFilter}
                            onChange={(e) => { setBloodTypeFilter(e.target.value); setCurrentPage(1); }}
                            className="bg-transparent text-sm py-2 outline-none text-slate-700 dark:text-white font-medium"
                        >
                            <option value="">Tous Groupes</option>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                    </div>

                    {/* Filtre Statut */}
                    <div className="flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2">
                        <Filter size={16} className="text-gray-400 mr-2" />
                        <select 
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="bg-transparent text-sm py-2 outline-none text-slate-700 dark:text-white"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="CLEARED">Conforme</option>
                            <option value="PENDING">En attente</option>
                            <option value="REJECTED">Rejeté</option>
                        </select>
                    </div>

                    {/* Filtre Centre */}
                    <select 
                        value={centerFilter}
                        onChange={(e) => { setCenterFilter(e.target.value); setCurrentPage(1); }}
                        className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm py-2 px-3 outline-none text-slate-700 dark:text-white"
                    >
                        <option value="">Tous les centres</option>
                        {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            {/* --- TABLEAU DES DONNEURS --- */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Donneur</th>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Âge / Sexe</th>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs text-center">Groupe Sanguin</th>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Contact</th>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Sérologie</th>
                                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">
                                    <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-red-500" />
                                    Chargement des donneurs...
                                </td></tr>
                            ) : bloodDonors.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500 font-medium">Aucun donneur trouvé.</td></tr>
                            ) : (
                                bloodDonors.map((donor) => (
                                    <tr key={donor.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-gray-200">
                                                {donor.first_name} {donor.last_name || ''}
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-0.5">{donor.center?.name}</div>
                                        </td>
                                        <td className="p-4 text-gray-600 dark:text-gray-400">
                                            {calculateAge(donor.birth_date)} ans 
                                            <span className="text-gray-400 mx-1">•</span> 
                                            {donor.gender === 'M' ? 'Homme' : 'Femme'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="font-black text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded">
                                                {donor.blood_type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-600 dark:text-gray-400 font-mono text-xs">
                                            {donor.phone_contact}
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(donor.serology_status)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleEdit(donor)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(donor.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                    title="Supprimer"
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

                {/* --- PAGINATION --- */}
                {pagination && pagination.lastPage > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                            Total : {pagination.total} donneur(s)
                        </span>
                        <div className="flex gap-1">
                            <button 
                                disabled={currentPage === 1 || loading}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                            >
                                Précédent
                            </button>
                            <span className="px-3 py-1 text-sm font-bold text-gray-700 dark:text-gray-300">
                                {currentPage} / {pagination.lastPage}
                            </span>
                            <button 
                                disabled={currentPage === pagination.lastPage || loading}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODALES --- */}
            <BloodDonorModal 
                isOpen={isDonorModalOpen} 
                onClose={() => setIsDonorModalOpen(false)} 
                onSuccess={() => setIsDonorModalOpen(false)}
                donorToEdit={donorToEdit}
                centers={centers}
            />

            <BloodDonorImportModal 
                isOpen={isImportModalOpen} 
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => setIsImportModalOpen(false)}
                centers={centers}
            />

            <BloodDonorExportModal 
                isOpen={isExportModalOpen} 
                onClose={() => setIsExportModalOpen(false)}
                centers={centers}
            />

        </div>
    );
};

export default BloodDonorPage;