import React, { useEffect } from 'react';
import { X, Printer, XCircle, Loader2, Receipt, CheckCircle, ShieldCheck } from 'lucide-react';
import Swal from 'sweetalert2';
import useInvoiceStore from '../../../../functions/base_hospital/useInvoiceStore';

interface InvoicePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoiceId: number | null;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ isOpen, onClose, invoiceId }) => {
    const { currentInvoice, getInvoiceById, loading, actionLoading, downloadInvoicePdf, cancelInvoice } = useInvoiceStore();
    
    useEffect(() => {
        if (isOpen && invoiceId) {
            getInvoiceById(invoiceId);
        }
    }, [isOpen, invoiceId, getInvoiceById]);

    if (!isOpen || !invoiceId) return null;

    const handlePrint = async () => {
        await downloadInvoicePdf(invoiceId, 'stream');
    };

    const handleCancel = async () => {
        const result = await Swal.fire({
            title: 'Annuler cette facture ?',
            text: "Cette action est irréversible. Les actes et consultations retourneront en attente de facturation.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Non, garder',
            confirmButtonText: 'Oui, annuler la facture'
        });

        if (result.isConfirmed) {
            const success = await cancelInvoice(invoiceId);
            if (success) onClose();
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount).replace('XAF', 'FCFA');
    };

    // --- CALCULS SÉCURISÉS (Tiers Payant Intégré) ---
    const totalAmount = currentInvoice?.total_amount || 0;
    const insurancePart = currentInvoice?.insurance_part || 0;
    // Si la propriété patient_part n'existe pas (anciennes factures), le patient paie la totalité
    const patientPart = currentInvoice?.patient_part ?? totalAmount; 
    
    const totalPaid = currentInvoice?.payments?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
    
