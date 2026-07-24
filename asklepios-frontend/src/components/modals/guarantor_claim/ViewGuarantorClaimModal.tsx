import React, { useEffect } from 'react';
import { X, FileText, Loader2, Printer, ShieldCheck } from 'lucide-react';
import useGuarantorClaimStore from '../../../functions/base_hospital/useGuarantorClaimStore';

interface ViewGuarantorClaimModalProps {
    isOpen: boolean;
    onClose: () => void;
    claimId: number | null;
}

export const ViewGuarantorClaimModal: React.FC<ViewGuarantorClaimModalProps> = ({ isOpen, onClose, claimId }) => {
    const { currentClaim, getClaimById, loading, actionLoading, downloadClaimPdf } = useGuarantorClaimStore();

    useEffect(() => {
        if (isOpen && claimId) {
            getClaimById(claimId);
        }
    }, [isOpen, claimId, getClaimById]);

    if (!isOpen || !claimId) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount).replace('XAF', 'FCFA');
    };

    // --- Helpers pour extraire les nouvelles données ---
    
    // Récupérer le numéro d'assuré pour cette assurance spécifique
    const getPolicyNumber = (patient: any, insuranceId: number) => {
        if (!patient?.coverages) return 'N/A';
        const coverage = patient.coverages.find((c: any) => c.insurance_company_id === insuranceId);
        return coverage?.policy_number || 'N/A';
    };

    // Construire le résumé des actes/soins
    const getInvoiceDetails = (invoice: any) => {
        if (!invoice) return 'Détails indisponibles';
        const details = [];
        
        if (invoice.consultations?.length > 0) {
            details.push(`${invoice.consultations.length} Consultation(s)`);
        }
        if (invoice.performed_medical_acts?.length > 0) {
            invoice.performed_medical_acts.forEach((act: any) => {
                details.push(act.medical_act_catalog?.name || 'Acte médical');
            });
        }
        if (invoice.admissions?.length > 0) {
            details.push('Hospitalisation/Séjour');
        }

        return details.length > 0 ? details.join(', ') : 'Soins divers';
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* --- HEADER --- */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-[#003366] text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <FileText size={24} className="text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Détails du Bordereau BDR-{String(claimId).padStart(4, '0')}</h2>
                            <p className="text-xs text-blue-200">
                                {currentClaim?.insuranceCompany?.name || 'Chargement...'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* --- CORPS --- */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-gray-900/50 custom-scrollbar">
                    {loading || !currentClaim ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Loader2 size={40} className="animate-spin text-indigo-500 mb-4" />
                            <p>Chargement des détails...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            
                            {/* Résumé */}
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-wrap justify-between items-center gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Mois de Réclamation</p>
                                    <p className="font-bold text-lg text-slate-800 dark:text-gray-200 capitalize">
                                        {new Date(currentClaim.claim_month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Statut actuel</p>
                                    <span className={`px-3 py-1 rounded font-bold text-xs uppercase ${
                                        currentClaim.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                        currentClaim.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {currentClaim.status}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total Réclamé à l'assurance</p>
                                    <p className="font-mono font-bold text-2xl text-indigo-600 dark:text-indigo-400">
                                        {formatCurrency(currentClaim.total_claim_amount)}
                                    </p>
                                </div>
                            </div>

                            {/* Liste des factures */}
                            <div>
                                <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-indigo-500" />
                                    {/* CORRECTION ICI : invoice_splits */}
                                    Liste des {currentClaim.invoice_splits?.length || 0} factures incluses
                                </h3>
                                
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                                                <tr>
                                                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Date Soins</th>
                                                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase">N° Facture</th>
                                                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Patient & N° Assuré</th>
                                                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Prestations</th>
                                                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase text-right">Montant Réclamé</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {/* CORRECTION ICI AUSSI : invoice_splits */}
                                                {currentClaim.invoice_splits?.map((split) => (
                                                    <tr key={split.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
                                                        <td className="p-3 text-gray-600 dark:text-gray-300 align-top whitespace-nowrap">
                                                            {new Date(split.invoice?.created_at || '').toLocaleDateString('fr-FR')}
                                                        </td>
                                                        <td className="p-3 font-mono font-bold text-slate-700 dark:text-gray-200 align-top whitespace-nowrap">
                                                            INV-{String(split.invoice_id).padStart(5, '0')}
                                                        </td>
                                                        <td className="p-3 align-top">
                                                            <div className="font-bold text-slate-800 dark:text-gray-200">
                                                                {split.invoice?.patient?.first_name} {split.invoice?.patient?.last_name}
                                                            </div>
                                                            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                                                                Police : {getPolicyNumber(split.invoice?.patient, currentClaim.insurance_company_id)}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 align-top">
                                                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-w-xs">
                                                                {getInvoiceDetails(split.invoice)}
                                                            </p>
                                                        </td>
                                                        <td className="p-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400 align-top whitespace-nowrap">
                                                            {formatCurrency(split.amount_to_pay)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* --- FOOTER ACTION --- */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-white dark:bg-gray-900 shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 rounded-xl font-medium transition-colors">
                        Fermer
                    </button>
                    <button 
                        onClick={() => downloadClaimPdf(claimId, 'stream')} 
                        disabled={actionLoading || loading || !currentClaim}
                        className="px-6 py-2.5 bg-[#003366] hover:bg-blue-900 text-white rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-md"
                    >
                        {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                        Imprimer le Bordereau
                    </button>
                </div>
            </div>
        </div>
    );
};