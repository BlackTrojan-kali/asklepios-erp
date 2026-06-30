import React, { useState, useEffect } from 'react';
import { X, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import useAdmissionStore from '../../../../functions/base_hospital/useAdmissionStore';
import type { AdmissionDto } from '../../../../types/AdmissionTypes';

interface DischargePatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    admission: AdmissionDto | null;
}

export const DischargePatientModal: React.FC<DischargePatientModalProps> = ({
    isOpen,
    onClose,
    admission
}) => {
    const { dischargePatient, actionLoading } = useAdmissionStore();
    const [dischargeNotes, setDischargeNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            setDischargeNotes('');
        }
    }, [isOpen]);

    if (!isOpen || !admission) return null;

    const handleSubmit = async () => {
        const success = await dischargePatient(admission.id, {
            discharge_notes: dischargeNotes.trim() || undefined
        });

        if (success) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl flex flex-col border border-gray-100 dark:border-gray-800">
                
                {/* HEADER */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500">
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                            <LogOut size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold font-brand">Autoriser la sortie</h2>
                            <p className="text-sm text-gray-500 font-medium">{admission.patient?.first_name} {admission.patient?.last_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 space-y-5">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-400 flex gap-3 items-start">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <p>
                            En confirmant la sortie, le <strong>Lit {admission.bed?.bed_number}</strong> sera libéré et passera automatiquement en statut <strong>"Nettoyage"</strong>. Il ne sera plus attribuable tant que l'entretien n'aura pas été validé.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">Notes de sortie (Optionnel)</label>
                        <textarea 
                            value={dischargeNotes} 
                            onChange={(e) => setDischargeNotes(e.target.value)}
                            placeholder="Instructions pour le retour à domicile, état de santé à la sortie..."
                            rows={4}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none dark:text-white"
                        />
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-900 rounded-b-2xl">
                    <button onClick={onClose} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors">
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={actionLoading}
                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-md"
                    >
                        {actionLoading ? "Traitement..." : "Valider la Sortie"}
                        {!actionLoading && <CheckCircle size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};