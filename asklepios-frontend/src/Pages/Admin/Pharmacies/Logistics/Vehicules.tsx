import React, { useEffect, useState, useRef } from 'react';
import { 
    CarFront, Plus, RefreshCw, Loader2, Edit, Trash2, 
    Search, FileSpreadsheet, Upload, CheckCircle2, Circle
} from 'lucide-react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

// Store & Types
import useVehiculeStore from '../../../../functions/pharmacy/useVehiculeStore';
import type { VehiculeDto } from '../../../../types/vehiculeTypes';

// Composants
import { VehiculeModal } from '../../../../components/modals/Pharmacy/Logistics/VehiculeModal';

const Vehicules = () => {
    // --- STORES ---
    const { 
        vehicules, pagination, loading, actionLoading,
        getVehicules, deleteVehicule, exportExcel, importExcel 
    } = useVehiculeStore();

    // --- ÉTATS ---
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>(''); // '', 'true', 'false'

    // États pour les modales
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVehicule, setSelectedVehicule] = useState<VehiculeDto | null>(null);

    // Référence pour l'input file caché (Import Excel)
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- CHARGEMENT DES DONNÉES ---
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            getVehicules({ 
                page, 
                search: searchTerm || undefined,
                is_active: statusFilter !== '' ? statusFilter : undefined
            });
        }, 300); // Debounce de 300ms pour ne pas spammer l'API en tapant

        return () => clearTimeout(delayDebounce);
    }, [getVehicules, page, searchTerm, statusFilter]);

    const handleRefresh = () => {
        getVehicules({ page, search: searchTerm, is_active: statusFilter });
    };

    // --- ACTIONS ---
    const handleDelete = async (id: number, licencePlate: string) => {
        const result = await Swal.fire({
            title: 'Retirer ce véhicule ?',
            text: `Voulez-vous vraiment supprimer le véhicule immatriculé "${licencePlate}" du parc ?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, supprimer',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });
        
        if (result.isConfirmed) {
            const success = await deleteVehicule(id);
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

        // Vérification basique de l'extension
        const validExtensions = ['xlsx', 'xls', 'csv'];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        if (!fileExtension || !validExtensions.includes(fileExtension)) {
            toast.error("Format de fichier non supporté. Veuillez utiliser un fichier Excel ou CSV.");
            // Reset l'input
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const success = await importExcel(file);
        if (success) {
            setPage(1); // Retour à la première page
            handleRefresh();
        }

        // Reset l'input pour permettre de re-sélectionner le même fichier si besoin
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-6">
            
            {/* INPUT CACHÉ POUR L'IMPORT EXCEL */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
            />

            {/* EN-TÊTE ET BOUTONS GLOBAUX */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg shadow-sm">
                        <CarFront size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Parc Automobile</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez les véhicules et ambulances de l'hôpital.</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    {/* Boutons d'import/export */}
                    <button 
                        onClick={() => exportExcel({ search: searchTerm, is_active: statusFilter })} 
                        disabled={actionLoading}
                        className="flex items-center gap-2 p-2.5 bg-white hover:bg-emerald-50 dark:bg-gray-800 dark:hover:bg-emerald-900/20 text-emerald-600 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 text-sm font-semibold"
                        title="Exporter la liste en Excel"
                    >
                        <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Exporter</span>
                    </button>
                    <button 
                        onClick={handleImportClick} 
                        disabled={actionLoading}
                        className="flex items-center gap-2 p-2.5 bg-white hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-blue-900/20 text-blue-600 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 text-sm font-semibold"
                        title="Importer depuis un fichier Excel"
                    >
                        <Upload size={16} /> <span className="hidden sm:inline">Importer</span>
                    </button>

                    <button 
                        onClick={handleRefresh} 
                        disabled={loading || actionLoading}
                        className="p-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 ml-2"
                        title="Rafraîchir les données"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>

                    <button 
                        onClick={() => { setSelectedVehicule(null); setIsModalOpen(true); }}
                        className="flex flex-1 lg:flex-none justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Nouveau Véhicule
                    </button>
                </div>
            </div>

            {/* BARRE DE RECHERCHE ET FILTRES */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4">
                {/* Recherche textuelle */}
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Rechercher</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Plaque, Modèle..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                        />
                    </div>
                </div>

                {/* Filtre Statut */}
                <div className="w-full md:w-64">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Statut du véhicule</label>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 dark:text-white"
                    >
                        <option value="">Tous les véhicules</option>
                        <option value="true">En Service (Actif)</option>
                        <option value="false">Hors Service (Inactif)</option>
                    </select>
                </div>
            </div>

            {/* TABLEAU DES VÉHICULES */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Immatriculation</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Modèle / Marque</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Statut</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {loading && vehicules.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-2" />
                                        <p className="text-gray-500 dark:text-gray-400">Chargement du parc automobile...</p>
                                    </td>
                                </tr>
                            ) : vehicules.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-gray-500 dark:text-gray-400">
                                        Aucun véhicule trouvé.
                                    </td>
                                </tr>
                            ) : (
                                vehicules.map((vehicule) => (
                                    <tr key={vehicule.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="inline-flex items-center font-mono font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-600 px-2.5 py-1 rounded">
                                                {vehicule.licence_plate}
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium text-slate-700 dark:text-gray-300">
                                            {vehicule.model}
                                        </td>
                                        <td className="p-4 text-center">
                                            {vehicule.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                    <CheckCircle2 size={14} /> En Service
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                    <Circle size={14} /> Hors Service
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                <button 
                                                    onClick={() => { setSelectedVehicule(vehicule); setIsModalOpen(true); }}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(vehicule.id, vehicule.licence_plate)}
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

                {/* PAGINATION */}
                {pagination && pagination.last_page > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Page {pagination.current_page} sur {pagination.last_page} ({pagination.total} véhicules)
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

            {/* MODALE CRÉATION/MODIFICATION */}
            <VehiculeModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                existingVehicule={selectedVehicule}
                onSuccess={handleRefresh}
            />

        </div>
    );
};

export default Vehicules;