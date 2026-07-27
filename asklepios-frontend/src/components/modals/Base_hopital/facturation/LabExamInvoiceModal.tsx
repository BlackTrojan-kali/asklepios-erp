import React, { useState, useEffect, useMemo } from 'react';
import { X, Beaker, Receipt, CheckCircle2, Search, Loader2, RefreshCw, User, Calendar, AlertCircle, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../../api/api';
import { getLabRequests } from '../../../../services/laboratory/labRequestService';
import type { LabRequestDto, LabRequestLineDto } from '../../../../types/types';
import { Button } from '../../../common/Button';

interface LabExamInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialPatientId?: number;
    initialLabRequestId?: number;
    onSuccess?: () => void;
}

export const LabExamInvoiceModal: React.FC<LabExamInvoiceModalProps> = ({
    isOpen,
    onClose,
    initialPatientId,
    initialLabRequestId,
    onSuccess
}) => {
    // --- ÉTATS ---
    const [searchQuery, setSearchQuery] = useState('');
    const [pendingRequests, setPendingRequests] = useState<LabRequestDto[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [generatingInvoice, setGeneratingInvoice] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<LabRequestDto | null>(null);
    const [selectedLineIds, setSelectedLineIds] = useState<number[]>([]);

    // 1. Initialisation & Chargement des requêtes
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setPendingRequests([]);
            setSelectedRequest(null);
            setSelectedLineIds([]);
            fetchRequests();
        }
    }, [isOpen, initialPatientId]);

    const fetchRequests = async () => {
        try {
            setLoadingRequests(true);
            const requests = await getLabRequests('PENDING_PAYMENT', initialPatientId);
            
            // 👉 CORRECTION ICI : On filtre pour NE PAS AFFICHER les examens déjà facturés (is_billed == true ou 1)
            const list = (requests || []).filter((req: any) => !req.is_billed);
            
            setPendingRequests(list);

            if (list.length > 0) {
                const target = initialLabRequestId 
                    ? list.find((r: any) => r.id === initialLabRequestId) || list[0] 
                    : list[0];
                handleSelectRequest(target);
            } else {
                setSelectedRequest(null);
                setSelectedLineIds([]);
            }
        } catch (error) {
            toast.error("Erreur lors de la récupération des prescriptions d'examens.");
        } finally {
            setLoadingRequests(false);
        }
    };

    // 2. Filtrage des demandes par la barre de recherche (Gauche)
    const filteredRequests = useMemo(() => {
        if (!searchQuery.trim()) return pendingRequests;
        const q = searchQuery.toLowerCase().trim();
        return pendingRequests.filter(req => {
            const patientName = `${req.patient?.first_name || ''} ${req.patient?.last_name || ''}`.toLowerCase();
            const patientCode = (req.patient?.patient_code || '').toLowerCase();
            const doctorName = (req.profileDoctor?.user ? `${req.profileDoctor.user.first_name} ${req.profileDoctor.user.last_name}` : '').toLowerCase();
            const reqId = `req-${req.id}`.toLowerCase();
            
            return patientName.includes(q) || patientCode.includes(q) || doctorName.includes(q) || reqId.includes(q);
        });
    }, [pendingRequests, searchQuery]);

    // Helper pour vérifier si une ligne d'examen est déjà payée
    const checkIsLinePaid = (line: LabRequestLineDto, req: LabRequestDto) => {
        if (req.status === "PAID" || line.is_paid) return true;
        const totalPaid = (req.invoice?.payments || []).reduce(
            (sum: number, p: any) => sum + Number(p.amount || 0),
            0
        );
        if (totalPaid <= 0) return false;

        let runningSum = 0;
        for (const l of req.lines || []) {
            runningSum += Number(l.test?.price ?? 0);
            if (l.id === line.id) {
                return runningSum <= totalPaid + 0.01;
            }
        }
        return false;
    };

    // Sélection d'une demande
    const handleSelectRequest = (request: LabRequestDto) => {
        setSelectedRequest(request);
        const unpaidLineIds = request.lines
            ?.filter(l => !checkIsLinePaid(l, request))
            .map(l => l.id) || [];
        setSelectedLineIds(unpaidLineIds);
    };

    // Cocher / Décocher un examen
    const toggleLineSelection = (line: LabRequestLineDto) => {
        if (selectedRequest && checkIsLinePaid(line, selectedRequest)) return;
        setSelectedLineIds(prev => 
            prev.includes(line.id) ? prev.filter(id => id !== line.id) : [...prev, line.id]
        );
    };

    // Tout sélectionner / Décocher tout
    const toggleAllLines = () => {
        if (!selectedRequest?.lines) return;
        const unpaidLines = selectedRequest.lines.filter(l => !checkIsLinePaid(l, selectedRequest));
        const unpaidLineIds = unpaidLines.map(l => l.id);
        const allUnpaidSelected = unpaidLineIds.every(id => selectedLineIds.includes(id));
        if (allUnpaidSelected) {
            setSelectedLineIds([]);
        } else {
            setSelectedLineIds(unpaidLineIds);
        }
    };

    // Calcul du montant total
    const calculatedTotal = () => {
        if (!selectedRequest || !selectedRequest.lines) return 0;
        return selectedRequest.lines
            .filter(line => !checkIsLinePaid(line, selectedRequest) && selectedLineIds.includes(line.id))
            .reduce((sum, line) => sum + Number(line.test?.price ?? 0), 0);
    };

    const requestGrandTotal = (req: LabRequestDto) => {
        if (!req.lines) return 0;
        return req.lines.reduce((sum, line) => sum + Number(line.test?.price ?? 0), 0);
    };

    // 3. Génération de la Facture
    const handleGenerateInvoice = async () => {
        if (!selectedRequest || !selectedRequest.invoice) {
            return toast.error("Aucune demande ou facture valide sélectionnée.");
        }

        const total = calculatedTotal();
        if (total <= 0) {
            return toast.error("Veuillez sélectionner au moins un examen non réglé à inclure dans la facture.");
        }

        try {
            setGeneratingInvoice(true);
            await api.put(`/shared/invoices/${selectedRequest.invoice.id}`, {
                total_amount: total
            });

            toast.success(`Facture d'examens émise avec succès (${total.toLocaleString('fr-FR')} FCFA) ! Transmise à la caisse pour encaissement.`);
            
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Erreur lors de la génération de la facture.");
        } finally {
            setGeneratingInvoice(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[92vh] max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
                
                {/* --- HEADER PRINCIPAL --- */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#003366] text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-xl text-[#00a896]">
                            <Beaker size={26} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-bold">Émission Facture - Examens de Laboratoire</h2>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00a896] text-white shadow-sm">
                                    {pendingRequests.length} prescription{pendingRequests.length > 1 ? 's' : ''} en attente
                                </span>
                            </div>
                            <p className="text-xs text-blue-200">Générez les factures proforma des examens prescrits pour transmission à la caisse</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <X size={22} />
                    </button>
                </div>

                {/* --- BODY DIVISÉ EN 2 COLONNES --- */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-slate-50 dark:bg-slate-950">
                    
                    {/* COLONNE GAUCHE (40%) */}
                    <div className="lg:col-span-5 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                        
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 shrink-0">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Prescriptions en attente ({filteredRequests.length})
                                </span>
                                <button 
                                    onClick={fetchRequests}
                                    disabled={loadingRequests}
                                    className="p-1.5 text-slate-400 hover:text-[#00a896] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Rafraîchir les prescriptions"
                                >
                                    <RefreshCw size={16} className={loadingRequests ? "animate-spin text-[#00a896]" : ""} />
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Rechercher patient, code ou Dr..."
                                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#00a896] dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-1">
                            {loadingRequests ? (
                                <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                                    <Loader2 className="animate-spin text-[#00a896]" size={24} />
                                    <span>Chargement des prescriptions...</span>
                                </div>
                            ) : filteredRequests.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 space-y-2">
                                    <AlertCircle className="mx-auto text-slate-300 dark:text-slate-600" size={32} />
                                    <p className="text-xs font-medium">Aucun examen en attente de facturation.</p>
                                </div>
                            ) : (
                                filteredRequests.map((req) => {
                                    const isSelected = selectedRequest?.id === req.id;
                                    const totalAmount = requestGrandTotal(req);
                                    const doctorName = req.profileDoctor?.user 
                                        ? `Dr. ${req.profileDoctor.user.first_name} ${req.profileDoctor.user.last_name}`
                                        : (req.external_prescriber_name || 'Médecin traitant');

                                    return (
                                        <div
                                            key={req.id}
                                            onClick={() => handleSelectRequest(req)}
                                            className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                                                isSelected 
                                                    ? 'bg-teal-50/80 dark:bg-teal-950/40 border-[#00a896] shadow-sm' 
                                                    : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                                        <User size={14} className="text-[#00a896] shrink-0" />
                                                        {req.patient?.first_name} {req.patient?.last_name}
                                                    </h4>
                                                    <p className="text-xs text-[#003366] dark:text-blue-300 font-semibold mt-0.5">
                                                        Code: <span className="font-mono">{req.patient?.patient_code || `PAT-${req.patient_id}`}</span>
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                                                    req.priority === 'URGENT' 
                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' 
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                    {req.priority || 'ROUTINE'}
                                                </span>
                                            </div>

                                            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                                                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
                                                    {doctorName}
                                                </span>
                                                <span className="font-bold text-[#00a896]">
                                                    {totalAmount.toLocaleString('fr-FR')} FCFA
                                                </span>
                                            </div>

                                            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                                                <span>REQ #{req.id} • {req.lines?.length || 0} examen(s)</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* COLONNE DROITE (60%) */}
                    <div className="lg:col-span-7 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
                        {selectedRequest ? (
                            <div className="flex flex-col h-full overflow-hidden">
                                
                                <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-[#00a896] bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800">
                                                Demande REQ #{selectedRequest.id}
                                            </span>
                                            <h3 className="text-base font-bold text-slate-800 dark:text-white">
                                                {selectedRequest.patient?.first_name} {selectedRequest.patient?.last_name}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Prescrit par : <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                {selectedRequest.profileDoctor?.user 
                                                    ? `Dr. ${selectedRequest.profileDoctor.user.first_name} ${selectedRequest.profileDoctor.user.last_name}`
                                                    : (selectedRequest.external_prescriber_name || 'Médecin traitant')}
                                            </span>
                                        </p>
                                    </div>

                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={toggleAllLines}
                                        icon={selectedLineIds.length === selectedRequest.lines?.filter(l => !checkIsLinePaid(l, selectedRequest)).length ? <Square size={14} /> : <CheckSquare size={14} />}
                                        title="Tout cocher ou tout décocher (examens non payés)"
                                    >
                                        {selectedLineIds.length === selectedRequest.lines?.filter(l => !checkIsLinePaid(l, selectedRequest)).length ? "Tout décocher" : "Tout cocher"}
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        <span>
                                            Examens à inclure sur la facture ({selectedLineIds.length}/{selectedRequest.lines?.filter(l => !checkIsLinePaid(l, selectedRequest)).length || 0})
                                        </span>
                                        <span className="text-[11px] text-amber-600 dark:text-amber-400 normal-case font-medium">
                                            Les examens déjà réglés sont verrouillés
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {selectedRequest.lines?.map((line) => {
                                            const isPaid = checkIsLinePaid(line, selectedRequest);
                                            const isChecked = selectedLineIds.includes(line.id) && !isPaid;
                                            const priceNum = Number(line.test?.price ?? 0);

                                            return (
                                                <div 
                                                    key={line.id}
                                                    onClick={() => toggleLineSelection(line)}
                                                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                                                        isPaid
                                                            ? 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75 cursor-not-allowed'
                                                            : isChecked 
                                                            ? 'bg-white dark:bg-slate-900 border-[#00a896] shadow-sm cursor-pointer' 
                                                            : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-pointer'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-1 rounded-md transition-colors ${
                                                            isPaid 
                                                                ? 'text-emerald-500' 
                                                                : isChecked 
                                                                ? 'text-[#00a896]' 
                                                                : 'text-slate-400'
                                                        }`}>
                                                            {isPaid ? (
                                                                <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                                                            ) : isChecked ? (
                                                                <CheckSquare size={20} />
                                                            ) : (
                                                                <Square size={20} />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-bold text-slate-800 dark:text-white">
                                                                    {line.test?.name}
                                                                </p>
                                                                {isPaid && (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 uppercase">
                                                                        Déjà Payé
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                {line.test?.category && (
                                                                    <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                                                                        {line.test.category.name}
                                                                    </span>
                                                                )}
                                                                {line.test?.sample_type_required && (
                                                                    <span className="text-[10px] text-slate-400">
                                                                        Prélèvement : {line.test.sample_type_required}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <span className={`text-sm font-bold shrink-0 ${
                                                        isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#00a896]'
                                                    }`}>
                                                        {priceNum.toLocaleString('fr-FR')} FCFA
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 space-y-4 shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Montant total de la facture</span>
                                            <p className="text-2xl font-black text-[#00a896]">
                                                {calculatedTotal().toLocaleString('fr-FR')} FCFA
                                            </p>
                                        </div>

                                        <p className="text-xs text-slate-500 max-w-xs text-right hidden sm:block">
                                            La facture générée sera disponible dans l'Historique des Factures pour règlement à la Caisse.
                                        </p>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <Button 
                                            variant="outline" 
                                            onClick={onClose}
                                            title="Fermer la modale"
                                        >
                                            Fermer
                                        </Button>

                                        <Button
                                            variant="primary"
                                            isLoading={generatingInvoice}
                                            disabled={!selectedRequest || calculatedTotal() <= 0 || generatingInvoice}
                                            onClick={handleGenerateInvoice}
                                            icon={<Receipt size={18} />}
                                            title="Émettre la facture d'examens et la transmettre à la caisse pour encaissement"
                                        >
                                            Générer Facture ({calculatedTotal().toLocaleString('fr-FR')} FCFA)
                                        </Button>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                                <Beaker size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
                                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">Aucune demande sélectionnée</h3>
                                <p className="text-xs text-slate-400 max-w-sm mt-1">
                                    Veuillez sélectionner un patient dans la liste de gauche pour émettre sa facture d'examens.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};