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
    Stethoscope,
    UsersRound,
    AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';

// --- STORES ---
import useFacilityRoomStore from '../../../functions/base_hospital/useFacilityRoomStore';
import useDepartmentStore from '../../../functions/departments/useDepartmentStore';
import useRoomCategoryStore from '../../../functions/base_hospital/useRoomCategoryStore';

// --- TYPES ---
import { FacilityRoomType, type FacilityRoomDto } from '../../../types/FacilityRoomTypes';

// --- MODALES ---
import { CreateFacilityRoomModal } from '../../../components/modals/Base_hopital/FacilityRoom/CreateFacilityRoomModal';
import { UpdateFacilityRoomModal } from '../../../components/modals/Base_hopital/FacilityRoom/UpdateFacilityRoomModal';

const FacilityRoomsExplorer = () => {
    const { id: departmentIdString } = useParams<{ id: string }>();
    const departmentId = Number(departmentIdString);
    const navigate = useNavigate();
    const location = useLocation();

    // Nom du département (passé via Router State ou via un fetch de fallback)
    const departmentName = location.state?.departmentName || location.state?.department?.name || "Département inconnu";

    // --- STORES ---
    const { 
        facilityRooms, loading, pagination, 
        getFacilityRooms, deleteFacilityRoom 
    } = useFacilityRoomStore();

    // Pour alimenter les modales
    const { departments, getDepartments } = useDepartmentStore();
    const { sharedRoomCategories, getSharedRoomCategories } = useRoomCategoryStore();

    // --- ÉTATS ---
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTypeFilter, setSelectedTypeFilter] = useState('');

    // États pour les modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<FacilityRoomDto | null>(null);

    // --- CHARGEMENT INITIAL ---
    useEffect(() => {
        // Pré-chargement des données nécessaires pour les formulaires de création/édition
        // Note: l'ID du centre est requis pour filtrer les catégories, on récupère tout par défaut
        getDepartments(); 
        getSharedRoomCategories({}); 
    }, [getDepartments, getSharedRoomCategories]);

    useEffect(() => {
        if (departmentId) {
            fetchRooms(page);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [departmentId, page]);

    const fetchRooms = (targetPage: number = 1) => {
        getFacilityRooms(departmentId, targetPage, {
            search: searchQuery,
            type: selectedTypeFilter
        });
    };

    // Actions
    const handleRefresh = () => fetchRooms(page);

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchRooms(1);
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedTypeFilter('');
        setPage(1);
        getFacilityRooms(departmentId, 1, { search: '', type: '' });
    };

    // Action : Ouvrir une chambre pour gérer les lits
    const handleOpenRoom = (room: FacilityRoomDto) => {
        if (room.type === FacilityRoomType.WARD) {
            navigate(`/admin/rooms/${room.id}/beds`, { 
                state: { room, departmentName, departmentId } 
            });
        }
    };

    // Action : Supprimer une salle
    const handleDelete = async (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();

        const result = await Swal.fire({
            title: 'Détruire cette salle ?',
            text: `La salle "${name}" (et potentiellement ses lits) sera définitivement supprimée.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, détruire',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });

        if (result.isConfirmed) {
            await deleteFacilityRoom(id, departmentId);
        }
    };

    // Helper : Rendu dynamique de l'icône selon le type
    const renderRoomIcon = (type: FacilityRoomType) => {
        switch (type) {
            case FacilityRoomType.WARD:
                return <BedDouble size={28} className="text-indigo-500 group-hover:text-indigo-600 transition-colors" />;
            case FacilityRoomType.CONSULTATION:
                return <Stethoscope size={28} className="text-emerald-500 group-hover:text-emerald-600 transition-colors" />;
            case FacilityRoomType.WAITING_ROOM:
                return <UsersRound size={28} className="text-amber-500 group-hover:text-amber-600 transition-colors" />;
            default:
                return <AlertCircle size={28} className="text-gray-400" />;
        }
    };

    // Helper : Couleur de fond de l'icône
    const getRoomBgColor = (type: FacilityRoomType) => {
        switch (type) {
            case FacilityRoomType.WARD: return 'bg-indigo-50 dark:bg-indigo-900/30';
            case FacilityRoomType.CONSULTATION: return 'bg-emerald-50 dark:bg-emerald-900/30';
            case FacilityRoomType.WAITING_ROOM: return 'bg-amber-50 dark:bg-amber-900/30';
            default: return 'bg-gray-50 dark:bg-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            
            {/* FIL D'ARIANE / BREADCRUMBS & RETOUR */}
            <div className="flex flex-col gap-2">
                <button 
                    onClick={() => navigate(`/admin/departments/${departmentId}/manage_department`, { state: { department: { name: departmentName } } })}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white w-fit transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Retour à l'explorateur du département
                </button>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                            <BedDouble size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Salles & Chambres</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Gestion des espaces du département <span className="font-semibold text-slate-700 dark:text-gray-300">{departmentName}</span>.
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
                            Nouvelle Salle
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
                <span className="text-slate-800 dark:text-gray-200 font-semibold shrink-0">Chambres & Installations</span>
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
                            placeholder="Rechercher une salle (ex: Chambre VIP, Bureau 102)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 p-2 min-h-[42px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-sm text-slate-800 dark:text-white transition-colors"
                        />
                    </div>
                    <div>
                        <select
                            value={selectedTypeFilter}
                            onChange={(e) => setSelectedTypeFilter(e.target.value)}
                            className="w-full p-2 min-h-[42px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-sm text-slate-800 dark:text-white transition-colors"
                        >
                            <option value="">Tous les types</option>
                            <option value={FacilityRoomType.WARD}>Chambres (Hospitalisation)</option>
                            <option value={FacilityRoomType.CONSULTATION}>Bureaux de Consultation</option>
                            <option value={FacilityRoomType.WAITING_ROOM}>Salles d'attente</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-slate-800 hover:bg-slate-900 dark:bg-gray-700 text-white px-4 py-2 min-h-[42px] rounded-lg font-medium transition-colors text-sm shadow-sm">
                            Filtrer
                        </button>
                        {(searchQuery || selectedTypeFilter) && (
                            <button type="button" onClick={handleResetFilters} className="px-4 py-2 min-h-[42px] bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors text-sm">
                                Effacer
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* EXPLORATEUR DE SALLES (GRILLE) */}
            <div className="bg-slate-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-800 min-h-[400px] p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full py-20">
                        <Loader2 size={48} className="animate-spin text-indigo-600 mb-4" />
                        <p className="text-sm text-gray-500 uppercase tracking-widest font-medium">Chargement des installations...</p>
                    </div>
                ) : facilityRooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                        <BedDouble size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-lg text-slate-600 dark:text-gray-400 font-medium">Aucune salle trouvée.</p>
                        <p className="text-sm text-gray-500 mt-1">Créez une nouvelle chambre ou bureau de consultation.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {facilityRooms.map((room) => {
                            const isClickable = room.type === FacilityRoomType.WARD;

                            return (
                                <div 
                                    key={room.id}
                                    onClick={() => handleOpenRoom(room)}
                                    className={`group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col transition-all relative overflow-hidden ${
                                        isClickable 
                                            ? 'hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md cursor-pointer' 
                                            : 'hover:border-gray-300 dark:hover:border-gray-600 cursor-default'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`p-3 rounded-xl transition-colors ${getRoomBgColor(room.type)}`}>
                                            {renderRoomIcon(room.type)}
                                        </div>
                                        
                                        {/* Actions : Éditer / Supprimer */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setSelectedRoom(room); }}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                                title="Modifier"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDelete(e, room.id, room.name)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <h3 className="font-bold text-slate-800 dark:text-gray-200 truncate" title={room.name}>
                                            {room.name}
                                        </h3>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                {room.type === FacilityRoomType.WARD ? "Hospitalisation" : 
                                                 room.type === FacilityRoomType.CONSULTATION ? "Consultation" : "Attente"}
                                            </span>
                                            
                                            {/* Tag Catégorie pour les chambres */}
                                            {room.type === FacilityRoomType.WARD && room.category && (
                                                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold rounded border border-indigo-100 dark:border-indigo-800/50">
                                                    {room.category.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODALES */}
            <CreateFacilityRoomModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                currentDepartmentId={departmentId}
                departments={departments}
                roomCategories={sharedRoomCategories}
            />

            <UpdateFacilityRoomModal 
                isOpen={!!selectedRoom} 
                onClose={() => setSelectedRoom(null)} 
                room={selectedRoom}
                departments={departments}
                roomCategories={sharedRoomCategories}
            />

        </div>
    );
};

export default FacilityRoomsExplorer;