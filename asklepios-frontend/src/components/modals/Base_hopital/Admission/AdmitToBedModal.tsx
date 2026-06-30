import React, { useState, useEffect } from 'react';
import { X, BedDouble, ArrowRightCircle, Search, User, Loader2, CalendarDays, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import useAdmissionStore from '../../../../functions/base_hospital/useAdmissionStore';
import usePatientStore from '../../../../functions/base_hospital/usePatientStore';
import type { BedDto } from '../../../../types/AdmissionTypes';
import type { PatientDto } from '../../../../types/PatientTypes';

interface AdmitToBedModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: number; 
    patientName: string;
    availableBeds: BedDto[];
    patientVisitId?: number;
    profileDoctorId?: number;
}

export const AdmitToBedModal: React.FC<AdmitToBedModalProps> = ({
    isOpen,
    onClose,
    patientId,
    patientName,
    availableBeds,
    patientVisitId,
    profileDoctorId
}) => {
    const { createAdmission, actionLoading } = useAdmissionStore();
    const { getPatients, patients, loading: patientsLoading } = usePatientStore();

    const [bedId, setBedId] = useState<number | ''>('');
    const [reason, setReason] = useState('');
    const [expectedDischarge, setExpectedDischarge] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<PatientDto | null>(null);

    useEffect(() => {
        if (isOpen) {
            setBedId(availableBeds.length === 1 ? availableBeds[0].id : '');
            setReason('');
            setExpectedDischarge('');
            setSearchQuery('');
            setSelectedPatient(null);
            
            if (patientId === 0) {
                getPatients(1, {}, 50); 
            }
        }
    }, [isOpen, availableBeds, patientId, getPatients]);

    useEffect(() => {
        if (!isOpen || patientId > 0) return;
        const timer = setTimeout(() => {
            getPatients(1, { search: searchQuery }, 50);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery, isOpen, patientId, getPatients]);

    if (!isOpen) return null;

    const activePatientId = patientId > 0 ? patientId : selectedPatient?.id;
    const isSplitView = patientId === 0;

    const handleSubmit = async () => {
        if (!activePatientId) return toast.error("Veuillez d'abord sélectionner un patient dans la liste de gauche.");
        if (!bedId || !reason.trim()) return toast.error("Veuillez vérifier le lit et indiquer un motif médical.");

        const success = await createAdmission({
            patient_id: activePatientId, // Le backend utilise toujours l'ID entier
            bed_id: Number(bedId),
            reason_for_admission: reason.trim(),
            patient_visit_id: patientVisitId || null,
            profile_doctor_id: profileDoctorId || null,
            expected_discharge_date: expectedDischarge || null,
        });

        if (success) onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className={`bg-white dark:bg-gray-900 w-full rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${isSplitView ? 'max-w-5xl h-[85vh]' : 'max-w-lg'}`}>
                
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-[#003366] text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <BedDouble size={24} className="text-blue-300" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold font-brand">Nouvelle Admission</h2>
                            <p className="text-xs text-blue-200">
                                {isSplitView ? "Recherche de dossier et attribution de lit" : `Patient : ${patientName}`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className={`flex-1 flex overflow-hidden ${isSplitView ? 'flex-col md:flex-row' : 'flex-col'}`}>
                    
                    {isSplitView && (
                        <div className="w-full md:w-5/12 lg:w-2/5 border-r border-gray-100 dark:border-gray-800 flex flex-col bg-slate-50 dark:bg-gray-900/50">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10 shadow-sm">
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text"
                                        placeholder="Filtrer par nom ou code patient..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none dark:text-white text-sm transition-all"
                                    />
                                    {patientsLoading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#00a896]" />}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                {patientsLoading && patients.length === 0 ? (
                                    <div className="flex justify-center p-8"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
                                ) : patients.length === 0 ? (
                                    <p className="text-center text-sm text-gray-500 py-8">Aucun patient trouvé.</p>
                                ) : (
                                    patients.map(p => {
                                        const isSelected = selectedPatient?.id === p.id;
                                        return (
                                            <div 
                                                key={p.id}
                                                onClick={() => setSelectedPatient(p)}
                                                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                                                    isSelected 
                                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 shadow-sm' 
                                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-[#00a896]'
                                                }`}
                                            >
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-200' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'}`}>
                                                    <User size={20} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-800 dark:text-gray-200'}`}>
                                                        {p.first_name} {p.last_name}
                                                    </h4>
                                                    {/* CORRECTION ICI */}
                                                    <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">Code: {p.patient_code}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative">
                        {isSplitView && !selectedPatient && (
                            <div className="absolute inset-0 z-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                                <div className="h-20 w-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                    <User size={40} className="text-gray-300 dark:text-gray-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Sélection requise</h3>
                                <p className="text-sm text-gray-500 max-w-sm">Veuillez sélectionner un patient dans la liste de gauche pour procéder à son admission dans ce lit.</p>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {isSplitView && selectedPatient && (
                                <div className="bg-[#faf8f1] dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                                    <div className="h-12 w-12 bg-[#00a896]/10 text-[#00a896] rounded-full flex items-center justify-center">
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Dossier Actif</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-800 dark:text-white text-lg font-brand">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                                            {/* CORRECTION ICI */}
                                            <span className="text-xs font-mono bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded text-gray-500">{selectedPatient.patient_code}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">Attribution du lit <span className="text-red-500">*</span></label>
                                <select 
                                    value={bedId} 
                                    onChange={(e) => setBedId(e.target.value ? Number(e.target.value) : '')}
                                    disabled={availableBeds.length === 1}
                                    className="w-full p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#00a896] outline-none transition-colors dark:text-white disabled:opacity-80 font-medium"
                                >
                                    <option value="">-- Sélectionner un lit --</option>
                                    {availableBeds.map(bed => (
                                        <option key={bed.id} value={bed.id}>
                                            Chambre {bed.facilityRoom?.name || '?'} - Lit {bed.bed_number}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">Motif de l'hospitalisation <span className="text-red-500">*</span></label>
                                <textarea 
                                    value={reason} 
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Décrivez les symptômes, le plan de soins ou la raison de la mise en observation..."
                                    rows={4}
                                    className="w-full p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#00a896] outline-none resize-none dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">Sortie prévisionnelle <span className="text-gray-400 font-normal text-xs">(Optionnel)</span></label>
                                <div className="relative">
                                    <CalendarDays size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="date" 
                                        value={expectedDischarge}
                                        onChange={(e) => setExpectedDischarge(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]} 
                                        className="w-full pl-10 pr-3.5 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-900 shrink-0">
                            <button onClick={onClose} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors">
                                Annuler
                            </button>
                            <button 
                                onClick={handleSubmit} 
                                disabled={actionLoading || !activePatientId || !bedId || !reason.trim()}
                                className="px-6 py-2.5 bg-[#00a896] hover:bg-[#008f7f] text-white rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg"
                            >
                                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRightCircle size={18} />}
                                {actionLoading ? "Traitement..." : "Confirmer l'Hospitalisation"}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};