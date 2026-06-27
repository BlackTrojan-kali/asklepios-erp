import React, { useEffect, useState, useMemo } from 'react';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import { 
    LayoutGrid, 
    Plus, 
    Search, 
    Edit3, 
    Trash2, 
    Building2, 
    Loader2, 
    RefreshCw,
    Folder,
    FolderOpen
} from 'lucide-react';
import Swal from 'sweetalert2';

// Stores & Hooks
import useDepartmentStore from '../../../functions/departments/useDepartmentStore';
import useCenterStore from '../../../functions/center/useCenterStore';

// Modèles et Types
import type { DepartmentDto } from '../../../types/types';

// Modales
import { CreateDepartmentModal } from '../../../components/modals/Department/CreateDepartmentModal';
import { UpdateDepartmentModal } from '../../../components/modals/Department/UpdateDepartmentModal';

const Departments = () => {
    const navigate = useNavigate();

    // Hooks des stores
    const { centers, getCenters } = useCenterStore();
    const { 
        departments, loading, getDepartments, deleteDepartment 
    } = useDepartmentStore();
    
    // États pour la sélection et la recherche
    const [selectedCenterOption, setSelectedCenterOption] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // États pour les modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedDept, setSelectedDept] = useState<DepartmentDto | null>(null);

    // 1. Chargement initial des centres de l'hôpital
    useEffect(() => {
        getCenters(1, {}, 100);
    }, [getCenters]);

    // 2. Chargement des départements quand le centre sélectionné change
    useEffect(() => {
        if (selectedCenterOption) {
            getDepartments(selectedCenterOption.value, searchTerm);
        }
    }, [selectedCenterOption, searchTerm, getDepartments]);

    // Formatage des centres pour le composant Select
    const centerOptions = useMemo(() => 
        centers.map(c => ({ value: c.id, label: c.name })), 
    [centers]);

    // Action : Rafraîchir les données
    const handleRefresh = () => {
        if (selectedCenterOption) {
            getDepartments(selectedCenterOption.value, searchTerm);
        }
    };

    // Action : Naviguer vers l'intérieur du dossier (Gestion des salles)
    const handleOpenFolder = (dept: DepartmentDto) => {
        // TODO: Ajuste cette URL selon tes routes réelles pour la page d'exploration du département
        navigate(`/admin/departments/${dept.id}/manage_department`, { state: { department: dept } });
    };

    // Action : Supprimer un département
    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation(); // Empêche l'ouverture du dossier lors du clic sur la poubelle

        if (!selectedCenterOption) return;

        const result = await Swal.fire({
            title: 'Supprimer ce département ?',
            text: "Tous les services et personnels rattachés à ce département pourraient être impactés.",
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
            await deleteDepartment(id, selectedCenterOption.value);
        }
    };

    // Action : Modifier un département
    const handleEdit = (e: React.MouseEvent, dept: DepartmentDto) => {
        e.stopPropagation(); // Empêche l'ouverture du dossier lors du clic sur l'édition
        setSelectedDept(dept);
    };

    // Styles personnalisés pour React-Select (Dark Mode compatible)
    const selectStyles = {
        control: (base: any) => ({
            ...base,
            backgroundColor: 'transparent',
            borderColor: 'inherit',
            '&:hover': { borderColor: '#00a896' }
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : 'white',
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isFocused 
                ? (document.documentElement.classList.contains('dark') ? '#374151' : '#f1f5f9')
                : 'transparent',
            color: document.documentElement.classList.contains('dark') ? 'white' : 'black',
        }),
        singleValue: (base: any) => ({
            ...base,
            color: document.documentElement.classList.contains('dark') ? 'white' : 'black',
        })
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                        <LayoutGrid size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Départements Médicaux</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez les départements et explorez leurs installations.</p>
                    </div>
                </div>
                
                {/* Actions (Rafraîchir & Nouveau) */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={handleRefresh}
                        disabled={loading || !selectedCenterOption}
                        className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
                        title="Rafraîchir la liste"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin text-[#00a896]" : ""} />
                        <span className="hidden sm:inline">Rafraîchir</span>
                    </button>

                    <button 
                        disabled={!selectedCenterOption}
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center justify-center gap-2 bg-[#00a896] hover:bg-[#008f7e] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
                    >
                        <Plus size={18} />
                        Nouveau Département
                    </button>
                </div>
            </div>

            {/* SÉLECTEUR DE CENTRE & RECHERCHE */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Choix du centre */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Building2 size={14} /> Centre Médical Actif
                        </label>
                        <Select 
                            options={centerOptions}
                            value={selectedCenterOption}
                            onChange={setSelectedCenterOption}
                            placeholder="Sélectionnez un centre pour gérer ses départements..."
                            isClearable
                            styles={selectStyles}
                            className="react-select-container"
                            classNamePrefix="react-select"
                        />
                    </div>

                    {/* Recherche */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Search size={14} /> Recherche rapide
                        </label>
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Filtrer par nom ou alias..."
                                className="w-full pl-4 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ZONE EXPLORATEUR DE DOSSIERS */}
            <div className="bg-slate-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-800 min-h-[400px] p-6">
                {!selectedCenterOption ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                        <Building2 size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-xl font-medium text-slate-700 dark:text-gray-300">Aucun centre sélectionné</h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-sm">Veuillez choisir un centre médical ci-dessus pour explorer ses départements.</p>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center h-full py-20">
                        <Loader2 size={48} className="animate-spin text-[#00a896] mb-4" />
                        <p className="text-sm text-gray-500 uppercase tracking-widest font-medium">Chargement des dossiers...</p>
                    </div>
                ) : departments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                        <FolderOpen size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-lg text-slate-600 dark:text-gray-400 font-medium">Ce centre est vide.</p>
                        <p className="text-sm text-gray-500 mt-1">Créez un nouveau département pour commencer.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {departments.map((dept) => (
                            <div 
                                key={dept.id}
                                onClick={() => handleOpenFolder(dept)}
                                className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col hover:border-[#00a896] dark:hover:border-[#00a896] hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                            >
                                {/* Icône de dossier et nom */}
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg group-hover:bg-[#00a896]/10 group-hover:text-[#00a896] transition-colors">
                                        <Folder size={28} className="fill-current opacity-20" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-800 dark:text-gray-200 truncate" title={dept.name}>
                                            {dept.name}
                                        </h3>
                                        {dept.alias && (
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400 text-[10px] font-bold rounded uppercase tracking-wider">
                                                {dept.alias}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions rapides (Éditer / Supprimer) - Apparaissent au survol */}
                                <div className="mt-auto flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => handleEdit(e, dept)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                        title="Renommer / Modifier"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    <button 
                                        onClick={(e) => handleDelete(e, dept.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODALES */}
            {selectedCenterOption && (
                <CreateDepartmentModal 
                    isOpen={isCreateOpen} 
                    onClose={() => setIsCreateOpen(false)} 
                    centerId={selectedCenterOption.value} 
                />
            )}

            <UpdateDepartmentModal 
                isOpen={!!selectedDept} 
                onClose={() => setSelectedDept(null)} 
                department={selectedDept}
            />

        </div>
    );
};

export default Departments;