import React, { useEffect, useState, useRef } from 'react';
import { 
    Contact, Plus, RefreshCw, Loader2, Edit, Trash2, 
    Search, FileSpreadsheet, Upload, CheckCircle2, Circle, Phone
} from 'lucide-react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

// Store & Types
import useDriverStore from '../../../../functions/pharmacy/useDriverStore';
import type { DriverDto } from '../../../../types/driverTypes';

// Composants
import { DriverModal } from '../../../../components/modals/Pharmacy/Logistics/DriverModal';

const Drivers = () => {
    // --- STORES ---
    const { 
        drivers, pagination, loading, actionLoading,
        getDrivers, deleteDriver, exportExcel, importExcel 
    } = useDriverStore();

    // --- ÉTATS ---
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>(''); // '', 'true', 'false'

    // États pour les modales
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<DriverDto | null>(null);

    // Référence pour l'input file caché (Import Excel)
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- CHARGEMENT DES DONNÉES ---
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            getDrivers({ 
                page, 
                search: searchTerm || undefined,
                is_active: statusFilter !== '' ? statusFilter : undefined
            });
        }, 300); // Évite de surcharger l'API lors de la saisie au clavier

        return () => clearTimeout(delayDebounce);
    }, [getDrivers, page, searchTerm, statusFilter]);

    const handleRefresh = () => {
        getDrivers({ page, search: searchTerm, is_active: statusFilter });
    };

    // --- ACTIONS ---
    const handleDelete = async (id: number, fullname: string) => {
        const result = await Swal.fire({
            title: 'Retirer ce chauffeur ?',
            text: `Voulez-vous vraiment supprimer "${fullname}" de la liste des chauffeurs ?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, supprimer',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });
        
        if (result.isConfirmed) {
            const success = await deleteDriver(id);
            if (success) handleRefresh();
        }
    };

    // --- GESTION DE L'IMPORT EXCEL ---
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validExtensions = ['xlsx', 'xls', 'csv'];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        if (!fileExtension || !validExtensions.includes(fileExtension)) {
            toast.error("Format non supporté. Utilisez un tableur Excel (.xlsx, .xls) ou un fichier CSV.");
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const success = await importExcel(file);
        if (success) {
            setPage(1);
            handleRefresh();
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-6">
            
            {/* INPUT DE TÉLÉCHARGEMENT CACHÉ */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
            />

            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg shadow-sm">
                        <Contact size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion des Chauffeurs</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Suivez la disponibilité du personnel assigné aux véhicules et ambulances.</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    {/* Actions sur les fichiers */}
                    <button 
                        onClick={() => exportExcel({ search: searchTerm, is_active: statusFilter })} 
                        disabled={actionLoading}
                        className="flex items-center gap-2 p-2.5 bg-white hover:bg-emerald-50 dark:bg-gray-800 dark:hover:bg-emerald-900/20 text-emerald-600 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 text-sm font-semibold"
                        title="Exporter en document Excel"
                    >
                        <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Exporter</span>
                    </button>
                    <button 
                        onClick={handleImportClick} 
                        disabled={actionLoading}
                        className="flex items-center gap-2 p-2.5 bg-white hover:bg-indigo-50 dark:bg-gray-800 dark:hover:bg-indigo-900/20 text-indigo-600 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 text-sm font-semibold"
                        title="Importer par lot via tableur"
                    >
                        <Upload size={16} /> <span className="hidden sm:inline">Importer</span>
                    </button>

                    <button 
                        onClick={handleRefresh} 
                        disabled={loading || actionLoading}
                        className="p-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 ml-2"
                        title="Rafraîchir"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>

                    <button 
                        onClick={() => { setSelectedDriver(null); setIsModalOpen(true); }}
                        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm text-sm"
                    >
                        <Plus size={18} />
                        Nouveau Chauffeur
                    </button>
                </div>
            </div>

            {/* BARRE DE FILTRES ET FILTRAGE INTERACTIF */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Recherche rapide</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Rechercher par nom complet ou téléphone..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-indigo-500 dark:text-white transition-colors"
                        />
                    </div>
                </div>

                <div className="w-full md:w-64">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Statut d'activité</label>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:text-white"
                    >
                        <option value="">Tous les conducteurs</option>
                        <option value="true">Actifs (Disponibles)</option>
                        <option value="false">Inactifs</option>
                    </select>
                </div>
            </div>

            {/* TABLEAU PRINCIPAL DE RENDU */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Identité du Chauffeur</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact Téléphonique</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Disponibilité</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {loading && drivers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-2" />
                                        <p className="text-gray-500 dark:text-gray-400">Parcours des registres du personnel...</p>
                                    </td>
                                </tr>
                            ) : drivers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-gray-500 dark:text-gray-400">
                                        Aucun conducteur répertorié.
                                    </td>
                                </tr>
                            ) : (
                                drivers.map((driver) => (
                                    <tr key={driver.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4 font-semibold text-slate-800 dark:text-white">
                                            {driver.fullname}
                                        </td>
                                        <td className="p-4">
                                            {driver.phone ? (
                                                <div className="inline-flex items-center gap-2 font-mono text-slate-600 dark:text-gray-300 bg-slate-100 dark:bg-gray-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-gray-800">
                                                    <Phone size={12} className="text-gray-400" />
                                                    {driver.phone}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic text-xs">Aucun numéro</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {driver.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                    <CheckCircle2 size={14} /> Actif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                    <Circle size={14} /> Inactif
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                <button 
                                                    onClick={() => { setSelectedDriver(driver); setIsModalOpen(true); }}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(driver.id, driver.fullname)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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

                {/* SYSTEME DE CONFIGURATION PAGINEE */}
                {pagination && pagination.last_page > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Page {pagination.current_page} sur {pagination.last_page} ({pagination.total} conducteurs)
                        </span>
                        <div className="flex gap-2">
                            <button 
                                disabled={page === 1} 
                                onClick={() => setPage(page - 1)}
                                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 disabled:opacity-50 text-slate-700 dark:text-gray-300"
                            >
                                Précédent
                            </button>
                            <button 
                                disabled={page === pagination.last_page} 
                                onClick={() => setPage(page + 1)}
                                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 disabled:opacity-50 text-slate-700 dark:text-gray-300"
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALE INJECTEE DE SAISIE */}
            <DriverModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                existingDriver={selectedDriver}
                onSuccess={handleRefresh}
            />

        </div>
    );
};

export default Drivers;