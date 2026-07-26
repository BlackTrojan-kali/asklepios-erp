import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { 
    ShieldCheck, ShieldPlus, X, Loader2, FileText, Calendar, Percent, 
    Activity, Edit2, Trash2, Plus, ShieldAlert 
} from 'lucide-react';
import useCoveragesStore from '../../../functions/insurance/useCoveragesStore';
import type { PatientCoverageDto, InsuranceCompanyDto, CoverageScopeType } from '../../../types/InsuranceTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    patientId: number; 
    insurances: InsuranceCompanyDto[]; 
    AutoRefreshPage: () => void;
}

export const ManagePatientCoverageModal: React.FC<Props> = ({ 
    isOpen, 
    onClose, 
    patientId,
    insurances,
    AutoRefreshPage 
}) => {
    const { 
        coverages, 
        loading, 
        actionLoading, 
        getPatientCoverages, 
        addCoverage, 
        updateCoverage, 
        deleteCoverage 
    } = useCoveragesStore();

    // États du formulaire
    const [editingId, setEditingId] = useState<number | null>(null);
    const [insuranceId, setInsuranceId] = useState<number | ''>('');
    const [policyNumber, setPolicyNumber] = useState('');
    const [coverageRate, setCoverageRate] = useState<number | ''>('');
    const [validUntil, setValidUntil] = useState('');
    const [isActive, setIsActive] = useState<boolean>(true);
    const [priorityOrder, setPriorityOrder] = useState<number>(1);
    // L'ÉTAT EST MAINTENANT UN TABLEAU
    const [coverageScope, setCoverageScope] = useState<string[]>(['consultation']);

    const isEditMode = editingId !== null;

    useEffect(() => {
        if (isOpen && patientId) {
            getPatientCoverages(patientId);
            resetForm();
        }
    }, [isOpen, patientId, getPatientCoverages]);

    const resetForm = () => {
        setEditingId(null);
        setInsuranceId('');
        setPolicyNumber('');
        setCoverageRate('');
        setValidUntil('');
        setIsActive(true);
        setPriorityOrder(1);
        setCoverageScope(['consultation']); // Réinitialisation avec un tableau
    };

    const handleEditClick = (cov: PatientCoverageDto) => {
        setEditingId(cov.id);
        setInsuranceId(cov.insurance_company_id || '');
        setPolicyNumber(cov.policy_number || '');
        setCoverageRate(cov.coverage_rate || '');
        setPriorityOrder(cov.priority_order || 1);
        
        // S'assurer qu'on reçoit bien un tableau (sécurité supplémentaire)
        setCoverageScope(Array.isArray(cov.coverage_scope) ? cov.coverage_scope : ['consultation']);
        
        if (cov.valid_until) {
            const dateObj = new Date(cov.valid_until);
            setValidUntil(dateObj.toISOString().split('T')[0]);
        } else {
            setValidUntil('');
        }
        
        setIsActive(cov.is_active ?? true);
    };

    const handleDeleteClick = async (id: number) => {
        if (window.confirm("Êtes-vous sûr de vouloir retirer cette assurance pour ce patient ?")) {
            const success = await deleteCoverage(id);
            if (success) {
                if (editingId === id) resetForm();
                getPatientCoverages(patientId);
                AutoRefreshPage();
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation basique (au moins un périmètre doit être sélectionné)
        if (!insuranceId || !policyNumber.trim() || coverageRate === '' || !validUntil || coverageScope.length === 0) return;

        const payload: any = {
            valid_until: validUntil,
            is_active: isActive,
            policy_number: policyNumber.trim(),
            coverage_rate: Number(coverageRate),
            priority_order: priorityOrder,
            coverage_scope: coverageScope, // On envoie le tableau directement
        };

        let success = false;
        
        if (isEditMode && editingId) {
            success = await updateCoverage(editingId, payload);
        } else {
            payload.patient_id = patientId;
            payload.insurance_company_id = Number(insuranceId);
            success = await addCoverage(payload);
        }

        if (success) {
            getPatientCoverages(patientId); 
            resetForm(); 
            AutoRefreshPage();
        }
    };

    // --- Options pour les Selects ---
    const insuranceOptions = insurances.map(ins => ({
        value: ins.id,
        label: ins.name
    }));

    const priorityOptions = [
        { value: 1, label: '1 - Principale' },
        { value: 2, label: '2 - Secondaire (Complémentaire)' },
        { value: 3, label: '3 - Tertiaire' },
    ];

    const scopeOptions = [
        { value: 'consultation', label: 'Consultations Médicales' },
        { value: 'pharmacy', label: 'Pharmacie' },
        { value: 'lab', label: 'Laboratoire (Examens)' },
    ];

    // --- STYLES FORCÉS POUR REACT-SELECT (Support Multi-Select) ---
    const selectStyles = { 
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
        control: (base: any, state: any) => ({
            ...base,
            backgroundColor: '#ffffff',
            borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
            boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
            borderRadius: '0.5rem',
            minHeight: '42px',
        }),
        menu: (base: any) => ({ ...base, backgroundColor: '#ffffff', borderRadius: '0.5rem' }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected ? '#eff6ff' : state.isFocused ? '#f3f4f6' : '#ffffff',
            color: state.isSelected ? '#2563eb' : '#000000',
            cursor: 'pointer',
        }),
        singleValue: (base: any) => ({ ...base, color: '#000000' }),
        input: (base: any) => ({ ...base, color: '#000000' }),
        placeholder: (base: any) => ({ ...base, color: '#6b7280' }),
        // Styles spécifiques au multi-select
        multiValue: (base: any) => ({ ...base, backgroundColor: '#e0e7ff', borderRadius: '0.375rem' }),
        multiValueLabel: (base: any) => ({ ...base, color: '#3730a3', fontWeight: 'bold', fontSize: '0.75rem' }),
        multiValueRemove: (base: any) => ({ ...base, color: '#4f46e5', ':hover': { backgroundColor: '#c7d2fe', color: '#312e81' } }),
    };

    // Helper pour afficher le bon nom du périmètre dans les badges
    const getScopeLabel = (val: string) => {
        if (val === 'consultation') return 'Consultation';
        if (val === 'pharmacy') return 'Pharmacie';
        if (val === 'lab') return 'Labo';
        return val;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-5xl shadow-2xl border border-transparent dark:border-gray-800 flex flex-col h-[85vh] max-h-[800px]">
                
                {/* EN-TÊTE */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                Gestion des Assurances du Patient
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                Consultez, ajoutez ou modifiez les couvertures liées à ce dossier.
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* CORPS */}
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    
                    {/* GAUCHE : LISTE DES COUVERTURES */}
                    <div className="w-full md:w-1/2 bg-slate-50 dark:bg-gray-900/50 border-r border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 shrink-0">
                            <h3 className="font-bold text-slate-700 dark:text-gray-200">Couvertures enregistrées</h3>
                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 py-0.5 px-2.5 rounded-full text-xs font-bold">
                                {coverages?.length || 0}
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <Loader2 className="animate-spin mb-2" size={24} />
                                </div>
                            ) : coverages?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 text-center px-4">
                                    <ShieldAlert size={40} className="mb-3 opacity-30" />
                                    <p className="text-sm font-medium">Aucune assurance trouvée.</p>
                                    <p className="text-xs mt-1">Utilisez le formulaire pour en ajouter une.</p>
                                </div>
                            ) : (
                                coverages.map((cov) => (
                                    <div key={cov.id} className={`p-4 rounded-xl border transition-all ${editingId === cov.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'} shadow-sm relative group`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${cov.priority_order === 1 ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                    Ordre {cov.priority_order}
                                                </span>
                                                
                                                {/* AFFICHAGE MULTIPLE DES BADGES DE PÉRIMÈTRES */}
                                                {Array.isArray(cov.coverage_scope) && cov.coverage_scope.map((scope) => (
                                                    <span key={scope} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 text-[10px] font-black uppercase">
                                                        {getScopeLabel(scope)}
                                                    </span>
                                                ))}

                                                {!cov.is_active && (
                                                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-black uppercase">Inactif</span>
                                                )}
                                            </div>
                                            
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditClick(cov)} className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-md transition-colors">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDeleteClick(cov.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <h4 className="font-bold text-slate-800 dark:text-white truncate">
                                            {cov.insurance_company?.name || `Assurance #${cov.insurance_company_id}`}
                                        </h4>
                                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 grid grid-cols-2 gap-y-1">
                                            <div><span className="text-gray-400 text-xs">Matricule:</span> {cov.policy_number}</div>
                                            <div><span className="text-gray-400 text-xs">Taux:</span> {cov.coverage_rate}%</div>
                                            <div className="col-span-2"><span className="text-gray-400 text-xs">Valide jusqu'au:</span> {cov.valid_until ? new Date(cov.valid_until).toLocaleDateString() : 'N/A'}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* DROITE : FORMULAIRE */}
                    <div className="w-full md:w-1/2 flex flex-col bg-white dark:bg-gray-900">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
                            <h3 className={`font-bold flex items-center gap-2 ${isEditMode ? 'text-amber-600' : 'text-blue-600'}`}>
                                {isEditMode ? <><Edit2 size={18}/> Mode Édition</> : <><ShieldPlus size={18}/> Nouvelle Couverture</>}
                            </h3>
                            {isEditMode && (
                                <button type="button" onClick={resetForm} className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium">
                                    <Plus size={14}/> Basculer en création
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                    <ShieldCheck size={16} className="text-blue-500"/> Compagnie d'Assurance <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    options={insuranceOptions}
                                    value={insuranceOptions.find(opt => opt.value === insuranceId) || null}
                                    onChange={(opt) => setInsuranceId(opt ? opt.value : '')}
                                    placeholder="Sélectionner l'assurance..."
                                    menuPortalTarget={document.body}
                                    styles={selectStyles}
                                    isDisabled={isEditMode}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                    <Activity size={16} className="text-blue-500"/> Périmètre de couverture <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    isMulti // ACTIVER LA SÉLECTION MULTIPLE ICI
                                    options={scopeOptions}
                                    // Filtrer pour retrouver les objets correspondants au tableau de strings actuel
                                    value={scopeOptions.filter(opt => coverageScope.includes(opt.value))}
                                    // Extraire les valeurs (strings) des objets sélectionnés et les mettre dans le state
                                    onChange={(selectedOptions) => {
                                        setCoverageScope(selectedOptions ? selectedOptions.map(opt => opt.value) : []);
                                    }}
                                    placeholder="Sélectionner un ou plusieurs périmètres..."
                                    menuPortalTarget={document.body}
                                    styles={selectStyles}
                                    closeMenuOnSelect={false} // Garder le menu ouvert pour sélectionner plusieurs options
                                />
                                {coverageScope.length === 0 && <p className="text-xs text-red-500 mt-1 font-medium">Veuillez sélectionner au moins un périmètre.</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                    <ShieldPlus size={16} className="text-blue-500"/> Ordre de priorité <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    options={priorityOptions}
                                    value={priorityOptions.find(opt => opt.value === priorityOrder) || priorityOptions[0]}
                                    onChange={(opt) => setPriorityOrder(opt ? opt.value : 1)}
                                    placeholder="Sélectionner la priorité..."
                                    menuPortalTarget={document.body}
                                    styles={selectStyles}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                        <FileText size={14} className="text-gray-400"/> Matricule / N° Police <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        value={policyNumber} 
                                        onChange={e => setPolicyNumber(e.target.value)} 
                                        placeholder="Ex: MAT-123456"
                                        className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-blue-500 outline-none text-slate-800 dark:text-white uppercase" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                        <Percent size={14} className="text-gray-400"/> Taux de couverture <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="number" 
                                        value={coverageRate} 
                                        onChange={e => setCoverageRate(e.target.value !== '' ? Number(e.target.value) : '')} 
                                        min="0" max="100" step="0.01" placeholder="Ex: 80"
                                        className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-blue-500 outline-none text-slate-800 dark:text-white" 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                        <Calendar size={14} className="text-gray-400"/> Valide jusqu'au <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="date" 
                                        value={validUntil} 
                                        onChange={e => setValidUntil(e.target.value)} 
                                        className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-blue-500 outline-none text-slate-800 dark:text-white" 
                                        required 
                                    />
                                </div>
                                
                                <div className="flex flex-col justify-center">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                        <Activity size={14} className="text-gray-400"/> Statut Actuel
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only" checked={isActive} onChange={() => setIsActive(!isActive)} />
                                            <div className={`block w-14 h-8 rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isActive ? 'transform translate-x-6' : ''}`}></div>
                                        </div>
                                        <span className={`ml-3 text-sm font-bold ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {isActive ? 'Couverture Active' : 'Suspendue'}
                                        </span>
                                    </label>
                                </div>
                            </div>

                        </form>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 shrink-0 bg-slate-50 dark:bg-gray-900/50 flex justify-end">
                            <button 
                                onClick={handleSubmit}
                                disabled={actionLoading || !insuranceId || !policyNumber.trim() || coverageRate === '' || !validUntil || coverageScope.length === 0}
                                className={`px-6 py-2.5 text-white rounded-xl font-bold flex items-center gap-2 shadow-md transition-colors disabled:opacity-50 ${isEditMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {actionLoading ? (
                                    <><Loader2 size={18} className="animate-spin" /> Enregistrement...</>
                                ) : (
                                    isEditMode ? "Enregistrer les modifications" : "Ajouter la couverture"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};