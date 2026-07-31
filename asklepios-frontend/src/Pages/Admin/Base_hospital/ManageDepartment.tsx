import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    Folder, 
    ArrowLeft, 
    ChevronRight, 
    BedDouble, 
    Construction, 
    FolderOpen,
    Wand2,
    Loader2,
    FileText
} from 'lucide-react';
import Swal from 'sweetalert2';

// --- STORES ---
import useFacilityRoomStore from '../../../functions/base_hospital/useFacilityRoomStore';
import { useAuth } from '../../../contexts/AuthContext';

// --- TYPES ---
interface SubFolder {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    colorClass: string;
    borderColorClass: string;
    path: string;
}

const ManageDepartment = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Hook du store pour l'initialisation des salles
    const { syncWaitingRooms, actionLoading } = useFacilityRoomStore();

    // Récupération des infos du département passées via le state du router (optionnel)
    const departmentName = location.state?.department?.name || "Département";
    const departmentAlias = location.state?.department?.alias;

    // 🟢 NOUVEAU : État pour le menu contextuel (clic droit)
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        folder: SubFolder;
    } | null>(null);

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

    // Configuration des sous-dossiers disponibles dans ce département
    const subFolders: SubFolder[] = [
        {
            id: 'rooms',
            title: 'Chambres & Installations',
            description: 'Gestion des lits, salles d’attente, blocs de consultation et hospitalisations.',
            icon: <BedDouble size={28} />,
            colorClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 group-hover:bg-indigo-600 group-hover:text-white',
            borderColorClass: 'hover:border-indigo-500 dark:hover:border-indigo-500',
            path: `/admin/departments/${id}/rooms`
        },
        {
            id: 'equipments',
            title: 'Équipements & Matériel',
            description: 'Inventaire du matériel médical, maintenance et allocation des dispositifs.',
            icon: <Construction size={28} />,
            colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 group-hover:bg-emerald-600 group-hover:text-white',
            borderColorClass: 'hover:border-emerald-500 dark:hover:border-emerald-500',
            path: `/admin/departments/${id}/equipments`
        },
        {
            id: 'medical_acts',
            title: 'Catalogue des Actes',
            description: 'Gestion de la tarification et des prestations médicales facturables.',
            icon: <FileText size={28} />,
            colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 group-hover:bg-amber-600 group-hover:text-white',
            borderColorClass: 'hover:border-amber-500 dark:hover:border-amber-500',
            path: `/admin/departments/${id}/medical-acts`
        }
    ];

    // --- ACTION : Initialiser les salles de base ---
    const handleInitializeRooms = async () => {
        const result = await Swal.fire({
            title: 'Générer les salles de base ?',
            text: "Cette action va analyser ce département (et tous les autres) pour créer automatiquement une Salle d'attente et un Bureau de consultation s'ils n'existent pas encore.",
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5', // indigo-600
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, initialiser',
            customClass: {
                popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200'
            }
        });

        if (result.isConfirmed) {
            await syncWaitingRooms();
        }
    };

    // 🟢 NOUVEAU : Fonction pour capturer le clic droit
    const handleContextMenu = (e: React.MouseEvent, folder: SubFolder) => {
        e.preventDefault(); // Empêche le menu contextuel natif du navigateur
        
        // Calcul pour éviter que le menu ne déborde de l'écran
        const x = e.clientX + 200 > window.innerWidth ? window.innerWidth - 220 : e.clientX;
        const y = e.clientY + 100 > window.innerHeight ? window.innerHeight - 120 : e.clientY;

        setContextMenu({
            mouseX: x,
            mouseY: y,
            folder: folder
        });
    };

    return (
        <div className="space-y-6">
            
            {/* FIL D'ARIANE / BREADCRUMBS & RETOUR */}
            <div className="flex flex-col gap-2">
                <button 
                    onClick={() => navigate('/admin/departments')}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white w-fit transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Retour aux départements
                </button>

                {/* EN-TÊTE DYNAMIQUE & BOUTON D'INITIALISATION */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#00a896]/10 text-[#00a896] rounded-lg">
                            <FolderOpen size={24} className="fill-current opacity-20" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{departmentName}</h1>
                                {departmentAlias && (
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 text-xs font-mono rounded font-bold uppercase border border-gray-200 dark:border-gray-700">
                                        {departmentAlias}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                Explorateur de configuration et des ressources internes du service.
                            </p>
                        </div>
                    </div>

                    {/* Action Rapide : Initialiser les salles */}
                    <div className="w-full sm:w-auto">
                        <button 
                            onClick={handleInitializeRooms}
                            disabled={actionLoading}
                            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 w-full sm:w-auto"
                            title="Générer automatiquement une salle d'attente et de consultation"
                        >
                            {actionLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Wand2 size={18} />
                            )}
                            Initialiser les salles
                        </button>
                    </div>
                </div>
            </div>

            {/* BARRE DE CHEMIN STYLE OS */}
            <div className="bg-slate-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 font-mono">
                <span className="cursor-pointer hover:underline" onClick={() => navigate('/admin/departments')}>Départements</span>
                <ChevronRight size={14} />
                <span className="text-slate-800 dark:text-gray-200 font-semibold">{departmentName}</span>
            </div>

            {/* GRILLE DES SOUS-DOSSIERS INTERACTIFS */}
            <div className="bg-white dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 p-6 min-h-[350px] relative">
                
                {/* 🟢 NOUVEAU : MENU CONTEXTUEL FLOTTANT */}
                {contextMenu && (
                    <div 
                        className="fixed z-50 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 animate-in fade-in zoom-in duration-150"
                        style={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
                    >
                        <div className="px-4 py-2 mb-1 border-b border-gray-100 dark:border-gray-700">
                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">
                                {contextMenu.folder.title}
                            </span>
                        </div>

                        <button 
                            onClick={() => {
                                navigate(contextMenu.folder.path, { state: { departmentName, departmentId: id } });
                                setContextMenu(null);
                            }} 
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-slate-700 dark:text-gray-200 transition-colors"
                        >
                            <FolderOpen size={16} className="text-indigo-500" /> Ouvrir le dossier
                        </button>
                    </div>
                )}

                <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                    Sous-dossiers de gestion
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {subFolders.map((folder) => {
                        // Condition pour garder le dossier en surbrillance si le menu contextuel est ouvert dessus
                        const isContextMenuActive = contextMenu?.folder.id === folder.id;

                        return (
                            <div
                                key={folder.id}
                                onClick={() => navigate(folder.path, { state: { departmentName, departmentId: id } })}
                                onContextMenu={(e) => handleContextMenu(e, folder)} // 🟢 Ajout du listener contextMenu
                                className={`group bg-white dark:bg-gray-800 border rounded-xl p-5 flex items-start gap-4 transition-all shadow-sm cursor-pointer cursor-context-menu hover:shadow-md ${
                                    isContextMenuActive 
                                    ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20' 
                                    : `border-gray-200 dark:border-gray-700/80 ${folder.borderColorClass}`
                                }`}
                            >
                                {/* Icône enveloppée */}
                                <div className={`p-3 rounded-xl transition-colors duration-300 shrink-0 ${folder.colorClass} ${isContextMenuActive ? 'bg-indigo-600 text-white' : ''}`}>
                                    {folder.icon}
                                </div>

                                {/* Contenu textuel */}
                                <div className="flex-1 space-y-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className={`font-bold text-base transition-colors flex items-center gap-1.5 ${isContextMenuActive ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-gray-200 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                                            <Folder size={16} className={`fill-current opacity-30 ${isContextMenuActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-inherit'}`} />
                                            {folder.title}
                                        </h3>
                                        <ChevronRight size={16} className={`transition-transform ${isContextMenuActive ? 'text-indigo-500 translate-x-1' : 'text-gray-400 group-hover:translate-x-1'}`} />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                        {folder.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};

export default ManageDepartment;