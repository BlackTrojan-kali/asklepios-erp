import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    ArrowLeft, 
    ChevronRight, 
    Plus, 
    Search, 
    Edit3, 
    Trash2, 
    Loader2, 
    RefreshCw,
    BedDouble,
    CheckCircle2,
    XCircle,
    Sparkles,
    Wrench
} from 'lucide-react';
import Swal from 'sweetalert2';

// --- STORES ---
import useBedStore from '../../../functions/base_hospital/useBedStore';

// --- TYPES ---
import { BedState } from '../../../types/BedTypes';
import type { BedDto } from '../../../types/BedTypes';
import type { FacilityRoomDto } from '../../../types/FacilityRoomTypes';

// --- MODALES ---
import { CreateBedModal } from '../../../components/modals/Base_hopital/Bed/CreateBedModal';
import { UpdateBedModal } from '../../../components/modals/Base_hopital/Bed/UpdateBedModal';

const BedsExplorer = () => {
    const { id: roomIdString } = useParams<{ id: string }>();
    const roomId = Number(roomIdString);
    const navigate = useNavigate();
    const location = useLocation();

    // Récupération des données passées via le Router (ou fallbacks)
    const room: FacilityRoomDto | undefined = location.state?.room;
    const roomName = room?.name || "Salle Inconnue";
    const departmentName = location.state?.departmentName || "Département";
    const departmentId = location.state?.departmentId;

    // --- STORES ---
    const { 
        beds, loading, pagination, 
        getBeds, deleteBed 
    } = useBedStore();

    // --- ÉTATS ---
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStateFilter, setSelectedStateFilter] = useState('');

    // États pour les modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedBed, setSelectedBed] = useState<BedDto | null>(null);

    // --- CHARGEMENT INITIAL ---
    useEffect(() => {
        if (roomId) {
            fetchBeds(page);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, page]);

    const fetchBeds = (targetPage: number = 1) => {
        getBeds(roomId, targetPage, {
            search: searchQuery,
            state: selectedStateFilter
        });
    };

    // Actions de filtre
    const handleRefresh = () => fetchBeds(page);

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchBeds(1);
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedStateFilter('');
        setPage(1);
        getBeds(roomId, 1, { search: '', state: '' });
    };

    // Action : Supprimer un lit
    const handleDelete = async (e: React.MouseEvent, id: number, bedNumber: string) => {
        e.stopPropagation();

        const result = await Swal.fire({
            title: 'Retirer ce lit ?',
            text: `Le lit "${bedNumber}" sera définitivement supprimé de cette salle.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, retirer',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });

        if (result.isConfirmed) {
            await deleteBed(id, roomId);
        }
    };

    // Helper : Rendu dynamique de l'état du lit (Style, Icône, Texte)
    const getBedStateConfig = (state: BedState) => {
        switch (state) {
            case BedState.AVAILABLE:
                return {
                    label: "Disponible",
                    icon: <CheckCircle2 size={16} />,
                    colorClass: "text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800/50",
                    iconColor: "text-emerald-500"
                };
            case BedState.OCCUPIED:
                return {
                    label: "Occupé",
                    icon: <XCircle size={16} />,
                    colorClass: "text-red-700 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800/50",
                    iconColor: "text-red-500"
                };
            case BedState.CLEANING:
                return {
                    label: "En Nettoyage",
                    icon: <Sparkles size={16} />,
                    colorClass: "text-amber-700 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800/50",
                    iconColor: "text-amber-500"
                };
            case BedState.MAINTENANCE:
                return {
                    label: "En Maintenance",
                    icon: <Wrench size={16} />,
                    colorClass: "text-gray-700 bg-gray-100 border-gray-300 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-700",
                    iconColor: "text-gray-500"
                };
            default:
                return {
                    label: "Inconnu",
                    icon: <BedDouble size={16} />,
                    colorClass: "text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700",
                    iconColor: "text-slate-400"
                };
        }
    };

    return (
        <div className="space-y-6">
            
            {/* FIL D'ARIANE / BREADCRUMBS & RETOUR */}
            <div className="flex flex-col gap-2">
                <button 
                    onClick={() => navigate(`/admin/departments/${departmentId}/rooms`, { state: { departmentName } })}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white w-fit transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Retour aux salles du département
                </button>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                            <BedDouble size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Lits d'Hospitalisation</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Gestion des lits pour <span className="font-semibold text-slate-700 dark:text-gray-300">{roomName}</span>.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button 
                            onClick={handleRefresh}
                            disabled={loading}
                            className="flex items-center justify-center p-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
                            title="Rafraîchir"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin text-indigo-600" : ""} />
                        </button>
                        <button 
                            onClick={() => setIsCreateOpen(true)}
                            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm w-full sm:w-auto"
                        >
                            <Plus size={18} />
                            Ajouter un lit
                        </button>
                    </div>
                </div>
            </div>

            {/* BARRE DE CHEMIN STYLE OS */}
            <div className="bg-slate-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 font-mono overflow-x-auto">
                <span className="cursor-pointer hover:underline shrink-0" onClick={() => navigate('/admin/departments')}>Départements</span>
                <ChevronRight size={14} className="shrink-0" />
                <span className="cursor-pointer hover:underline shrink-0" onClick={() => navigate(`/admin/departments/${departmentId}/manage_department`)}>{departmentName}</span>
                <ChevronRight size={14} className="shrink-0" />
                <span className="cursor-pointer hover:underline shrink-0" onClick={() => navigate(`/admin/departments/${departmentId}/rooms`, { state: { departmentName } })}>Chambres</span>
                <ChevronRight size={14} className="shrink-0" />
                <span className="text-slate-800 dark:text-gray-200 font-semibold shrink-0">{roomName}</span>
            </div>

            {/* SECTION DE FILTRES */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative md:col-span-2">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Rechercher par numéro de lit (ex: LIT-01)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 p-2 min-h-[42px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-sm text-slate-800 dark:text-white transition-colors"
                        />
                    </div>
                    <div>
                        <select
                            value={selectedStateFilter}
                            onChange={(e) => setSelectedStateFilter(e.target.value)}
                            className="w-full p-2 min-h-[42px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-sm text-slate-800 dark:text-white transition-colors"
                        >
                            <option value="">Tous les états</option>
                            <option value={BedState.AVAILABLE}>🟢 Disponibles</option>
                            <option value={BedState.OCCUPIED}>🔴 Occupés</option>
                            <option value={BedState.CLEANING}>🧹 En nettoyage</option>
                            <option value={BedState.MAINTENANCE}>🔧 En maintenance</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-slate-800 hover:bg-slate-900 dark:bg-gray-700 text-white px-4 py-2 min-h-[42px] rounded-lg font-medium transition-colors text-sm shadow-sm">
                            Filtrer
                        </button>
                        {(searchQuery || selectedStateFilter) && (
                            <button type="button" onClick={handleResetFilters} className="px-4 py-2 min-h-[42px] bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors text-sm">
                                Effacer
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* LISTE DES LITS (GRILLE) */}
            <div className="bg-slate-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-800 min-h-[400px] p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full py-20">
                        <Loader2 size={48} className="animate-spin text-indigo-600 mb-4" />
                        <p className="text-sm text-gray-500 uppercase tracking-widest font-medium">Chargement des lits...</p>
                    </div>
                ) : beds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                        <BedDouble size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-lg text-slate-600 dark:text-gray-400 font-medium">Aucun lit trouvé.</p>
                        <p className="text-sm text-gray-500 mt-1">Ajoutez des lits à cette salle pour commencer.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {beds.map((bed) => {
                            const config = getBedStateConfig(bed.state);

                            return (
                                <div 
                                    key={bed.id}
                                    className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl p-4 flex flex-col transition-all relative shadow-sm hover:shadow-md"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl bg-slate-50 dark:bg-gray-900/50 ${config.iconColor}`}>
                                            <BedDouble size={28} />
                                        </div>
                                        
                                        {/* Actions : Éditer / Supprimer */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => setSelectedBed(bed)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                                title="Modifier l'état"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDelete(e, bed.id, bed.bed_number)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <h3 className="font-bold text-slate-800 dark:text-gray-200 text-lg truncate mb-2" title={bed.bed_number}>
                                            {bed.bed_number}
                                        </h3>
                                        
                                        {/* Badge d'état dynamique */}
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold uppercase tracking-wider ${config.colorClass}`}>
                                            {config.icon}
                                            {config.label}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODALES */}
            <CreateBedModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                roomId={roomId}
            />

            <UpdateBedModal 
                isOpen={!!selectedBed} 
                onClose={() => setSelectedBed(null)} 
                bed={selectedBed}
            />

        </div>
    );
};

export default BedsExplorer;