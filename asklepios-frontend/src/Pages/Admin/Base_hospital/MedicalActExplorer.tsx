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
    FileText,
    CircleDollarSign,
    ClipboardList
} from 'lucide-react';
import Swal from 'sweetalert2';

// --- STORES & CONTEXTS ---
import useMedicalActStore from '../../../functions/base_hospital/useMedicalActStore';
import { useAuth } from '../../../contexts/AuthContext'; 

// --- TYPES ---
import type { MedicalActDto } from '../../../types/MedicalActCatalogTypes';

// --- MODALES ---
import { MedicalActModal } from '../../../components/modals/Base_hopital/MedicalAct/MedicalActModal';

const MedicalActExplorer = () => {
    // --- ROUTER & AUTH ---
    const { id: paramId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { profile } = useAuth(); 

    // Détermination des rôles
    const userRole = profile?.role || '';
    const isDoctor = userRole.includes('doctor');
    const isReceptionist = userRole.includes('reception');

    // Résolution intelligente de l'ID du département
    const departmentId = isDoctor 
        ? profile?.profile_doctor?.department_id 
        : Number(paramId);

    // Résolution de l'ID de l'hôpital
    const currentHospitalId = profile?.profile_admin ? profile?.profile_admin.hospital_id : profile?.profile_doctor?.hospital_id;

    // Nom du département
    const departmentName = isDoctor 
        ? (profile?.profile_doctor?.department?.name || "Mon Département")
        : (location.state?.departmentName || location.state?.department?.name || "Département inconnu");

    // --- STORES ---
    const { 
        medicalActs, loading, pagination, 
        getMedicalActs, deleteMedicalAct 
    } = useMedicalActStore();

    // --- ÉTATS ---
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    // États pour la modale
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAct, setSelectedAct] = useState<MedicalActDto | null>(null);
    const [autoRefreshPage, setAutoRefreshPage] = useState<boolean>(false);

    // 🟢 NOUVEAU : État pour le menu contextuel (clic droit)
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        act: MedicalActDto;
    } | null>(null);

    // --- CHARGEMENT INITIAL ---
    useEffect(() => {
        if (departmentId) {
            fetchActs(page);
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

    const fetchActs = (targetPage: number = 1) => {
        getMedicalActs(departmentId, targetPage, {
            search: searchQuery
        });
    };

    // --- ACTIONS DE FILTRAGE ---
    const handleRefresh = () => fetchActs(page);

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchActs(1);
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setPage(1);
        getMedicalActs(departmentId, 1, { search: '' });
    };

    const handleAutoRefresh = () => {
        setAutoRefreshPage(!autoRefreshPage);
    }

    // --- ACTIONS CRUD (Protégées) ---
    const handleOpenCreate = () => {
        if (isReceptionist) return; 
        setSelectedAct(null);
        setIsModalOpen(true);
    };

    // 🟢 MODIFICATION : Nettoyage de la signature (on enlève e: MouseEvent ici)
    const handleOpenEdit = (act: MedicalActDto) => {
        if (isReceptionist) return; 
        setSelectedAct(act);
        setIsModalOpen(true);
    };

    const handleDelete = async (actId: number, actName: string) => {
        if (isReceptionist) return;

        const result = await Swal.fire({
            title: 'Retirer cet acte ?',
            text: `L'acte "${actName}" sera archivé et ne pourra plus être facturé.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, archiver',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });

        if (result.isConfirmed) {
            await deleteMedicalAct(departmentId, actId);
        }
    };

    // 🟢 NOUVEAU : Fonction pour capturer le clic droit
    const handleContextMenu = (e: React.MouseEvent, act: MedicalActDto) => {
        e.preventDefault();
        if (isReceptionist) return; // Le réceptionniste n'a accès à aucune action
        
        // Empêche le menu de sortir de l'écran
        const x = e.clientX + 200 > window.innerWidth ? window.innerWidth - 220 : e.clientX;
        const y = e.clientY + 150 > window.innerHeight ? window.innerHeight - 170 : e.clientY;

        setContextMenu({
            mouseX: x,
            mouseY: y,
            act: act
        });
    };

    // --- UTILITAIRES ---
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE ET BREADCRUMBS */}
            <div className="flex flex-col gap-2">
                {!isDoctor && (
                    <button 
                        onClick={() => navigate(`/admin/departments/${departmentId}/manage_department`, { state: { department: { name: departmentName } } })}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white w-fit transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Retour à l'explorateur du département
                    </button>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg">
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Catalogue des Actes</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isDoctor ? "Tarification de vos prestations médicales." : `Gestion tarifaire du département ${departmentName}.`}
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
                            <RefreshCw size={18} className={loading ? "animate-spin text-amber-600 dark:text-amber-400" : ""} />
                        </button>
                        
                        {!isReceptionist && (
                            <button 
                                onClick={handleOpenCreate}
                                className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm w-full sm:w-auto"
                            >
                                <Plus size={18} />
                                Nouvel Acte
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* BARRE DE CHEMIN STYLE OS */}
            {!isDoctor && (
                <div className="bg-slate-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 font-mono overflow-x-auto">
                    <span className="cursor-pointer hover:underline shrink-0" onClick={() => navigate('/admin/departments')}>Départements</span>
                    <ChevronRight size={14} className="shrink-0" />
                    <span className="cursor-pointer hover:underline shrink-0" onClick={() => navigate(`/admin/departments/${departmentId}/manage_department`)}>{departmentName}</span>
                    <ChevronRight size={14} className="shrink-0" />
                    <span className="text-slate-800 dark:text-gray-200 font-semibold shrink-0">Catalogue des Actes</span>
                </div>
            )}

            {/* SECTION DE FILTRES */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleFilterSubmit} className="flex gap-3 flex-col md:flex-row">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Rechercher un acte médical (ex: Consultation, Échographie)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 p-2 min-h-[42px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-amber-500 dark:focus:border-amber-500 text-sm text-slate-800 dark:text-white transition-colors"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="bg-slate-800 hover:bg-slate-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-6 py-2 min-h-[42px] rounded-lg font-medium transition-colors text-sm shadow-sm">
                            Chercher
                        </button>
                        {searchQuery && (
                            <button type="button" onClick={handleResetFilters} className="px-4 py-2 min-h-[42px] bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors text-sm">
                                Effacer
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* EXPLORATEUR (GRILLE D'ACTES) */}
            <div className="bg-slate-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-800 min-h-[400px] p-6 relative">
                
                {/* 🟢 NOUVEAU : MENU CONTEXTUEL FLOTTANT */}
                {contextMenu && !isReceptionist && (
                    <div 
                        className="fixed z-50 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 animate-in fade-in zoom-in duration-150"
                        style={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
                    >
                        <div className="px-4 py-2 mb-1 border-b border-gray-100 dark:border-gray-700">
                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">
                                {contextMenu.act.name}
                            </span>
                        </div>

                        <button onClick={() => { handleOpenEdit(contextMenu.act); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-blue-600 dark:text-blue-400 transition-colors">
                            <Edit3 size={16} /> Modifier l'acte
                        </button>
                        <button onClick={() => { handleDelete(contextMenu.act.id, contextMenu.act.name); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-sm text-red-600 dark:text-red-400 transition-colors">
                            <Trash2 size={16} /> Archiver l'acte
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full py-20">
                        <Loader2 size={48} className="animate-spin text-amber-600 dark:text-amber-400 mb-4" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest font-medium">Chargement du catalogue...</p>
                    </div>
                ) : medicalActs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                        <FileText size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-lg text-slate-600 dark:text-gray-400 font-medium">Le catalogue est vide.</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                            {!isReceptionist ? "Ajoutez un acte médical pour permettre la facturation." : "Aucun tarif n'a encore été configuré par l'administration."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {medicalActs.map((act) => (
                            <div 
                                key={act.id}
                                onClick={(e) => { e.stopPropagation(); handleOpenEdit(act); }}
                                onContextMenu={(e) => handleContextMenu(e, act)} // 🟢 Ajout du listener contextMenu
                                className={`group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col transition-all relative overflow-hidden ${
                                    !isReceptionist 
                                    ? 'hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-md cursor-pointer cursor-context-menu' 
                                    : 'cursor-default'
                                } ${contextMenu?.act.id === act.id ? 'border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/20' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                        <CircleDollarSign size={28} />
                                    </div>
                                    
                                    {!isReceptionist && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(act.id, act.name); }}
                                                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                                title="Archiver"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto">
                                    <h3 className="font-bold text-slate-800 dark:text-gray-200 leading-tight mb-2 line-clamp-2" title={act.name}>
                                        {act.name}
                                    </h3>
                                    
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <span className="text-sm font-black text-amber-600 dark:text-amber-500">
                                            {formatCurrency(act.base_price)}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                            Tarif de Base
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODALE CRÉATION / ÉDITION */}
            {!isReceptionist && (
                <MedicalActModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    departmentId={departmentId}
                    currentHospitalId={currentHospitalId}
                    actToEdit={selectedAct}
                    AutoRefreshPage={handleAutoRefresh}
                />
            )}

        </div>
    );
};

export default MedicalActExplorer;