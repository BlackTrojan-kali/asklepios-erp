import React, { useState, useEffect } from 'react';
import { X, Save, Activity, User, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { PatientDto } from '../../../../types/PatientTypes';
import { useLabTests } from '../../../../hooks/laboratory/useLabTest';
import { useCreateLabRequest } from '../../../../hooks/laboratory/useLabRequest';
import usePatientStore from '../../../../functions/base_hospital/usePatientStore';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    preselectedPatient: PatientDto | null;
}

export const CreateLabRequestModal: React.FC<Props> = ({ isOpen, onClose, preselectedPatient }) => {
    const { allPatients, getAllPatients } = usePatientStore();
    const { data: labTests, isLoading: loadingTests } = useLabTests();
    const createMutation = useCreateLabRequest();

    const [patientId, setPatientId] = useState<number | ''>('');
    const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);
    const [priority, setPriority] = useState<'ROUTINE' | 'URGENT'>('ROUTINE');
    const [prescriber, setPrescriber] = useState('');

    useEffect(() => {
        if (isOpen) {
            getAllPatients();
            if (preselectedPatient) {
                setPatientId(preselectedPatient.id);
            }
        }
    }, [isOpen, preselectedPatient, getAllPatients]);

    if (!isOpen) return null;

    const handleTestToggle = (testId: number) => {
        setSelectedTestIds(prev => 
            prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId) {
            toast.error("Veuillez sélectionner un patient");
            return;
        }
        if (selectedTestIds.length === 0) {
            toast.error("Veuillez sélectionner au moins un examen");
            return;
        }

        try {
            await createMutation.mutateAsync({
                patient_id: Number(patientId),
                test_ids: selectedTestIds,
                priority,
                external_prescriber_name: prescriber || undefined
            });
            toast.success("Demande d'examen créée avec succès");
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Erreur lors de la création");
        }
    };

    const totalAmount = selectedTestIds.reduce((sum, testId) => {
        const test = labTests?.find(t => t.id === testId);
        return sum + (test ? test.price : 0);
    }, 0);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                        <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        Nouvelle Demande d'Examen
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <form id="create-lab-request-form" onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                                <User className="w-4 h-4" /> Informations Patient
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Patient *</label>
                                    <select
                                        value={patientId}
                                        onChange={(e) => setPatientId(Number(e.target.value))}
                                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        required
                                        disabled={!!preselectedPatient}
                                    >
                                        <option value="">Sélectionner un patient</option>
                                        {allPatients.map(p => (
                                            <option key={p.id} value={p.id}>{p.patient_code} - {p.first_name} {p.last_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prescripteur Externe</label>
                                    <input
                                        type="text"
                                        value={prescriber}
                                        onChange={(e) => setPrescriber(e.target.value)}
                                        placeholder="Ex: Dr. Dupont"
                                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> Examens à Réaliser *
                                </h3>
                                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    Priorité:
                                    <select 
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as any)}
                                        className="ml-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 outline-none text-slate-800 dark:text-white"
                                    >
                                        <option value="ROUTINE">Routine</option>
                                        <option value="URGENT">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            {loadingTests ? (
                                <p className="text-slate-500 text-sm">Chargement des examens...</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2">
                                    {labTests?.map(test => (
                                        <label key={test.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedTestIds.includes(test.id) ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedTestIds.includes(test.id)}
                                                onChange={() => handleTestToggle(test.id)}
                                                className="mt-1 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{test.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{test.price.toLocaleString()} FCFA</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                    </form>
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <div className="text-lg font-bold text-slate-800 dark:text-white">
                        Total : <span className="text-indigo-600 dark:text-indigo-400">{totalAmount.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            form="create-lab-request-form"
                            disabled={createMutation.isPending}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {createMutation.isPending ? "Création..." : "Générer la Facture"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