    // Le reste à payer est calculé sur la PART PATIENT uniquement
    const remainingAmount = Math.max(0, patientPart - totalPaid);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* --- HEADER --- */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-[#003366] text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <Receipt size={24} className="text-[#00a896]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold font-brand">Facture INV-{String(invoiceId).padStart(5, '0')}</h2>
                            <p className="text-xs text-blue-200">
                                {currentInvoice?.patient ? `${currentInvoice.patient.first_name} ${currentInvoice.patient.last_name || ''} - ${currentInvoice.patient.patient_code}` : 'Chargement...'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {currentInvoice && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                currentInvoice.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-red-500/20 text-red-300 border border-red-500/50'
                            }`}>
                                {currentInvoice.status === 'PAID' ? 'SOLDE' : 'NON SOLDE'}
                            </span>
                        )}
                        <button onClick={onClose} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* --- CORPS --- */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50 dark:bg-gray-900/50">
                    {loading || !currentInvoice ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Loader2 size={40} className="animate-spin text-[#00a896] mb-4" />
                            <p>Chargement des détails de la facture...</p>
                        </div>
                    ) : (
                        <div className="space-y-6 max-w-3xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            
                            {/* Infos Générales */}
                            <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-4">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Date d'émission</p>
                                    <p className="text-sm font-medium dark:text-gray-200">{new Date(currentInvoice.created_at).toLocaleString('fr-FR')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Centre / Succursale</p>
                                    <p className="text-sm font-medium dark:text-gray-200">{currentInvoice.center?.name || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Lignes de facturation */}
                            <div>
                                <h3 className="text-sm font-bold text-[#003366] dark:text-blue-400 mb-3 border-l-4 border-[#00a896] pl-2">Détails des prestations</h3>
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-700">
                                            <th className="py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">Description</th>
                                            <th className="py-2 px-3 font-semibold text-gray-600 dark:text-gray-400 text-right">Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        
                                        {/* Consultations */}
                                        {currentInvoice.consultations?.map(c => (
                                            <tr key={`cons-${c.id}`}>
                                                <td className="py-3 px-3 dark:text-gray-300">Consultation médicale - Dr. {c.profileDoctor?.user?.first_name || ''}</td>
                                                <td className="py-3 px-3 text-right font-mono dark:text-gray-300">{formatCurrency(c.consultation_price || 0)}</td>
                                            </tr>
                                        ))}

                                        {/* Actes Médicaux */}
                                        {currentInvoice.performed_medical_acts?.map(act => (
                                            <tr key={`act-${act.id}`}>
                                                <td className="py-3 px-3 dark:text-gray-300">Acte: {act.medical_act_catalog?.name || act.medicalActCatalog?.name || 'Soin'}</td>
                                                <td className="py-3 px-3 text-right font-mono dark:text-gray-300">{formatCurrency(act.applied_price || 0)}</td>
                                            </tr>
                                        ))}

                                        {/* Lits / Admissions */}
                                        {currentInvoice.admissions?.map(adm => {
                                            const days = Math.max(1, Math.ceil((new Date(adm.actual_discharge_date || new Date()).getTime() - new Date(adm.admission_date).getTime()) / (1000 * 3600 * 24)));
                                            const price = adm.bed?.facility_room?.category?.price_per_night || 0;
                                            return (
                                                <tr key={`adm-${adm.id}`}>
                                                    <td className="py-3 px-3 dark:text-gray-300">
                                                        Séjour hospitalisation ({days} nuit(s)) - Lit {adm.bed?.bed_number || 'N/A'}
                                                    </td>
                                                    <td className="py-3 px-3 text-right font-mono dark:text-gray-300">{formatCurrency(days * price)}</td>
                                                </tr>
                                            );
                                        })}

                                        {/* Examens de Laboratoire */}
                                        {((currentInvoice as any).lab_requests || (currentInvoice as any).labRequests)?.map((labReq: any) => (
                                            <React.Fragment key={`labReq-${labReq.id}`}>
                                                {labReq.lines?.map((line: any) => (
                                                    <tr key={`labLine-${line.id}`}>
                                                        <td className="py-3 px-3 dark:text-gray-300">
                                                            <div className="flex items-center gap-2">
                                                                <span>Examen Labo : <strong>{line.test?.name || 'Analyse'}</strong></span>
                                                                {line.test?.category && (
                                                                    <span className="text-[10px] bg-teal-50 dark:bg-teal-900/30 text-[#00a896] font-bold px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                                                                        {line.test.category.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3 text-right font-mono dark:text-gray-300">
                                                            {formatCurrency(Number(line.test?.price || 0))}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Total & Paiements (Refonte Tiers Payant) */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-gray-500 dark:text-gray-400">Total Général (Brut) :</span>
                                    <span className="font-mono text-gray-700 dark:text-gray-300">{formatCurrency(totalAmount)}</span>
                                </div>

                                {/* Affichage de la Prise en Charge si elle existe */}
                                {insurancePart > 0 && (
                                    <div className="flex justify-between items-center mb-2 text-indigo-600 dark:text-indigo-400">
                                        <span className="font-bold flex items-center gap-1.5">
                                            <ShieldCheck size={16} /> Prise en charge Assurance :
                                        </span>
                                        <span className="font-bold font-mono">- {formatCurrency(insurancePart)}</span>
                                    </div>
                                )}

                                {/* Part Patient Réelle */}
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-gray-700 dark:text-gray-200">Part Patient :</span>
                                    <span className="font-bold text-lg font-mono dark:text-white">{formatCurrency(patientPart)}</span>
                                </div>

                                {/* Acomptes */}
                                {totalPaid > 0 && (
                                    <div className="flex justify-between items-center mb-2 text-emerald-600 dark:text-emerald-400">
                                        <span className="text-sm font-medium">Déjà versé (Acomptes) :</span>
                                        <span className="font-mono text-sm">- {formatCurrency(totalPaid)}</span>
                                    </div>
                                )}
                                
                                <hr className="border-gray-200 dark:border-gray-700 my-2" />
                                
                                {/* Reste à Payer Net */}
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-[#003366] dark:text-blue-400 uppercase">Net à payer (Patient) :</span>
                                    <span className={`font-bold text-xl font-mono ${remainingAmount === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {formatCurrency(remainingAmount)}
                                    </span>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* --- FOOTER ACTION --- */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900 shrink-0">
                    <div>
                        {currentInvoice?.status === 'UNPAID' && (
                            <button 
                                onClick={handleCancel} 
                                disabled={actionLoading}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg font-medium transition-colors"
                            >
                                <XCircle size={18} /> Annuler la facture
                            </button>
                        )}
                        {currentInvoice?.status === 'PAID' && (
                            <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                                <CheckCircle size={18}/> Facture verrouillée (Soldée)
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors">
                            Fermer
                        </button>
                        <button 
                            onClick={handlePrint} 
                            disabled={actionLoading || !currentInvoice}
                            className="px-6 py-2.5 bg-[#00a896] hover:bg-[#008f7f] text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
                        >
                            {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                            Imprimer (PDF)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};