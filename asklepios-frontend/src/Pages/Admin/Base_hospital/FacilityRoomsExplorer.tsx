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
    AlertCircle,
    ListOrdered,
    History
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

    const departmentName = location.state?.departmentName || location.state?.department?.name || "Département inconnu";

    const { 
        facilityRooms, loading, pagination, 
        getFacilityRooms, deleteFacilityRoom 
    } = useFacilityRoomStore();

    const { departments, getDepartments } = useDepartmentStore();
    const { sharedRoomCategories, getSharedRoomCategories } = useRoomCategoryStore();

    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<FacilityRoomDto | null>(null);
    const [autoRefreshPage, setAutoRefreshPage] = useState<boolean>(false);

    // 🟢 NOUVEAU : État pour le menu contextuel (clic droit)
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        room: FacilityRoomDto;
    } | null>(null);

    useEffect(() => {
        getDepartments(); 
        getSharedRoomCategories({}); 
    }, [getDepartments, getSharedRoomCategories, autoRefreshPage]);

    useEffect(() => {
        if (departmentId) {
            fetchRooms(page);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [departmentId, page, autoRefreshPage]);

    // 🟢 NOUVEAU : Fermer le menu contextuel si on clique ailleurs ou si on scroll
    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        document.addEventListener("click", handleClickOutside);
        document.addEventListener("scroll", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
            document.removeEventListener("scroll", handleClickOutside);
        };
    }, []);

    const fetchRooms = (targetPage: number = 1) => {
        getFacilityRooms(departmentId, targetPage, {
            search: searchQuery,
            type: selectedTypeFilter
        });
    };

    const handleAutoRefresh = () => {
        setAutoRefreshPage(!autoRefreshPage);
    }

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

    const handleOpenRoom = (room: FacilityRoomDto) => {
        if (room.type === FacilityRoomType.WARD) {
            navigate(`/admin/rooms/${room.id}/beds`, { 
                state: { room, departmentName, departmentId } 
            });
        } else if (room.type === FacilityRoomType.WAITING_ROOM) {
            navigate(`/admin/rooms/${room.id}/waiting-patients`, { 
                state: { room, departmentName, departmentId } 
            });
        } else if (room.type === FacilityRoomType.CONSULTATION) {
            navigate(`/admin/rooms/${room.id}/consultations`, { 
                state: { room, departmentName, departmentId } 
            });
        }
    };

    const handleOpenAdmissionHistory = (room: FacilityRoomDto) => {
        navigate(`/admin/rooms/${room.id}/admissions`, { 
            state: { room, departmentName, departmentId } 
        });
    };

    // 🟢 MODIFICATION : Nettoyage de la signature (on gère e.stopPropagation côté JSX)
    const handleDelete = async (id: number, name: string) => {
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

    // 🟢 NOUVEAU : Fonction pour capturer le clic droit
    const handleContextMenu = (e: React.MouseEvent, room: FacilityRoomDto) => {
        e.preventDefault(); // Empêche le menu contextuel natif du navigateur
        
        // Empêche le menu de sortir de l'écran (si on clique trop près du bord droit/bas)
        const x = e.clientX + 200 > window.innerWidth ? window.innerWidth - 220 : e.clientX;
        const y = e.clientY + 220 > window.innerHeight ? window.innerHeight - 240 : e.clientY;

        setContextMenu({
            mouseX: x,
            mouseY: y,
            room: room
        });
    };

    const renderRoomIcon = (type: FacilityRoomType) => {
        switch (type) {
            case FacilityRoomType.WARD: return <BedDouble size={28} className="text-indigo-500" />;
            case FacilityRoomType.CONSULTATION: return <Stethoscope size={28} className="text-emerald-500" />;
            case FacilityRoomType.WAITING_ROOM: return <UsersRound size={28} className="text-amber-500" />;
            default: return <AlertCircle size={28} className="text-gray-400" />;
        }
    };

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
                            className="flex items-center justify-center p-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-colors"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""} />
                        </button>
                        <button onClick={() => setIsCreateOpen(true)} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg shadow-sm">
                            <Plus size={18} /> Nouvelle Salle
                        </button>
                    </div>
                </div>
            </div>

            {/* FILTRES */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative md:col-span-2">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input 
                            type="text" placeholder="Rechercher une salle..."
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 p-2 min-h-[42px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-800 dark:text-white outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
                        />
                    </div>
                    <div>
                        <select 
                            value={selectedTypeFilter} 
                            onChange={(e) => setSelectedTypeFilter(e.target.value)} 
                            className="w-full p-2 min-h-[42px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-800 dark:text-white outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
                        >
                            <option value="">Tous les types</option>
                            <option value={FacilityRoomType.WARD}>Chambres (Hospitalisation)</option>
                            <option value={FacilityRoomType.CONSULTATION}>Bureaux de Consultation</option>
                            <option value={FacilityRoomType.WAITING_ROOM}>Salles d'attente</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-slate-800 dark:bg-gray-700 hover:bg-slate-900 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">Filtrer</button>
                        {(searchQuery || selectedTypeFilter) && (
                            <button type="button" onClick={handleResetFilters} className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg font-medium text-sm transition-colors">Effacer</button>
                        )}
                    </div>
                </form>
            </div>

            {/* GRILLE DES SALLES */}
            <div className="bg-slate-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-800 min-h-[400px] p-6 relative">
                
                {/* 🟢 NOUVEAU : Rendu du Menu Contextuel Flottant */}
                {contextMenu && (
                    <div 
                        className="fixed z-50 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 animate-in fade-in zoom-in duration-150"
                        style={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
                    >
                        <div className="px-4 py-2 mb-1 border-b border-gray-100 dark:border-gray-700">
                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">
                                {contextMenu.room.name}
                            </span>
                        </div>

                        {/* Actions spécifiques selon le type */}
                        {contextMenu.room.type === FacilityRoomType.WARD && (
                            <>
                                <button onClick={() => handleOpenRoom(contextMenu.room)} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-slate-700 dark:text-gray-200 transition-colors">
                                    <BedDouble size={16} className="text-indigo-500" /> Gérer les lits
                                </button>
                                <button onClick={() => handleOpenAdmissionHistory(contextMenu.room)} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-slate-700 dark:text-gray-200 transition-colors">
                                    <History size={16} className="text-blue-500" /> Hospitalisations
                                </button>
                            </>
                        )}
                        {contextMenu.room.type === FacilityRoomType.CONSULTATION && (
                            <button onClick={() => handleOpenRoom(contextMenu.room)} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-slate-700 dark:text-gray-200 transition-colors">
                                <History size={16} className="text-emerald-500" /> Historique consultations
                            </button>
                        )}
                        {contextMenu.room.type === FacilityRoomType.WAITING_ROOM && (
                            <button onClick={() => handleOpenRoom(contextMenu.room)} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-slate-700 dark:text-gray-200 transition-colors">
                                <ListOrdered size={16} className="text-amber-500" /> File d'attente
                            </button>
                        )}

                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>

                        {/* Actions standards (Edit / Delete) */}
                        <button onClick={() => setSelectedRoom(contextMenu.room)} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-blue-600 dark:text-blue-400 transition-colors">
                            <Edit3 size={16} /> Modifier la salle
                        </button>
                        <button onClick={() => handleDelete(contextMenu.room.id, contextMenu.room.name)} className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-sm text-red-600 dark:text-red-400 transition-colors">
                            <Trash2 size={16} /> Supprimer la salle
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full py-20">
                        <Loader2 size={48} className="animate-spin text-indigo-600 dark:text-indigo-400 mb-4" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Chargement...</p>
                    </div>
                ) : facilityRooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                        <BedDouble size={64} className="text-gray-300 dark:text-gray-700 mb-4" />
                        <p className="text-lg text-slate-600 dark:text-gray-400 font-medium">Aucune salle trouvée.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {facilityRooms.map((room) => {
                            return (
                                <div 
                                    key={room.id}
                                    onClick={() => handleOpenRoom(room)}
                                    onContextMenu={(e) => handleContextMenu(e, room)} // 🟢 Ajout de l'événement Clic Droit
                                    className={`group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col transition-all relative overflow-hidden cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md ${contextMenu?.room.id === room.id ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`p-3 rounded-xl transition-colors ${getRoomBgColor(room.type)}`}>
                                            {renderRoomIcon(room.type)}
                                        </div>
                                        
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {room.type === FacilityRoomType.WARD && (
                                                <>
                                                    <button onClick={(e) => { e.stopPropagation(); handleOpenRoom(room); }} className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-colors" title="Gérer les lits">
                                                        <BedDouble size={16} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleOpenAdmissionHistory(room); }} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors" title="Historique des Hospitalisations">
                                                        <History size={16} />
                                                    </button>
                                                </>
                                            )}
                                            {room.type === FacilityRoomType.CONSULTATION && (
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenRoom(room); }} className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md transition-colors" title="Voir l'historique">
                                                    <History size={16} />
                                                </button>
                                            )}
                                            {room.type === FacilityRoomType.WAITING_ROOM && (
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenRoom(room); }} className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-md transition-colors" title="Voir la file d'attente">
                                                    <ListOrdered size={16} />
                                                </button>
                                            )}
                                            
                                            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                                            <button onClick={(e) => { e.stopPropagation(); setSelectedRoom(room); }} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors" title="Modifier la salle">
                                                <Edit3 size={16} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(room.id, room.name); }} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors" title="Supprimer">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <h3 className="font-bold text-slate-800 dark:text-gray-200 truncate">{room.name}</h3>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                {room.type === FacilityRoomType.WARD ? "Hospitalisation" : 
                                                 room.type === FacilityRoomType.CONSULTATION ? "Consultation" : "Attente"}
                                            </span>
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

            <CreateFacilityRoomModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} currentDepartmentId={departmentId} departments={departments} roomCategories={sharedRoomCategories} AutoRefreshPage={handleAutoRefresh} />
            <UpdateFacilityRoomModal isOpen={!!selectedRoom} onClose={() => setSelectedRoom(null)} room={selectedRoom} departments={departments} roomCategories={sharedRoomCategories} AutoRefreshPage={handleAutoRefresh} />
        </div>
    );
};

export default FacilityRoomsExplorer;