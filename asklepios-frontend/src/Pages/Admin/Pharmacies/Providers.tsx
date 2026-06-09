import React, { useEffect, useState, useRef } from 'react';
import { 
    Truck, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Phone, 
    MapPin, 
    Loader2,
    RefreshCw,
    Download,
    Upload,
    FileText,
    FileSpreadsheet,
    Building2,
    Hash
} from 'lucide-react';
import Swal from 'sweetalert2';

// Store
import useProviderStore from '../../../functions/pharmacy/useProviderStore';

// Types
import type { ProviderDto } from '../../../types/ProviderTypes';

// Modales
import { CreateProviderModal } from '../../../components/modals/Pharmacy/provider/CreateProviderModal';
import { UpdateProviderModal } from '../../../components/modals/Pharmacy/provider/UpdateProviderModal';

const Providers = () => {
    // Hook du store
    const { 
        providers, loading, actionLoading,
        getProviders, deleteProvider,
        exportPdf, exportExcel, importExcel
    } = useProviderStore();

    // Référence pour l'input file caché
    const fileInputRef = useRef<HTMLInputElement>(null);

    // États
    const [filters, setFilters] = useState({ search: '' });
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<ProviderDto | null>(null);

    // Chargement initial
    useEffect(() => {
        getProviders({});
    }, [getProviders]);

    // Rafraîchissement manuel
    const handleRefresh = () => {
        getProviders(filters);
    };

    // Soumission du filtre
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        getProviders(filters);
    };

    // Suppression
    const handleDelete = async (id: number, name: string) => {
        const result = await Swal.fire({
            title: 'Supprimer ce fournisseur ?',
            text: `Voulez-vous vraiment supprimer "${name}" ? Cette action est irréversible.`,
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
            await deleteProvider(id);
        }
    };

    // Déclencher l'input file caché
    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Gérer la sélection du fichier Excel
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const success = await importExcel(file);
            if (success) {
                // Réinitialiser l'input pour pouvoir réimporter le même fichier si besoin
                e.target.value = '';
            }
        }
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE ET ACTIONS GLOBALES */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                        <Truck size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Fournisseurs</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez votre répertoire de grossistes et partenaires.</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    {/* Boutons d'export / import */}
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <button 
                            onClick={exportPdf}
                            disabled={actionLoading}
                            title="Exporter en PDF"
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors disabled:opacity-50"
                        >
                            <FileText size={18} />
                        </button>
                        <button 
                            onClick={exportExcel}
                            disabled={actionLoading}
                            title="Exporter en Excel"
                            className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-md transition-colors disabled:opacity-50"
                        >
                            <FileSpreadsheet size={18} />
                        </button>
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                        <button 
                            onClick={handleImportClick}
                            disabled={actionLoading}
                            title="Importer depuis Excel"
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                        >
                            <Upload size={18} />
                            <span className="hidden sm:inline">Importer</span>
                        </button>
                        {/* Input file caché */}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".xlsx, .xls, .csv" 
                            onChange={handleFileChange} 
                        />
                    </div>

                    {/* Rafraîchir */}
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="p-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-70"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>

                    {/* Nouveau */}
                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="flex flex-1 lg:flex-none justify-center items-center gap-2 bg-[#00a896] hover:bg-[#008f7e] text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Nouveau Fournisseur
                    </button>
                </div>
            </div>

            {/* BARRE DE RECHERCHE */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleFilterSubmit} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Rechercher par nom, téléphone ou NIU..."
                            value={filters.search}
                            onChange={(e) => setFilters({ search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white transition-colors"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button 
                            type="submit" 
                            className="bg-slate-800 hover:bg-slate-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                            Filtrer
                        </button>
                        <button 
                            type="button"
                            onClick={() => { setFilters({ search: '' }); getProviders({}); }}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border dark:border-gray-600 rounded-lg font-medium transition-colors text-sm"
                        >
                            X
                        </button>
                    </div>
                </form>
            </div>

            {/* TABLEAU */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Raison Sociale</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Coordonnées</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Identifiant Fiscal (NIU)</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center">
                                        <Loader2 size={32} className="animate-spin text-[#00a896] mx-auto mb-2" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des fournisseurs...</p>
                                    </td>
                                </tr>
                            ) : providers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Building2 size={48} className="mb-3 opacity-50" />
                                            <p>Aucun fournisseur trouvé.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                providers.map((provider) => (
                                    <tr key={provider.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        
                                        {/* RAISON SOCIALE */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-gray-700 flex items-center justify-center text-blue-500 dark:text-blue-400 shrink-0">
                                                    <Building2 size={20} />
                                                </div>
                                                <div className="font-bold text-slate-800 dark:text-gray-200">
                                                    {provider.name}
                                                </div>
                                            </div>
                                        </td>
                                        
                                        {/* COORDONNÉES */}
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1.5 text-sm">
                                                {provider.phone ? (
                                                    <div className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                                                        <Phone size={14} className="text-gray-400" />
                                                        {provider.phone}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Pas de téléphone</span>
                                                )}
                                                
                                                {provider.address ? (
                                                    <div className="flex items-start gap-2 text-slate-600 dark:text-gray-400">
                                                        <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                                                        <span className="line-clamp-2 max-w-[250px]">{provider.address}</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </td>

                                        {/* NIU */}
                                        <td className="p-4">
                                            {provider.niu ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 uppercase">
                                                    <Hash size={12} className="text-slate-400" />
                                                    {provider.niu}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Non renseigné</span>
                                            )}
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button 
                                                    onClick={() => setSelectedProvider(provider)} 
                                                    title="Modifier" 
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(provider.id, provider.name)} 
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
            <CreateProviderModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
            />

            <UpdateProviderModal 
                isOpen={!!selectedProvider} 
                onClose={() => setSelectedProvider(null)} 
                provider={selectedProvider}
            />

        </div>
    );
};

export default Providers;