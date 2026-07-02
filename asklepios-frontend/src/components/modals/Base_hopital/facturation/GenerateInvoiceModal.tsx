import React, { useState, useEffect } from 'react';
import { 
    X, Search, User, FileText, Calculator, 
    ArrowRightCircle, Loader2, Receipt, ChevronLeft, ChevronRight, BedDouble, Stethoscope, Syringe
} from 'lucide-react';
import toast from 'react-hot-toast';
import usePatientStore from '../../../../functions/base_hospital/usePatientStore';
import useInvoiceStore from '../../../../functions/base_hospital/useInvoiceStore';
import api from '../../../../api/api'; 
import type { PatientDto } from '../../../../types/PatientTypes';

interface GenerateInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface UnbilledPreview {
    unbilled_consultations_count: number;
    unbilled_acts_total: number;
    unbilled_admissions_total: number;
    total_without_consultation: number;
}

export const GenerateInvoiceModal: React.FC<GenerateInvoiceModalProps> = ({ isOpen, onClose }) => {
    // --- STORES ---
    const { getPatients, patients, pagination, loading: patientsLoading } = usePatientStore();
    const { generateInvoiceForPatient, actionLoading } = useInvoiceStore();

    // --- ÉTATS GAUCHE (Recherche & Pagination) ---
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [selectedPatient, setSelectedPatient] = useState<PatientDto | null>(null);

    // --- ÉTATS DROITE (Facturation globale du patient) ---
    const [consultationPrice, setConsultationPrice] = useState<number>(0);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewData, setPreviewData] = useState<UnbilledPreview | null>(null);

    // 1. Initialisation & Chargement des patients
    useEffect(() => {
        if (isOpen) {
            getPatients(page, { search: searchQuery }, 10); // 10 par page
        }
    }, [isOpen, page, searchQuery, getPatients]);

    // Réinitialisation de la modale à l'ouverture
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setPage(1);
            setSelectedPatient(null);
            setPreviewData(null);
            setConsultationPrice(0);
        }
    }, [isOpen]);

    // 2. Sélection d'un patient
    const handleSelectPatient = (patient: PatientDto) => {
        setSelectedPatient(patient);
        setConsultationPrice(0);
        fetchPatientPreview(patient.id);
    };

    const fetchPatientPreview = async (patientId: number) => {
        try {
            setPreviewLoading(true);
            const res = await api.get(`/shared/patients/${patientId}/unbilled-preview`);
            setPreviewData(res.data);
        } catch (error) {
            setPreviewData(null);
            toast.error("Impossible de charger les impayés de ce patient.");
        } finally {
            setPreviewLoading(false);
        }
    };

    // 3. Calcul dynamique
    const calculateDynamicTotal = () => {
        if (!previewData) return 0;
        const consultTotal = (previewData.unbilled_consultations_count || 0) * (consultationPrice || 0);
        return previewData.total_without_consultation + consultTotal;
    };

    // 4. Génération de la facture globale
    const handleSubmit = async () => {
        if (!selectedPatient) return toast.error("Veuillez sélectionner un patient.");
        
        if (calculateDynamicTotal() === 0 && previewData?.unbilled_consultations_count === 0) {
            return toast.error("Ce patient n'a aucun soin en attente de facturation.");
        }

        const invoice = await generateInvoiceForPatient(selectedPatient.id, {
            consultation_price: consultationPrice
        });

        if (invoice) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* --- HEADER --- */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-[#003366] text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <Receipt size={24} className="text-[#00a896]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold font-brand">Facturation Patient</h2>
                            <p className="text-xs text-blue-200">Regroupe tous les soins non facturés du patient (Consultations, Actes, Lits)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    
                    {/* ==================================================== */}
                    {/* GAUCHE : RECHERCHE ET LISTE PAGINÉE                  */}
                    {/* ==================================================== */}
                    <div className="w-full md:w-5/12 border-r border-gray-100 dark:border-gray-800 flex flex-col bg-slate-50 dark:bg-gray-900/50">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10 shadow-sm">
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text"
                                    placeholder="Nom ou Code (Ex: P-1234)..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white text-sm"
                                />
                                {patientsLoading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#00a896]" />}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            {patients.length === 0 && !patientsLoading ? (
                                <p className="text-center text-sm text-gray-500 py-8">Aucun patient trouvé.</p>
                            ) : (
                                patients.map(p => {
                                    const isSelected = selectedPatient?.id === p.id;
                                    return (
                                        <div 
                                            key={p.id}
                                            onClick={() => handleSelectPatient(p)}
                                            className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                                                isSelected 
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 shadow-sm' 
                                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-[#00a896]'
                                            }`}
                                        >
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                <User size={20} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-[#003366] dark:text-blue-100' : 'text-gray-800 dark:text-gray-200'}`}>
                                                    {p.first_name} {p.last_name}
                                                </h4>
                                                <p className="text-xs font-mono text-[#00a896] truncate">{p.patient_code}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* PAGINATION GAUCHE */}
                        {pagination && pagination.lastPage > 1 && (
                            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
                                <button 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                    Page {page} / {pagination.lastPage}
                                </span>
                                <button 
                                    onClick={() => setPage(p => Math.min(pagination.lastPage, p + 1))}
                                    disabled={page === pagination.lastPage}
                                    className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ==================================================== */}
                    {/* DROITE : PRÉVISUALISATION GLOBALE DU PATIENT         */}
                    {/* ==================================================== */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative">
                        {!selectedPatient ? (
                            <div className="absolute inset-0 z-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                                <FileText size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Sélectionnez un patient</h3>
                                <p className="text-sm text-gray-500">Choisissez un patient pour voir tous ses soins en attente de paiement.</p>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                    
                                    <div className="bg-[#003366]/5 dark:bg-blue-900/20 p-4 rounded-xl border border-[#003366]/10 dark:border-blue-800 flex items-center gap-4">
                                        <User size={32} className="text-[#003366] dark:text-blue-400" />
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase">Dossier Actif</p>
                                            <p className="font-bold text-lg dark:text-white">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                                        </div>
                                    </div>

                                    {/* CONFIGURATION DU PRIX DE CONSULTATION */}
                                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                        <label className="block text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-1.5">
                                            Prix de la consultation (Appliqué à chaque consultation non facturée)
                                        </label>
                                        <div className="relative">
                                            <Calculator size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
                                            <input 
                                                type="number"
                                                min="0"
                                                value={consultationPrice}
                                                onChange={(e) => setConsultationPrice(Number(e.target.value))}
                                                className="w-full pl-10 pr-16 py-3 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg text-emerald-900 dark:text-white"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">FCFA</span>
                                        </div>
                                    </div>

                                    {/* PRÉVISUALISATION DYNAMIQUE DU PATIENT ENTIER */}
                                    {previewLoading ? (
                                        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-[#00a896]" /></div>
                                    ) : previewData ? (
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Synthèse des impayés du patient
                                            </div>
                                            <div className="p-4 space-y-4">
                                                
                                                {/* Consultations */}
                                                <div className="flex items-start justify-between text-sm">
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                        <Stethoscope size={16} className="text-[#00a896] mt-0.5" />
                                                        <div>
                                                            <p className="font-medium">Consultations en attente ({previewData.unbilled_consultations_count})</p>
                                                            <p className="text-[11px] text-gray-400">Basé sur le prix saisi ci-dessus</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-mono mt-1">{(previewData.unbilled_consultations_count * consultationPrice).toLocaleString()} FCFA</span>
                                                </div>

                                                {/* Actes Médicaux */}
                                                <div className="flex items-start justify-between text-sm">
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                        <Syringe size={16} className="text-[#00a896] mt-0.5" />
                                                        <div>
                                                            <p className="font-medium">Actes Médicaux / Soins / Examens</p>
                                                            <p className="text-[11px] text-gray-400">Total des soins reçus non facturés</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-mono mt-1">{previewData.unbilled_acts_total.toLocaleString()} FCFA</span>
                                                </div>

                                                {/* Hospitalisations */}
                                                <div className="flex items-start justify-between text-sm">
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                        <BedDouble size={16} className="text-[#00a896] mt-0.5" />
                                                        <div>
                                                            <p className="font-medium">Frais de Séjour & Hospitalisations</p>
                                                            <p className="text-[11px] text-gray-400">Calculé automatiquement selon le tarif de la chambre/nuit</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-mono mt-1">{previewData.unbilled_admissions_total.toLocaleString()} FCFA</span>
                                                </div>

                                                <hr className="border-gray-200 dark:border-gray-700 my-2" />
                                                
                                                <div className="flex justify-between items-center pt-2">
                                                    <span className="font-bold text-[#003366] dark:text-white text-lg">TOTAL À FACTURER</span>
                                                    <span className="font-bold text-[#00a896] text-2xl font-mono">{calculateDynamicTotal().toLocaleString()} FCFA</span>
                                                </div>

                                                {calculateDynamicTotal() === 0 && previewData.unbilled_consultations_count === 0 && (
                                                    <div className="mt-2 p-2 bg-green-50 text-green-700 text-xs rounded text-center border border-green-200 font-medium">
                                                        Ce patient est à jour. Aucun acte ni séjour en attente de facturation.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : null}

                                </div>

                                {/* --- FOOTER ACTION --- */}
                                <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-900 shrink-0">
                                    <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium transition-colors">
                                        Annuler
                                    </button>
                                    <button 
                                        onClick={handleSubmit} 
                                        disabled={actionLoading || !selectedPatient || (calculateDynamicTotal() === 0 && previewData?.unbilled_consultations_count === 0)}
                                        className="px-6 py-2.5 bg-[#00a896] hover:bg-[#008f7f] text-white rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                    >
                                        {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRightCircle size={18} />}
                                        {actionLoading ? "Génération..." : "Générer la Facture"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};