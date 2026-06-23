import React, { useEffect, useState } from 'react';
import { 
    Users, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Loader2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Phone,
    Fingerprint
} from 'lucide-react';
import Swal from 'sweetalert2';

// Stores
import usePatientStore from '../../../../functions/base_hospital/usePatientStore'; // Ajuste le chemin

// Types
import type { PatientDto } from '../../../../types/PatientTypes';

// Modales
import { CreatePatientModal } from '../../../../components/modals/Base_hopital/Patient/CreatePatientModal';
import { UpdatePatientModal } from '../../../../components/modals/Base_hopital/Patient/UpdatePatientModal';

const Patients = () => {
    // --- STORES ---
    const { 
        patients, loading, pagination, 
        getPatients, deletePatient 
    } = usePatientStore();

    // --- ÉTATS ---
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    // États pour l'ouverture des modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<PatientDto | null>(null);

    // --- CHARGEMENT INITIAL ---
    useEffect(() => {
        getPatients(page, { search: searchQuery });
    }, [getPatients, page]);

    // Action : Rafraîchir la liste actuelle
    const handleRefresh = () => {
        getPatients(page, { search: searchQuery });
    };

    // Soumission du formulaire de recherche
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1); // Retour à la page 1 lors d'une nouvelle recherche
        getPatients(1, { search: searchQuery });
    };

    // Réinitialisation de la recherche
    const handleResetSearch = () => {
        setSearchQuery('');
        setPage(1);
        getPatients(1, { search: '' });
    };

    // Action : Demander confirmation AVANT d'ouvrir la modification
    const handleEditRequest = async (patient: PatientDto) => {
        const result = await Swal.fire({
            title: 'Vérification d\'identité',
            text: `Vous êtes sur le point de modifier le dossier de ${patient.first_name} ${patient.last_name || ''}. Confirmez-vous avoir vérifié l'identité du patient ?`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5', // Indigo-600
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, je confirme',
            customClass: {
                popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200'
            }
        });
        
        if (result.isConfirmed) {
            setSelectedPatient(patient);
        }
    };

    // Action : Supprimer (Archiver) un patient
    const handleDelete = async (id: number, name: string) => {
        const result = await Swal.fire({
            title: 'Archiver ce dossier ?',
            text: `Le dossier de ${name} sera archivé (Soft Delete) et n'apparaîtra plus dans les recherches courantes.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, archiver',
            customClass: {
                popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200'
            }
        });
        
        if (result.isConfirmed) {
            await deletePatient(id);
        }
    };

    // Formatage local de la date
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                        <Users size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dossiers Patients</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez les admissions, les identités et les codes uniques des patients.</p>
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
                        Nouveau Patient
                    </button>
                </div>
            </div>

            {/* SECTION DE RECHERCHE */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Rechercher par Code (ex: H1-...), Nom, Prénom ou Téléphone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 p-2 min-h-[42px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-sm text-slate-800 dark:text-white transition-colors"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button 
                            type="submit" 
                            className="bg-slate-800 hover:bg-slate-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-6 py-2 min-h-[42px] rounded-lg font-medium transition-colors text-sm shadow-sm"
                        >
                            Rechercher
                        </button>
                        {searchQuery && (
                            <button 
                                type="button"
                                onClick={handleResetSearch}
                                className="px-4 py-2 min-h-[42px] bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border dark:border-gray-600 rounded-lg font-medium transition-colors text-sm"
                            >
                                Effacer
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* LISTE / TABLEAU DES PATIENTS */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code Patient</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Identité</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date de naissance</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-2" />
                                        <p className="text-gray-500 dark:text-gray-400">Recherche dans les archives...</p>
                                    </td>
                                </tr>
                            ) : patients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Users size={48} className="mb-3 opacity-40 text-indigo-500" />
                                            <p className="font-medium">Aucun dossier patient trouvé.</p>
                                            <p className="text-xs text-gray-400 mt-1">Modifiez vos critères de recherche ou ouvrez un nouveau dossier.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                patients.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        
                                        {/* CODE PATIENT */}
                                        <td className="p-4">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50 font-mono text-xs font-bold tracking-wide">
                                                <Fingerprint size={14} />
                                                {item.patient_code}
                                            </div>
                                        </td>

                                        {/* IDENTITÉ */}
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-gray-200 uppercase">
                                                {item.first_name} <span className="font-medium text-slate-600 dark:text-gray-400">{item.last_name}</span>
                                            </div>
                                        </td>

                                        {/* CONTACT */}
                                        <td className="p-4 font-medium text-slate-700 dark:text-gray-300">
                                            <div className="flex items-center gap-1.5">
                                                <Phone size={14} className="text-gray-400 shrink-0" />
                                                {item.contact_phone}
                                            </div>
                                        </td>
                                        
                                        {/* DATE DE NAISSANCE */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-gray-300">
                                                <Calendar size={14} className="text-gray-400 shrink-0" />
                                                <span>{formatDate(item.bith_date)}</span>
                                            </div>
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button 
                                                    onClick={() => handleEditRequest(item)} 
                                                    title="Modifier le dossier" 
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id, `${item.first_name} ${item.last_name || ''}`)} 
                                                    title="Archiver le dossier" 
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
                {!loading && patients.length > 0 && pagination && pagination.lastPage > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Page <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.currentPage}</span> sur <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.lastPage}</span>
                            <span className="ml-2 hidden sm:inline">({pagination.total} dossiers trouvés)</span>
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
            <CreatePatientModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
            />

            <UpdatePatientModal 
                isOpen={!!selectedPatient} 
                onClose={() => setSelectedPatient(null)} 
                patient={selectedPatient}
            />

        </div>
    );
};

export default Patients;