import React, { useEffect } from 'react';
import { X, CalendarDays, FileText, Activity, Pill, TestTube, Download, Syringe } from 'lucide-react';
import useConsultationStore from '../../../../functions/base_hospital/useConsultationStore';
import useMedicalBgStore from '../../../../functions/base_hospital/useMedicalBgStore';
import toast from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    consultationId: number | null;
}

export const PastConsultationPreviewModal: React.FC<Props> = ({ isOpen, onClose, consultationId }) => {
    const { currentConsultation, getConsultationDetails, loading } = useConsultationStore();
    const { downloadMedicalRecord } = useMedicalBgStore();

    useEffect(() => {
        if (isOpen && consultationId) {
            getConsultationDetails(consultationId);
        }
    }, [isOpen, consultationId, getConsultationDetails]);

    if (!isOpen) return null;

    const handleDownloadRecord = () => {
        if (currentConsultation?.patient_visit?.patient?.id) {
            toast.promise(
                downloadMedicalRecord(currentConsultation.patient_visit.patient.id, 'download'),
                { loading: 'Génération...', success: 'Téléchargement démarré !', error: 'Erreur' }
            );
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-[#faf8f1] dark:bg-gray-900 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800 overflow-hidden">
                
                {/* HEADER */}
                <div className="flex items-center justify-between p-5 bg-[#003366] text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <FileText size={24} className="text-[#00a896]" />
                        <div>
                            <h2 className="text-xl font-bold font-brand">Détails de la consultation</h2>
                            {currentConsultation && (
                                <p className="text-sm text-blue-200 flex items-center gap-1">
                                    <CalendarDays size={14}/> {new Date(currentConsultation.created_at).toLocaleDateString('fr-FR')} 
                                    - {currentConsultation.patient_visit?.patient?.first_name} {currentConsultation.patient_visit?.patient?.last_name}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleDownloadRecord} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                            <Download size={16} /> Carnet Complet
                        </button>
                        <button onClick={onClose} className="p-2 text-gray-300 hover:text-white hover:bg-red-500/20 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {loading || !currentConsultation ? (
                        <div className="flex justify-center py-20"><Activity className="animate-spin text-[#00a896]" size={40} /></div>
                    ) : (
                        <>
                            {/* Notes Cliniques */}
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="font-bold text-[#003366] dark:text-blue-400 mb-3 border-b pb-2">1. Examen Clinique</h3>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Motif : <span className="font-normal">{currentConsultation.chief_complaint}</span></p>
                                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded">
                                    {currentConsultation.clinical_data?.notes ? currentConsultation.clinical_data.notes.replace(/<[^>]*>/g, '') : "Aucune note."}
                                </div>
                            </div>

                            {/* Actes Médicaux */}
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="font-bold text-[#003366] dark:text-blue-400 mb-3 border-b pb-2">2. Actes Médicaux Réalisés</h3>
                                {currentConsultation.patient_visit?.performed_medical_acts?.length > 0 ? (
                                    <ul className="space-y-2">
                                        {currentConsultation.patient_visit.performed_medical_acts.map((act: any) => (
                                            <li key={act.id} className="flex items-center gap-3 text-sm p-2 bg-gray-50 rounded border">
                                                <Syringe size={16} className="text-indigo-500" />
                                                <span className="font-bold">{act.medical_act_catalog?.name || "Acte"}</span> 
                                                <span className="text-gray-500">- {act.applied_price} FCFA</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-sm text-gray-500 italic">Aucun acte facturable enregistré.</p>}
                            </div>

                            {/* Ordonnance */}
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="font-bold text-[#003366] dark:text-blue-400 mb-3 border-b pb-2">3. Ordonnance</h3>
                                {currentConsultation.prescriptions?.length > 0 ? (
                                    <ul className="space-y-2">
                                        {currentConsultation.prescriptions.map((presc: any) => 
                                            presc.prescription_lines?.map((line: any) => (
                                                <li key={line.id} className="flex items-start gap-3 text-sm p-2 bg-blue-50/50 rounded border">
                                                    <Pill size={16} className="text-blue-500 mt-0.5" />
                                                    <div>
                                                        <p className="font-bold">{line.custom_medication_name || "Médicament"}</p>
                                                        <p className="text-gray-600 text-xs">{line.dosage}</p>
                                                    </div>
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                ) : <p className="text-sm text-gray-500 italic">Aucune prescription.</p>}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};