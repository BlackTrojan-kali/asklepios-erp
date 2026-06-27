import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { 
    Search, 
    X, 
    CalendarPlus, 
    Users, 
    CheckSquare, 
    Square, 
    ChevronLeft, 
    ChevronRight,
    Loader2,
    Phone,
    Fingerprint
} from 'lucide-react';
import toast from 'react-hot-toast';

// --- STORES ---
import usePatientStore from '../../../../functions/base_hospital/usePatientStore';
import useAppointmentStore from '../../../../functions/base_hospital/useAppointmentStore';

// --- TYPES ---
import type { PatientDto } from '../../../../types/PatientTypes';
import { PatientGender } from '../../../../types/PatientTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    currentCenterId: number;
    doctors: any[]; // ProfileDoctorDto[]
    prefilledDate?: Date | null; // Optionnel, si on veut pré-remplir la date
}

export const MultiPatientSchedulingModal: React.FC<Props> = ({ 
    isOpen, onClose, currentCenterId, doctors, prefilledDate 
}) => {
    // --- STORES ---
    const { patients, pagination, getPatients, loading: patientsLoading } = usePatientStore();
    const { createAppointment, actionLoading } = useAppointmentStore();

    // --- ÉTATS (RECHERCHE & SÉLECTION) ---
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [selectedPatients, setSelectedPatients] = useState<PatientDto[]>([]);

    // --- ÉTATS (FORMULAIRE) ---
    const [formDate, setFormDate] = useState('');
    const [formTime, setFormTime] = useState('');
    const [doctorId, setDoctorId] = useState<number | ''>('');
    const [reason, setReason] = useState('');

    // --- HELPER DE DATE ---
    const getLocalYYYYMMDD = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // --- INITIALISATION ---
    useEffect(() => {
        if (isOpen) {
            getPatients(1, { search: '' });
            setSearchQuery('');
            setPage(1);
            setSelectedPatients([]);
            setFormTime('');
            setDoctorId('');
            setReason('');
            
            if (prefilledDate) {
                setFormDate(getLocalYYYYMMDD(prefilledDate));
            } else {
                setFormDate(getLocalYYYYMMDD(new Date()));
            }
        }
    }, [isOpen, getPatients, prefilledDate]);

    // --- GESTION DE LA RECHERCHE ---
    // Un debounce manuel simple pour éviter de spammer l'API à chaque touche tapée
    useEffect(() => {
        if (!isOpen) return;
        const delayDebounceFn = setTimeout(() => {
            setPage(1);
            getPatients(1, { search: searchQuery });
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, getPatients, isOpen]);

    // --- GESTION DE LA SÉLECTION ---
    const togglePatientSelection = (patient: PatientDto) => {
        setSelectedPatients(prev => {
            const exists = prev.find(p => p.id === patient.id);
            if (exists) {
                return prev.filter(p => p.id !== patient.id);
            } else {
                return [...prev, patient];
            }
        });
    };

    const removePatient = (patientId: number) => {
        setSelectedPatients(prev => prev.filter(p => p.id !== patientId));
    };

    // --- SOUMISSION DE MASSE ---
    const handleSubmit = async () => {
        if (selectedPatients.length === 0 || !formDate || !formTime || !doctorId) return;

        const datetime = `${formDate} ${formTime}:00`;
        
        // On crée un tableau de promesses pour insérer tous les rendez-vous en parallèle
        const promises = selectedPatients.map(patient => 
            createAppointment({
                patient_id: patient.id,
                profile_doctor_id: doctorId,
                center_id: currentCenterId,
                scheduled_datetime: datetime,
                reason: reason
            })
        );

        try {
            // Attendre que toutes les requêtes soient terminées
            await Promise.all(promises);
            toast.success(`${selectedPatients.length} rendez-vous programmés avec succès !`);
            onClose();
        } catch (error) {
            toast.error("Une erreur est survenue lors de la programmation groupée.");
        }
    };

    // --- OPTIONS REACT-SELECT ---
    const doctorOptions = (doctors || []).map(d => ({ 
        value: d.id, 
        label: `Dr. ${d.user?.first_name || ''} ${d.user?.last_name || ''} (${d.department?.name || 'Généraliste'})` 
    }));

    const selectStyles = { 
        menuPortal: (b: any) => ({ ...b, zIndex: 9999 }), 
        singleValue: (b: any) => ({ ...b, color: '#000' }),
        input: (b: any) => ({ ...b, color: '#000' }) 
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-50 dark:bg-gray-900 rounded-2xl w-full max-w-6xl flex flex-col md:flex-row overflow-hidden shadow-2xl h-[85vh] md:h-[700px] animate-fadeIn">
                
                {/* ========================================= */}
                {/* COLONNE GAUCHE : SÉLECTION DES PATIENTS */}
                {/* ========================================= */}
                <div className="w-full md:w-1/2 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full overflow-hidden">
                    
                    {/* Header & Recherche */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                                <Users size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Sélection des Patients</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Recherchez et cochez les patients à programmer.</p>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={18} className="text-gray-400" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Rechercher par Code, Nom, Prénom ou Téléphone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-sm text-slate-800 dark:text-white transition-colors"
                            />
                        </div>
                    </div>

                    {/* Liste des Patients (Défilante) */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 dark:bg-transparent">
                        {patientsLoading && patients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                <Loader2 className="animate-spin mb-2" size={24} />
                                <p className="text-sm">Recherche en cours...</p>
                            </div>
                        ) : patients.length === 0 ? (
                            <div className="text-center p-6 text-gray-500 text-sm">
                                Aucun patient trouvé pour "{searchQuery}".
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {patients.map(patient => {
                                    const isSelected = selectedPatients.some(p => p.id === patient.id);
                                    return (
                                        <div 
                                            key={patient.id}
                                            onClick={() => togglePatientSelection(patient)}
                                            className={`p-3 rounded-xl border flex items-center gap-4 cursor-pointer transition-all ${
                                                isSelected 
                                                ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-900/20 dark:border-indigo-700' 
                                                : 'bg-white border-gray-200 hover:border-indigo-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-500'
                                            }`}
                                        >
                                            {/* Checkbox Icon */}
                                            <div className="shrink-0 text-indigo-600 dark:text-indigo-400">
                                                {isSelected ? <CheckSquare size={20} /> : <Square size={20} className="text-gray-300 dark:text-gray-600" />}
                                            </div>

                                            {/* Détails du patient */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm uppercase truncate">
                                                        {patient.first_name} {patient.last_name}
                                                    </h4>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300 font-medium whitespace-nowrap ml-2">
                                                        {patient.gender === PatientGender.MALE ? 'H' : patient.gender === PatientGender.FEMALE ? 'F' : 'Autre'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1 font-mono">
                                                        <Fingerprint size={12} /> {patient.patient_code}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Phone size={12} /> {patient.contact_phone}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Pagination (Mini) */}
                    {!patientsLoading && pagination && pagination.lastPage > 1 && (
                        <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center shrink-0">
                            <span className="text-xs text-gray-500">Page {pagination.currentPage} / {pagination.lastPage}</span>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => { setPage(page - 1); getPatients(page - 1, { search: searchQuery }); }}
                                    disabled={pagination.currentPage === 1}
                                    className="p-1.5 border border-gray-200 dark:border-gray-700 rounded text-gray-600 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-gray-800"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button 
                                    onClick={() => { setPage(page + 1); getPatients(page + 1, { search: searchQuery }); }}
                                    disabled={pagination.currentPage === pagination.lastPage}
                                    className="p-1.5 border border-gray-200 dark:border-gray-700 rounded text-gray-600 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-gray-800"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ========================================= */}
                {/* COLONNE DROITE : FORMULAIRE ET SÉLECTION */}
                {/* ========================================= */}
                <div className="w-full md:w-1/2 p-6 flex flex-col bg-slate-50 dark:bg-gray-800/50 relative h-full overflow-hidden">
                    
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>

                    <div className="mb-6 mt-2">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <CalendarPlus size={20} className="text-indigo-600" /> 
                            Programmer les rendez-vous
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                        
                        {/* Affichage des tags des patients sélectionnés */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                                Patients sélectionnés ({selectedPatients.length})
                            </label>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                                {selectedPatients.length === 0 ? (
                                    <span className="text-sm text-gray-400 italic p-1">Aucun patient sélectionné...</span>
                                ) : (
                                    selectedPatients.map(p => (
                                        <div key={p.id} className="flex items-center gap-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 px-2.5 py-1 rounded-md text-xs font-semibold border border-indigo-200 dark:border-indigo-800/50">
                                            <span>{p.first_name}</span>
                                            <button onClick={() => removePatient(p.id)} className="hover:text-red-500 focus:outline-none ml-1">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Paramètres du Rendez-vous */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Date commune <span className="text-red-500">*</span></label>
                                <input type="date" min={getLocalYYYYMMDD(new Date())} value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Heure <span className="text-red-500">*</span></label>
                                <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-slate-800 dark:text-white" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Médecin traitant <span className="text-red-500">*</span></label>
                            <Select 
                                options={doctorOptions} 
                                onChange={opt => setDoctorId(opt ? opt.value : '')} 
                                placeholder="Rechercher un docteur ou département..." 
                                menuPortalTarget={document.body} 
                                styles={selectStyles} 
                                className="text-sm"
                                isSearchable
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Motif global (Optionnel)</label>
                            <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: Campagne de dépistage, Visite médicale d'entreprise..." className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 text-slate-800 dark:text-white resize-none" />
                        </div>
                    </div>

                    {/* Bouton de soumission */}
                    <div className="pt-6 mt-auto border-t border-gray-200 dark:border-gray-700 shrink-0">
                        <button 
                            onClick={handleSubmit} 
                            disabled={selectedPatients.length === 0 || !formDate || !formTime || !doctorId || actionLoading} 
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold disabled:opacity-50 transition-colors shadow-lg flex justify-center items-center gap-2"
                        >
                            {actionLoading ? (
                                <><Loader2 size={20} className="animate-spin" /> Enregistrement en cours...</>
                            ) : (
                                `Programmer ${selectedPatients.length} rendez-vous`
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};