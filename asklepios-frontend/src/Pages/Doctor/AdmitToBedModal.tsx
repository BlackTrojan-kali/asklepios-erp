import React, { useState, useEffect } from 'react';
import { X, BedDouble, ArrowRightCircle, Search, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAdmissionStore from '../../functions/base_hospital/useAdmissionStore';
import api from '../../api/api';
import type { BedDto} from '../../types/BedTypes';

interface AdmitToBedModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: number; // Vaut 0 si on clique sur un lit vide
    patientName: string; // "Nouveau Patient" si vaut 0
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

    // --- ÉTATS DU FORMULAIRE ---
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [bedId, setBedId] = useState<number | ''>('');
    const [reason, setReason] = useState('');
    const [expectedDischarge, setExpectedDischarge] = useState('');

    // --- ÉTATS DE RECHERCHE PATIENT (Si admission depuis un lit vide) ---
    const [searchQuery, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Réinitialisation au montage/démontage
    useEffect(() => {
        if (isOpen) {
            setSelectedPatientId(patientId > 0 ? patientId : null);
            setBedId(availableBeds.length === 1 ? availableBeds[0].id : '');
            setReason('');
            setExpectedDischarge('');
            setSearchTerm('');
            setSearchResults([]);
        }
    }, [isOpen, patientId, availableBeds]);

    // Recherche asynchrone des patients (déclenchée par la saisie)
    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchQuery.trim().length < 2 || patientId > 0) return;
            
            try {
                setIsSearching(true);
                // Appel à ton endpoint de recherche de patients existant
                const res = await api.get('/shared/patients', { params: { search: searchQuery } });
                // S'adapte si ton API renvoie une pagination (.data.data) ou un tableau (.data)
                setSearchResults(res.data.data || res.data);
            } catch (error) {
                console.error("Erreur lors de la recherche du patient", error);
            } finally {
                setIsSearching(false);
            }
        }, 400); // Debounce de 400ms pour éviter de surcharger le serveur SQL

        return () => clearTimeout(delayDebounce);
    }, [searchQuery, patientId]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!selectedPatientId) {
            toast.error("Veuillez sélectionner un patient.");
            return;
        }
        if (!bedId || !reason.trim()) {
            toast.error("Veuillez sélectionner un lit et indiquer un motif.");
            return;
        }

        const success = await createAdmission({
            patient_id: selectedPatientId,
            bed_id: Number(bedId),
            reason_for_admission: reason.trim(),
            patient_visit_id: patientVisitId || null,
            profile_doctor_id: profileDoctorId || null,
            expected_discharge_date: expectedDischarge || null,
        });

        if (success) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col border border-gray-100 dark:border-gray-800 overflow-hidden">
                
                {/* HEADER */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex items-center gap-3 text-[#003366] dark:text-blue-400">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                            <BedDouble size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold font-brand">Admettre en hospitalisation</h2>
                            <p className="text-sm text-gray-500 font-medium">
                                {patientId > 0 ? patientName : "Sélection du patient et attribution du lit"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar max-h-[65vh]">
                    
                    {/* ENTRÉE 1 : SÉLECTEUR DE PATIENT (Affiché uniquement si patientId === 0) */}
                    {patientId === 0 && (
                        <div className="space-y-2 relative">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Rechercher le patient <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text"
                                    placeholder="Saisir le nom, prénom ou code patient..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        if (selectedPatientId) setSelectedPatientId(null); // Reset si on re-tape
                                    }}
                                    className="w-full pl-9 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white text-sm"
                                />
                                {isSearching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#00a896]" />}
                            </div>

                            {/* Liste déroulante des résultats de recherche */}
                            {searchQuery.trim().length >= 2 && !selectedPatientId && searchResults.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                    {searchResults.map((p) => (
                                        <div
                                            key={p.id}
                                            onClick={() => {
                                                setSelectedPatientId(p.id);
                                                setSearchTerm(`${p.first_name} ${p.last_name} (${p.code || p.id})`);
                                            }}
                                            className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer flex items-center gap-3 border-b last:border-0 dark:border-gray-700"
                                        >
                                            <User size={16} className="text-gray-400" />
                                            <div>
                                                <p className="text-sm font-bold text-gray-800 dark:text-white">{p.first_name} {p.last_name}</p>
                                                <p className="text-xs text-gray-400 font-mono">Code: {p.code || p.id} • Né(e) le: {p.birth_date || 'N/A'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ENTRÉE 2 : SELECTION DU LIT (Bloqué si un seul lit passé en paramètre) */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Lit d'hospitalisation <span className="text-red-500">*</span></label>
                        <select 
                            value={bedId} 
                            onChange={(e) => setBedId(e.target.value ? Number(e.target.value) : '')}
                            disabled={availableBeds.length === 1}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none transition-colors dark:text-white text-sm disabled:opacity-80 font-medium"
                        >
                            {availableBeds.map(bed => (
                                <option key={bed.id} value={bed.id}>
                                    Chambre {bed.facilityRoom?.name || room?.name || '?'} - Lit {bed.bed_number}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* ENTRÉE 3 : MOTIF */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Motif de l'hospitalisation <span className="text-red-500">*</span></label>
                        <textarea 
                            value={reason} 
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Symptômes cliniques, surveillance post-opératoire, isolement..."
                            rows={3}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none resize-none dark:text-white text-sm"
                        />
                    </div>

                    {/* ENTRÉE 4 : DATE PRÉVISIONNELLE */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Date de sortie prévisionnelle (Optionnel)</label>
                        <input 
                            type="date" 
                            value={expectedDischarge}
                            onChange={(e) => setExpectedDischarge(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white text-sm"
                        />
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-900 rounded-b-2xl shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg font-medium text-sm transition-colors">
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={actionLoading || !selectedPatientId || !bedId || !reason.trim()}
                        className="px-6 py-2.5 bg-[#00a896] hover:bg-[#008f7f] text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 shadow-md"
                    >
                        {actionLoading ? "Enregistrement..." : "Confirmer l'Admission"}
                        {!actionLoading && <ArrowRightCircle size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};