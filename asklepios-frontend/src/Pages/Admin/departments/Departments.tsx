import React, { useEffect, useState, useMemo } from 'react';
import Select from 'react-select';
import { 
    LayoutGrid, 
    Plus, 
    Search, 
    Edit3, 
    Trash2, 
    Building2, 
    Loader2, 
    Hash
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

    // Action : Supprimer un département
    const handleDelete = async (id: number) => {
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
                        <p className="text-sm text-gray-500 dark:text-gray-400">Configurez les services internes de chaque centre.</p>
                    </div>
                </div>
                
                <button 
                    disabled={!selectedCenterOption}
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 bg-[#00a896] hover:bg-[#008f7e] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={18} />
                    Nouveau Département
                </button>
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

            {/* LISTE DES DÉPARTEMENTS */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {!selectedCenterOption ? (
                    <div className="p-16 text-center">
                        <div className="max-w-xs mx-auto">
                            <Building2 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-lg font-medium text-slate-700 dark:text-gray-300">Aucun centre sélectionné</h3>
                            <p className="text-sm text-gray-500 mt-2">Veuillez choisir un centre médical ci-dessus pour afficher et gérer ses départements hospitaliers.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                    <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Nom du Département</th>
                                    <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Alias / Code</th>
                                    <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={3} className="p-12 text-center">
                                            <Loader2 size={32} className="animate-spin text-[#00a896] mx-auto mb-2" />
                                            <p className="text-xs text-gray-500 uppercase tracking-widest">Chargement...</p>
                                        </td>
                                    </tr>
                                ) : departments.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="p-12 text-center text-gray-500 dark:text-gray-400">
                                            Aucun département trouvé pour ce centre.
                                        </td>
                                    </tr>
                                ) : (
                                    departments.map((dept) => (
                                        <tr key={dept.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800 dark:text-gray-200">{dept.name}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Hash size={14} className="text-gray-400" />
                                                    <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded border border-indigo-100 dark:border-indigo-800 uppercase">
                                                        {dept.alias || '---'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button 
                                                        onClick={() => setSelectedDept(dept)} 
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(dept.id)} 
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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