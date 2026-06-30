import React, { useState, useEffect } from 'react';
import { 
    X, User, Activity, FileText, Pill, Stethoscope, 
    Download, Save, Loader2, Plus, TestTube, AlertTriangle, Edit, Syringe
} from 'lucide-react';
import toast from 'react-hot-toast';

// --- Types ---
import type { PatientVisitDto } from '../../../../types/PatientTypes';
import type { CreateConsultationPayload, PrescriptionLinePayload, PerformedMedicalActPayload } from '../../../../types/ConsultationTypes';

// --- Context & Stores ---
import { useAuth } from '../../../../contexts/AuthContext';
import useConsultationStore from '../../../../functions/base_hospital/useConsultationStore';
import useMedicalBgStore from '../../../../functions/base_hospital/useMedicalBgStore';
import useArticleStore from '../../../../functions/pharmacy/useArticleStore'; // Ajuste le chemin
import useMedicalActStore from '../../../../functions/base_hospital/useMedicalActStore'; // Ajuste le chemin
import useEquipmentStore from '../../../../functions/base_hospital/useEquipmentStore'; // Ajuste le chemin

// --- Modales Enfants ---
import { AddMedicationModal } from './AddMedicationModal'; 
import { AddExamModal } from './AddExamModal'; 
import { AddMedicalActModal } from './AddMedicalActModal'; // NOUVEAU
import { MedicalBackgroundModal } from './MedicalBackgroundModal'; 

interface ConsultationModalProps {
    isOpen: boolean;
    onClose: () => void;
    visit: PatientVisitDto | null;
    isHospitalization?: boolean; // <-- AJOUTER ICI
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
    isOpen,
    onClose,
    visit,
    isHospitalization = false // <-- AJOUTER ICI
}) => {
    const { profile } = useAuth();
    const departmentId = profile?.profile_doctor?.department_id || 0;

    // --- STORES ---
    const { createConsultation, actionLoading: isConsultingLoading } = useConsultationStore();
    const { downloadMedicalRecord } = useMedicalBgStore();
    
    // Chargement des catalogues
    const { getAllArticles, allArticles } = useArticleStore();
    const { getSharedMedicalActs, sharedMedicalActs } = useMedicalActStore();
    const { getSharedEquipment, sharedEquipment } = useEquipmentStore();

    // --- ÉTATS DU FORMULAIRE DE CONSULTATION ---
    const [chiefComplaint, setChiefComplaint] = useState('');
    const [clinicalNotes, setClinicalNotes] = useState(''); 
    
    // Paniers (Prescriptions, Examens, Actes)
    const [prescriptions, setPrescriptions] = useState<PrescriptionLinePayload[]>([]);
    const [exams, setExams] = useState<{exam_name: string}[]>([]);
    const [performedActs, setPerformedActs] = useState<PerformedMedicalActPayload[]>([]); // NOUVEAU

    // --- ÉTATS DES MODALES ENFANTS ---
    const [isAddMedModalOpen, setIsAddMedModalOpen] = useState(false);
    const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false);
    const [isAddActModalOpen, setIsAddActModalOpen] = useState(false); // NOUVEAU
    const [isMedicalBgModalOpen, setIsMedicalBgModalOpen] = useState(false);

    // --- INITIALISATION ---
    useEffect(() => {
        if (isOpen && visit) {
            // Reset du formulaire
            setChiefComplaint('');
            setClinicalNotes('');
            setPrescriptions([]);
            setExams([]);
            setPerformedActs([]);

            // Chargement de tous les catalogues nécessaires via les stores existants
            getAllArticles();
            if (departmentId) {
                getSharedMedicalActs(departmentId);
                getSharedEquipment(departmentId);
            }
        }
    }, [isOpen, visit, departmentId, getAllArticles, getSharedMedicalActs, getSharedEquipment]);

    if (!isOpen || !visit || !visit.patient) return null;

    const patient = visit.patient;
    const medicalBg = patient.medical_background;
console.log(patient)
    // --- ACTIONS ---
    const handleDownloadRecord = async () => {
        toast.promise(
            downloadMedicalRecord(patient.id, 'download'),
            {
                loading: 'Génération du carnet médical...',
                success: 'Téléchargement démarré !',
                error: 'Erreur lors du téléchargement.',
            }
        );
    };

    const handleSubmitConsultation = async () => {
        if (!chiefComplaint.trim()) {
            toast.error("Le motif de consultation est obligatoire.");
            return;
        }

        const payload: CreateConsultationPayload = {
            patient_visit_id: visit.id,
            chief_complaint: chiefComplaint,
            clinical_data: { notes: clinicalNotes },
            prescriptions: prescriptions,
            exams: exams,
            medical_acts: performedActs // Envoi des actes réalisés pour facturation
        };

        const success = await createConsultation(payload);
        if (success) {
            onClose();
        }
    };

    const removePrescription = (index: number) => setPrescriptions(prev => prev.filter((_, i) => i !== index));
    const removeExam = (index: number) => setExams(prev => prev.filter((_, i) => i !== index));
    const removeAct = (index: number) => setPerformedActs(prev => prev.filter((_, i) => i !== index));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            
            <div className="bg-[#faf8f1] dark:bg-gray-900 w-full max-w-[95vw] h-[95vh] rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800 overflow-hidden">
                
