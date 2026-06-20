import React, { useEffect, useState } from 'react';
import { 
    ClipboardList, Plus, RefreshCw, Loader2, Edit, Trash2, 
    CheckSquare, Eye, FileText, FileSpreadsheet, AlertTriangle
} from 'lucide-react';
import Swal from 'sweetalert2';

// Stores & Types
import useInventoryStore from '../../../../functions/pharmacy/useInventoryStore';
import type { InventoryDto } from '../../../../types/InventoryTypes';

// Modales
import { InventoryModal } from '../../../../components/modals/Pharmacy/inventory/InventoryModal';
import { ViewInventoryModal } from '../../../../components/modals/Pharmacy/inventory/ViewInventoryModal';

const Inventories = () => {
    // --- STORES ---
    const { 
        inventories, meta, loading, actionLoading,
        getInventories, deleteInventory, validateInventory, exportPdf, exportExcel, getInventoryById
    } = useInventoryStore();

    // --- ÉTATS ---
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ status: '', start_date: '', end_date: '' });
    
    // États pour les modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedForEdit, setSelectedForEdit] = useState<InventoryDto | null>(null);
    const [selectedForView, setSelectedForView] = useState<number | null>(null);

    // --- CHARGEMENT ---
    useEffect(() => {
        // Un petit délai (debounce) peut être utile si l'utilisateur tape vite les dates
        const delayDebounce = setTimeout(() => {
            getInventories({ ...filters, page });
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [getInventories, filters, page]);

    const handleRefresh = () => {
        getInventories({ ...filters, page });
    };

    // --- ACTIONS ---
    const handleEditClick = async (id: number) => {
        // Charge l'inventaire COMPLET (avec ses lignes) avant d'ouvrir la modale
        const fullInventory = await getInventoryById(id);
        if (fullInventory) {
            setSelectedForEdit(fullInventory);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer ce brouillon ?',
            text: `Voulez-vous vraiment supprimer le brouillon d'inventaire #${id} ? Cette action est irréversible.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, supprimer',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });
        
        if (result.isConfirmed) {
            const success = await deleteInventory(id);
            if (success) handleRefresh();
        }
    };

    const handleValidate = async (id: number) => {
        const result = await Swal.fire({
            title: 'Valider l\'inventaire ?',
            html: `
                <div class="text-left mt-2">
                    <p class="mb-3">En validant cet inventaire :</p>
                    <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-4">
                        <li>Le brouillon deviendra immuable (lecture seule).</li>
                        <li>Des <b>mouvements de stock (entrées/sorties)</b> seront générés automatiquement pour corriger les écarts constatés.</li>
                    </ul>
                    <p class="font-bold text-red-500 flex items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        Cette action est définitive !
                    </p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, Valider & Ajuster les stocks',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });
        
        if (result.isConfirmed) {
            const success = await validateInventory(id);
            if (success) handleRefresh();
        }
    };

    // --- UTILITAIRES ---
    const getStatusBadge = (status: string) => {
        if (status === 'VALIDATED') {
            return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Validé</span>;
        }
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Brouillon</span>;
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                        <ClipboardList size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion des Inventaires</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Historique des comptages physiques et régularisations de stocks.</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    {/* Boutons d'exportation globaux */}
                    <button 
                        onClick={() => exportPdf(filters)} disabled={actionLoading}
                        className="p-2.5 bg-white hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-900/20 text-red-600 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                        title="Exporter en PDF"
                    >
                        <FileText size={18} />
                    </button>
                    <button 
                        onClick={() => exportExcel(filters)} disabled={actionLoading}
                        className="p-2.5 bg-white hover:bg-emerald-50 dark:bg-gray-800 dark:hover:bg-emerald-900/20 text-emerald-600 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                        title="Exporter en Excel"
                    >
                        <FileSpreadsheet size={18} />
                    </button>

                    <button 
                        onClick={handleRefresh} disabled={loading || actionLoading}
                        className="p-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 ml-2"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>

                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="flex flex-1 lg:flex-none justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Nouvel Inventaire
                    </button>
                </div>
            </div>

            {/* ALERTE INFORMATIVE */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle size={20} className="text-indigo-500 mt-0.5 shrink-0" />
                <p className="text-sm text-indigo-800 dark:text-indigo-400">
                    Les inventaires en statut <strong>Brouillon</strong> n'impactent pas vos stocks. L'ajustement (entrées et sorties) se fait automatiquement au moment de la <strong>Validation</strong>.
                </p>
            </div>

            {/* BARRE DE FILTRES */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/3">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Filtrer par Statut</label>
                    <select 
                        value={filters.status} onChange={(e) => { setFilters({...filters, status: e.target.value}); setPage(1); }}
                        className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:text-white"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="PENDING">Brouillon</option>
                        <option value="VALIDATED">Validé</option>
                    </select>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Date de début</label>
                        <input 
                            type="date" value={filters.start_date} onChange={(e) => { setFilters({...filters, start_date: e.target.value}); setPage(1); }}
                            className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Date de fin</label>
                        <input 
                            type="date" value={filters.end_date} onChange={(e) => { setFilters({...filters, end_date: e.target.value}); setPage(1); }}
                            className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* TABLEAU DES INVENTAIRES */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">N° & Date</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Créé par</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Note / Commentaire</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Statut</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-2" />
                                        <p className="text-gray-500 dark:text-gray-400">Chargement de l'historique...</p>
                                    </td>
                                </tr>
                            ) : inventories.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-500 dark:text-gray-400">
                                        Aucun inventaire trouvé pour ces critères.
                                    </td>
                                </tr>
                            ) : (
                                inventories.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white">#{inv.id}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(inv.execution_date).toLocaleDateString('fr-FR')}
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium text-slate-700 dark:text-gray-300">
                                            {inv.user?.first_name} {inv.user?.last_name}
                                        </td>
                                        <td className="p-4 text-gray-500 dark:text-gray-400 italic max-w-xs truncate">
                                            {inv.comment || '-'}
                                        </td>
                                        <td className="p-4 text-center">
                                            {getStatusBadge(inv.status)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                
                                                {/* INVENTAIRE BROUILLON (PENDING) */}
                                                {inv.status === 'PENDING' ? (
                                                    <>
                                                        <button 
                                                            onClick={() => handleEditClick(inv.id)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                            title="Reprendre le brouillon"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleValidate(inv.id)}
                                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                                                            title="Valider l'inventaire"
                                                        >
                                                            <CheckSquare size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(inv.id)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                            title="Supprimer le brouillon"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    /* INVENTAIRE VALIDÉ (VALIDATED) */
                                                    <button 
                                                        onClick={() => setSelectedForView(inv.id)}
                                                        className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                        title="Consulter le rapport"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                )}

                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {meta && meta.last_page > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Page {meta.current_page} sur {meta.last_page} ({meta.total} inventaires)
                        </span>
                        <div className="flex gap-2">
                            <button 
                                disabled={page === 1} onClick={() => setPage(page - 1)}
                                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 disabled:opacity-50 text-slate-700 dark:text-gray-300"
                            >
                                Précédent
                            </button>
                            <button 
                                disabled={page === meta.last_page} onClick={() => setPage(page + 1)}
                                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 disabled:opacity-50 text-slate-700 dark:text-gray-300"
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALE DE CRÉATION/MODIFICATION UNIFIÉE */}
            <InventoryModal 
                isOpen={isCreateOpen || !!selectedForEdit} 
                onClose={() => {
                    setIsCreateOpen(false);
                    setSelectedForEdit(null);
                }}
                existingInventory={selectedForEdit}
                onSuccess={handleRefresh}
            />

            {/* MODALE DE CONSULTATION (Validé) */}
            <ViewInventoryModal 
                isOpen={!!selectedForView}
                onClose={() => setSelectedForView(null)}
                inventoryId={selectedForView}
            />

        </div>
    );
};

export default Inventories;