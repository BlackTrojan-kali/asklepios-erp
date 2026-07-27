import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Loader2, AlertCircle, Wallet, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import usePaymentStore from '../../../../functions/base_hospital/usePaymentStore';
import { PaymentMethod } from '../../../../types/PaymentTypes';
import type { InvoiceDto } from '../../../../types/InvoiceTypes';

interface CreatePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: InvoiceDto | null;
    initialAmount?: number;
}

export const CreatePaymentModal: React.FC<CreatePaymentModalProps> = ({ isOpen, onClose, invoice, initialAmount }) => {
    const { createPayment, actionLoading } = usePaymentStore();

    const [amount, setAmount] = useState<number | ''>('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);

    // 👉 NOUVEAU : On isole les parts (Splits) de la facture
    const patientSplit = (invoice as any)?.splits?.find((s: any) => s.type === 'PATIENT');
    const insuranceSplit = (invoice as any)?.splits?.find((s: any) => s.type === 'INSURANCE');

    // Le total dû par le patient (s'il n'y a pas de split, on prend le total de la facture)
    const patientPartAmount = patientSplit ? Number(patientSplit.amount_to_pay) : Number(invoice?.total_amount || 0);

    // L'argent déjà versé par le patient UNIQUEMENT
    const patientPaid = invoice?.payments
        ?.filter(p => !p.invoice_split_id || (patientSplit && p.invoice_split_id === patientSplit.id))
        .reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

    // Le vrai reste à payer de la poche du patient
    const remainingAmount = Math.max(0, patientPartAmount - patientPaid);

    useEffect(() => {
        if (isOpen && invoice) {
            const defaultAmt = initialAmount !== undefined ? Math.min(initialAmount, remainingAmount) : remainingAmount;
            setAmount(defaultAmt);
            setPaymentMethod(PaymentMethod.CASH);
        }
    }, [isOpen, invoice, remainingAmount, initialAmount]);

    if (!isOpen || !invoice) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || Number(amount) <= 0) {
            return toast.error("Veuillez saisir un montant valide.");
        }

        if (Number(amount) > remainingAmount) {
            return toast.error("Le montant saisi est supérieur au reste à payer du patient.");
        }

        const result = await createPayment({
            invoice_id: invoice.id,
            invoice_split_id: patientSplit?.id, // 👉 On lie explicitement le paiement à la part patient
            amount: Number(amount),
            payment_method: paymentMethod
        });

        if (result) {
            if (result.invoice_status === 'PAID') {
                toast.success("Facture entièrement soldée !");
            } else {
                toast.success("Paiement enregistré. La facture reste non soldée (Part assurance ou paiement partiel en attente).", { duration: 4000 });
            }
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* HEADER */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-emerald-600 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Encaisser le patient</h2>
                            <p className="text-xs text-emerald-100">Facture INV-{String(invoice.id).padStart(5, '0')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-emerald-100 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* CORPS DU FORMULAIRE */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    
                    {/* RÉCAPITULATIF FINANCIER INTELLIGENT */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                        
                        <div className="flex justify-between text-xs text-gray-400 pb-2 border-b border-gray-200 dark:border-gray-700">
                            <span>Total Brut (Avant Assurance) :</span>
                            <span>{Number(invoice.total_amount).toLocaleString()} FCFA</span>
                        </div>

                        {insuranceSplit && (
                            <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400 font-medium pb-2 border-b border-gray-200 dark:border-gray-700">
                                <span className="flex items-center gap-1.5"><ShieldCheck size={16} /> Couverture Assurance :</span>
                                <span>- {Number(insuranceSplit.amount_to_pay).toLocaleString()} FCFA</span>
                            </div>
                        )}

                        <div className="flex justify-between text-sm pt-1">
                            <span className="text-gray-600 dark:text-gray-300 font-bold">Part Patient :</span>
                            <span className="font-bold dark:text-white">{patientPartAmount.toLocaleString()} FCFA</span>
                        </div>

                        <div className="flex justify-between text-sm pb-2 border-b border-gray-200 dark:border-gray-700">
                            <span className="text-gray-500">Déjà versé (Patient) :</span>
                            <span className="font-bold text-emerald-600">{patientPaid.toLocaleString()} FCFA</span>
                        </div>
                        
                        <div className="flex justify-between items-center pt-1">
                            <span className="font-bold text-red-500">Reste à payer :</span>
                            <span className="font-mono text-xl font-bold text-red-500">{remainingAmount.toLocaleString()} FCFA</span>
                        </div>
                    </div>

                    {/* MONTANT À ENCAISSER */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                            Montant reçu (FCFA) *
                        </label>
                        <div className="relative">
                            <DollarSign size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="number"
                                required
                                min="1"
                                max={remainingAmount}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg dark:text-white"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* MÉTHODE DE PAIEMENT */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                            Moyen de paiement *
                        </label>
                        <div className="relative">
                            <CreditCard size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select 
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium dark:text-white appearance-none"
                            >
                                <option value={PaymentMethod.CASH}>Espèces (Cash)</option>
                                <option value={PaymentMethod.MOBILE_MONEY}>Mobile Money (Orange/MTN)</option>
                                <option value={PaymentMethod.CARD}>Carte Bancaire</option>
                                <option value={PaymentMethod.BANK_TRANSFER}>Virement Bancaire</option>
                                {/* 👉 On désactive l'option "Assurance" ici car l'assurance est gérée via les bordereaux */}
                            </select>
                        </div>
                    </div>

                    {amount !== '' && Number(amount) < remainingAmount && (
                        <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-xs rounded-lg border border-orange-200 dark:border-orange-800/50">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <p><strong>Paiement partiel :</strong> La part patient restera non soldée après ce versement.</p>
                        </div>
                    )}

                    {/* ACTIONS */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors"
                        >
                            Annuler
                        </button>
                        <button 
                            type="submit" 
                            disabled={actionLoading || !amount}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            {actionLoading && <Loader2 size={18} className="animate-spin" />}
                            Valider l'encaissement
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};