{/* --- HEADER GLOBAL --- */}
<div className="flex items-center justify-between p-4 bg-[#003366] text-white shrink-0">
    <div className="flex items-center gap-3">
        <Stethoscope size={24} className="text-[#00a896]" />
        <div>
            <h2 className="text-xl font-bold font-brand leading-tight">
                {isHospitalization ? "Visite d'hospitalisation" : "Consultation en cours"}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-blue-100 font-medium">{patient.first_name} {patient.last_name}</p>
                <span className="text-[10px] bg-blue-900/50 text-blue-200 px-1.5 py-0.5 rounded font-mono border border-blue-800">
                    {patient.patient_code} {/* CORRECTION ICI */}
                </span>
            </div>
        </div>
    </div>
    <div className="flex items-center gap-3">
        <button 
            onClick={handleDownloadRecord}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
        >
            <Download size={16} /> Carnet Médical
        </button>
        <button onClick={onClose} className="p-2 text-gray-300 hover:text-white hover:bg-red-500/20 rounded-full transition-colors">
            <X size={24} />
        </button>
    </div>
</div>
                {/* --- CORPS DE LA MODALE --- */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    
                    {/* COLONNE GAUCHE : DOSSIER PATIENT */}
                    <div className="w-full lg:w-1/3 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 flex flex-col overflow-y-auto custom-scrollbar">
                        
                        {/* Info Basique */}
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-16 w-16 rounded-full bg-[#00a896]/10 flex items-center justify-center text-[#00a896]">
                                    <User size={32} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-white font-brand">
                                        {patient.first_name} {patient.last_name}
                                    </h3>
                                    <p className="text-sm text-gray-500">{patient.gender === 'M' ? 'Homme' : 'Femme'} • {patient.birth_date || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Antécédents Médicaux */}
                        <div className="p-5 flex-1">
                            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                                <h4 className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300 font-brand uppercase tracking-wider text-xs">
                                    <Activity size={14} className="text-[#00a896]" /> Synthèse des Antécédents
                                </h4>
                                <button 
                                    onClick={() => setIsMedicalBgModalOpen(true)}
                                    className="flex items-center gap-1.5 text-xs font-bold text-[#003366] dark:text-blue-400 hover:underline"
                                >
                                    <Edit size={12} /> {medicalBg ? "Modifier" : "Créer le dossier"}
                                </button>
                            </div>
                            
                            {!medicalBg ? (
                                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 text-center">
                                    <AlertTriangle size={24} className="text-orange-500 mx-auto mb-2" />
                                    <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">Aucun dossier médical renseigné.</p>
                                    <button onClick={() => setIsMedicalBgModalOpen(true)} className="mt-2 text-xs font-bold bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-200">
                                        Initialiser maintenant
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-100 dark:border-gray-600">
                                        <span className="text-gray-500 font-medium">Groupe Sanguin</span>
                                        <span className="font-bold text-red-500">{medicalBg.blood_type || 'Inconnu'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 font-medium mb-1">Allergies</span>
                                        <div className="flex flex-wrap gap-1">
                                            {medicalBg.allergies?.length ? medicalBg.allergies.map((al, i) => (
                                                <span key={i} className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded text-xs font-bold">{al}</span>
                                            )) : <span className="text-gray-400 italic">Aucune</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 font-medium mb-1">Maladies chroniques</span>
                                        <p className="text-gray-800 dark:text-gray-200 font-medium bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-100 dark:border-gray-600">
                                            {medicalBg.chronic_conditions?.join(', ') || 'Néant'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLONNE DROITE : ESPACE DE TRAVAIL (Consultation) */}
                    <div className="flex-1 flex flex-col bg-[#faf8f1] dark:bg-gray-900">
                        <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
                            
                            {/* Bloc 1 : Motif et Notes */}
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h3 className="font-bold text-[#003366] dark:text-blue-400 mb-4 font-brand border-b border-gray-100 dark:border-gray-700 pb-2">1. Examen Clinique</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Motif principal de la visite <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            value={chiefComplaint}
                                            onChange={(e) => setChiefComplaint(e.target.value)}
                                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Notes de consultation</label>
                                        <textarea 
                                            value={clinicalNotes}
                                            onChange={(e) => setClinicalNotes(e.target.value)}
                                            rows={4}
                                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none resize-y dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bloc 2 : Actes Médicaux (Facturables) */}
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                                    <h3 className="font-bold text-[#003366] dark:text-blue-400 font-brand">2. Actes Médicaux Réalisés</h3>
                                    <button onClick={() => setIsAddActModalOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-[#00a896] hover:text-[#008f7f] bg-[#00a896]/10 px-3 py-1.5 rounded-lg transition-colors">
                                        <Plus size={16} /> Saisir un acte
                                    </button>
                                </div>
                                {performedActs.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic text-center py-2">Aucun acte médical facturable saisi.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {performedActs.map((act, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center gap-3">
                                                    <Syringe size={18} className="text-indigo-500" />
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                                            {sharedMedicalActs.find(a => a.id === act.medical_act_catalog_id)?.name || "Acte inconnu"}
                                                        </p>
                                                        <p className="text-xs text-gray-500">Tarif: {act.applied_price} FCFA {act.equipment_id && `(Équipement #${act.equipment_id})`}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeAct(idx)} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Bloc 3 : Ordonnance */}
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                                    <h3 className="font-bold text-[#003366] dark:text-blue-400 font-brand">3. Ordonnance (Prescriptions)</h3>
                                    <button onClick={() => setIsAddMedModalOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-[#00a896] hover:text-[#008f7f] bg-[#00a896]/10 px-3 py-1.5 rounded-lg transition-colors">
                                        <Plus size={16} /> Ajouter un médicament
                                    </button>
                                </div>
                                {prescriptions.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic text-center py-2">Aucun médicament prescrit.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {prescriptions.map((med, idx) => (
                                            <li key={idx} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <Pill size={18} className="text-gray-400 mt-0.5" />
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-800 dark:text-gray-200">
                                                            {med.custom_medication_name || allArticles.find(a => a.id === med.article_id)?.name || `Article #${med.article_id}`}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-wrap">{med.dosage}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => removePrescription(idx)} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Bloc 4 : Examens Labo */}
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                                    <h3 className="font-bold text-[#003366] dark:text-blue-400 font-brand">4. Demande d'Examens</h3>
                                    <button onClick={() => setIsAddExamModalOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-[#00a896] hover:text-[#008f7f] bg-[#00a896]/10 px-3 py-1.5 rounded-lg transition-colors">
                                        <Plus size={16} /> Prescrire un examen
                                    </button>
                                </div>
                                {exams.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic text-center py-2">Aucun examen demandé.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-3">
                                        {exams.map((exam, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-3 py-2 rounded-lg border border-purple-100 dark:border-purple-800 text-sm">
                                                <TestTube size={16} /> <span className="font-bold">{exam.exam_name}</span>
                                                <button onClick={() => removeExam(idx)} className="text-purple-400 hover:text-purple-600 ml-2"><X size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* --- FOOTER --- */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 flex justify-end gap-3 shrink-0">
                            <button onClick={onClose} disabled={isConsultingLoading} className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors">
                                Suspendre / Annuler
                            </button>
                            <button onClick={handleSubmitConsultation} disabled={isConsultingLoading || !chiefComplaint.trim()} className="px-8 py-3 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg disabled:opacity-50">
                                {isConsultingLoading ? <><Loader2 size={20} className="animate-spin" /> Enregistrement...</> : <><Save size={20} /> Valider la Consultation</>}
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* ================================================================= */}
            {/* MODALES ENFANTS (z-[60])                                          */}
            {/* ================================================================= */}
            
            <AddMedicationModal 
                isOpen={isAddMedModalOpen} 
                onClose={() => setIsAddMedModalOpen(false)} 
                onAdd={(med) => setPrescriptions(prev => [...prev, med])} 
                availableArticles={allArticles} // Alimenté par useArticleStore
            />

            <AddExamModal 
                isOpen={isAddExamModalOpen} 
                onClose={() => setIsAddExamModalOpen(false)} 
                onAdd={(exam) => setExams(prev => [...prev, exam])} 
            />

            <AddMedicalActModal 
                isOpen={isAddActModalOpen}
                onClose={() => setIsAddActModalOpen(false)}
                onAdd={(act) => setPerformedActs(prev => [...prev, act])}
                medicalActs={sharedMedicalActs} // Alimenté par useMedicalActStore
                equipments={sharedEquipment} // Alimenté par useEquipmentStore
            />

            <MedicalBackgroundModal
                isOpen={isMedicalBgModalOpen}
                onClose={() => setIsMedicalBgModalOpen(false)}
                patientId={patient.id}
                existingData={medicalBg}
            />
            
        </div>
    );
};