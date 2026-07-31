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
    Activity,
    Settings2,
    AlertOctagon,
    Microscope,
    HeartPulse
} from 'lucide-react';
import Swal from 'sweetalert2';

// --- STORES ---
import useEquipmentStore from '../../../functions/base_hospital/useEquipmentStore';
import useFacilityRoomStore from '../../../functions/base_hospital/useFacilityRoomStore';

// --- TYPES ---
import type { EquipmentDto } from '../../../types/EquipmentTypes';

// --- MODALES ---
import { EquipmentModal } from '../../../components/modals/Base_hopital/Equipments/EquipmentModal';

const EquipmentExplorer = () => {
    const { id: departmentIdString } = useParams<{ id: string }>();
    const departmentId = Number(departmentIdString);
    const navigate = useNavigate();
    const location = useLocation();

    // Nom du département (passé via Router State)
    const departmentName = location.state?.departmentName || location.state?.department?.name || "Département inconnu";

    // --- STORES ---
    const { 
        equipment, loading, pagination, 
        getEquipment, deleteEquipment 
    } = useEquipmentStore();

    // Pour alimenter la modale
    const { sharedFacilityRooms, getSharedFacilityRooms } = useFacilityRoomStore();

    // --- ÉTATS ---
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

    // États pour la modale
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<EquipmentDto | null>(null);
    const [autoRefreshPage, setAutoRefreshPage] = useState<boolean>(false);

    // 🟢 NOUVEAU : État pour le menu contextuel (clic droit)
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        item: EquipmentDto;
    } | null>(null);

    // --- CHARGEMENT INITIAL ---
    useEffect(() => {
        if (departmentId) {
            getSharedFacilityRooms(departmentId, {});
            fetchEquipment(page);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [departmentId, page, autoRefreshPage]);

    // 🟢 NOUVEAU : Fermer le menu contextuel au clic ailleurs ou au scroll
    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        document.addEventListener("click", handleClickOutside);
        document.addEventListener("scroll", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
            document.removeEventListener("scroll", handleClickOutside);
        };
    }, []);

    const fetchEquipment = (targetPage: number = 1) => {
        getEquipment(departmentId, targetPage, {
            search: searchQuery,
            status: selectedStatusFilter
        });
    };

    const handleAutoRefresh = () => {
        setAutoRefreshPage(!autoRefreshPage)
    }

    // --- ACTIONS DE FILTRAGE ---
    const handleRefresh = () => fetchEquipment(page);

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchEquipment(1);
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedStatusFilter('');
        setPage(1);
        getEquipment(departmentId, 1, { search: '', status: '' });
    };

    // --- ACTIONS CRUD ---
    const handleOpenCreate = () => {
        setSelectedEquipment(null);
        setIsModalOpen(true);
    };

    // 🟢 MODIFICATION : Nettoyage de la signature
    const handleOpenEdit = (item: EquipmentDto) => {
        setSelectedEquipment(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number, name: string) => {
        const result = await Swal.fire({
            title: 'Archiver cet équipement ?',
            text: `L'appareil "${name}" sera retiré de la vue principale.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, archiver',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });

        if (result.isConfirmed) {
            await deleteEquipment(departmentId, id);
        }
    };

    // 🟢 NOUVEAU : Fonction pour capturer le clic droit
    const handleContextMenu = (e: React.MouseEvent, item: EquipmentDto) => {
        e.preventDefault(); 
        
        // Empêche le menu de sortir de l'écran
        const x = e.clientX + 200 > window.innerWidth ? window.innerWidth - 220 : e.clientX;
        const y = e.clientY + 150 > window.innerHeight ? window.innerHeight - 170 : e.clientY;

        setContextMenu({
            mouseX: x,
            mouseY: y,
            item: item
        });
    };

    // --- HELPERS VISUELS ---
    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'ACTIVE': return { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', icon: <HeartPulse size={28} />, label: 'Actif' };
            case 'IN_USE': return { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', icon: <Activity size={28} />, label: 'En cours' };
            case 'IN_MAINTENANCE': return { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', icon: <Settings2 size={28} />, label: 'Maintenance' };
            case 'OUT_OF_SERVICE': return { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', icon: <AlertOctagon size={28} />, label: 'Hors service' };
            case 'RETIRED': return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400', icon: <Microscope size={28} />, label: 'Réformé' };
            default: return { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-400', icon: <Activity size={28} />, label: status };
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
                        <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                            <Microscope size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Équipements Médicaux</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Gestion du matériel du département <span className="font-semibold text-slate-700 dark:text-gray-300">{departmentName}</span>.
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
                            <RefreshCw size={18} className={loading ? "animate-spin text-blue-600 dark:text-blue-400" : ""} />
                        </button>
                        <button 
                            onClick={handleOpenCreate}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm w-full sm:w-auto"
                        >
                            <Plus size={18} />
                            Nouvel Appareil
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
                <span className="text-slate-800 dark:text-gray-200 font-semibold shrink-0">Matériel & Équipements</span>
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
                            placeholder="Rechercher (Nom, Numéro de série, Modèle)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 p-2 min-h-[42px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 dark:focus:border-blue-500 text-sm text-slate-800 dark:text-white transition-colors"
                        />
                    </div>
                    <div>
                        <select
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                            className="w-full p-2 min-h-[42px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 dark:focus:border-blue-500 text-sm text-slate-800 dark:text-white transition-colors font-semibold"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="ACTIVE">🟢 Actif (Prêt)</option>
                            <option value="IN_USE">🔵 En cours d'utilisation</option>
                            <option value="IN_MAINTENANCE">🟠 En maintenance</option>
                            <option value="OUT_OF_SERVICE">🔴 Hors service</option>
                            <option value="RETIRED">⚫ Réformé</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-slate-800 hover:bg-slate-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 min-h-[42px] rounded-lg font-medium transition-colors text-sm shadow-sm">
                            Filtrer
                        </button>
                        {(searchQuery || selectedStatusFilter) && (
                            <button type="button" onClick={handleResetFilters} className="px-4 py-2 min-h-[42px] bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors text-sm">
                                Effacer
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* EXPLORATEUR D'ÉQUIPEMENTS (GRILLE) */}
            <div className="bg-slate-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-800 min-h-[400px] p-6 relative">
                
                {/* 🟢 NOUVEAU : MENU CONTEXTUEL FLOTTANT */}
                {contextMenu && (
                    <div 
                        className="fixed z-50 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 animate-in fade-in zoom-in duration-150"
                        style={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
                    >
                        <div className="px-4 py-2 mb-1 border-b border-gray-100 dark:border-gray-700">
                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">
                                {contextMenu.item.name}
                            </span>
                        </div>

                        <button onClick={() => { handleOpenEdit(contextMenu.item); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-blue-600 dark:text-blue-400 transition-colors">
                            <Edit3 size={16} /> Modifier l'appareil
                        </button>
                        <button onClick={() => { handleDelete(contextMenu.item.id, contextMenu.item.name); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-sm text-red-600 dark:text-red-400 transition-colors">
                            <Trash2 size={16} /> Archiver l'appareil
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full py-20">
                        <Loader2 size={48} className="animate-spin text-blue-600 dark:text-blue-400 mb-4" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest font-medium">Recherche du matériel...</p>
                    </div>
                ) : equipment.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                        <Microscope size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-lg text-slate-600 dark:text-gray-400 font-medium">Aucun équipement trouvé.</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Ajoutez un appareil pour commencer à le suivre.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {equipment.map((item) => {
                            const style = getStatusStyles(item.status);

                            return (
                                <div 
                                    key={item.id}
                                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                                    onContextMenu={(e) => handleContextMenu(e, item)} // 🟢 Ajout du listener contextMenu
                                    className={`group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col transition-all relative overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md cursor-pointer cursor-context-menu ${contextMenu?.item.id === item.id ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`p-3 rounded-xl transition-colors ${style.bg} ${style.text}`}>
                                            {style.icon}
                                        </div>
                                        
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.name); }}
                                                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                                title="Archiver"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <h3 className="font-bold text-slate-800 dark:text-gray-200 truncate" title={item.name}>
                                            {item.name}
                                        </h3>
                                        {item.serial_number && (
                                            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5 truncate">
                                                S/N: {item.serial_number}
                                            </p>
                                        )}
                                        
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${style.bg} ${style.text}`}>
                                                {style.label}
                                            </span>
                                            
                                            {item.facility_room && (
                                                <span className="text-[10px] text-slate-500 dark:text-gray-400 truncate max-w-[100px]" title={item.facility_room.name}>
                                                    📍 {item.facility_room.name}
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

            {/* MODALE UNIQUE CRÉATION / ÉDITION */}
            <EquipmentModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                departmentId={departmentId}
                equipmentToEdit={selectedEquipment}
                facilityRooms={sharedFacilityRooms}
                AutoRefreshPage={handleAutoRefresh}
            />

        </div>
    );
};

export default EquipmentExplorer;