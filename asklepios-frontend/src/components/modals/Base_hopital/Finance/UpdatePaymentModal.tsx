import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Loader2, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import usePaymentStore from '../../../../functions/base_hospital/usePaymentStore';
import { PaymentMethod } from '../../../../types/PaymentTypes';
import type { PaymentInvoiceDto } from '../../../../types/PaymentTypes';

interface UpdatePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    payment: PaymentInvoiceDto | null;
}

export const UpdatePaymentModal: React.FC<UpdatePaymentModalProps> = ({ isOpen, onClose, payment }) => {
    const { updatePayment, actionLoading } = usePaymentStore();

    const [amount, setAmount] = useState<number | ''>('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);

    useEffect(() => {
        if (isOpen && payment) {
            setAmount(payment.amount);
            setPaymentMethod(payment.payment_method);
        }
    }, [isOpen, payment]);

    if (!isOpen || !payment) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || Number(amount) <= 0) {
            return toast.error("Veuillez saisir un montant valide.");
        }

        const result = await updatePayment(payment.id, {
            amount: Number(amount),
            payment_method: paymentMethod
        });

        if (result) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* HEADER */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-blue-600 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Edit3 size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Modifier un paiement</h2>
                            <p className="text-xs text-blue-100">Facture INV-{String(payment.invoice_id).padStart(5, '0')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* CORPS DU FORMULAIRE */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-lg border border-blue-100 dark:border-blue-800">
                        Vous modifiez l'historique financier. Le statut de la facture sera automatiquement recalculé après cette modification.
                    </div>

                    {/* MONTANT CORRIGÉ */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                            Montant corrigé (FCFA) *
                        </label>
                        <div className="relative">
                            <DollarSign size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="number"
                                required
                                min="1"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg dark:text-white"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* MÉTHODE DE PAIEMENT CORRIGÉE */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                            Moyen de paiement correct *
                        </label>
                        <div className="relative">
                            <CreditCard size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select 
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium dark:text-white appearance-none"
                            >
                                <option value={PaymentMethod.CASH}>Espèces (Cash)</option>
                                <option value={PaymentMethod.MOBILE_MONEY}>Mobile Money (Orange/MTN)</option>
                                <option value={PaymentMethod.CARD}>Carte Bancaire</option>
                                <option value={PaymentMethod.BANK_TRANSFER}>Virement Bancaire</option>
                                <option value={PaymentMethod.INSURANCE}>Prise en charge Assurance</option>
                            </select>
                        </div>
                    </div>

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
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            {actionLoading && <Loader2 size={18} className="animate-spin" />}
                            Mettre à jour
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};