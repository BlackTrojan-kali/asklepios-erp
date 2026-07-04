import React, { useState, useEffect } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { useConfirmPaymentTransaction } from "../../../../hooks/pharmacy/usePaymentTransaction";
import { type PaymentTransactionDto } from "../../../../services/pharmacy/paymentTransactionService";

interface ConfirmDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PaymentTransactionDto | null;
  onSuccess: () => void;
}

export default function ConfirmDepositModal({
  isOpen,
  onClose,
  transaction,
  onSuccess,
}: ConfirmDepositModalProps) {
  const [confirmRef, setConfirmRef] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | undefined>(undefined);
  const confirmMutation = useConfirmPaymentTransaction();

  // Reset fields when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setConfirmRef("");
      setReceiptFile(undefined);
    }
  }, [isOpen]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    confirmMutation.mutate(
      {
        id: transaction.id,
        reference: confirmRef,
        receipt: receiptFile,
      },
      {
        onSuccess: () => {
          Swal.fire({
            icon: "success",
            title: "Versement validé",
            text: `Le versement de ${transaction.amount.toLocaleString()} XAF a été crédité sur le compte bancaire.`,
            confirmButtonColor: "#10b981",
          });
          onSuccess();
          onClose();
        },
        onError: (err: any) => {
          Swal.fire({
            icon: "error",
            title: "Erreur",
            text: err.response?.data?.message || "Erreur de confirmation.",
            confirmButtonColor: "#ef4444",
          });
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/60 text-slate-900 dark:text-white">
          <div>
            <h3 className="font-bold">Validation du Versement</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Veuillez renseigner les preuves bancaires</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-gray-850 rounded-lg text-slate-400 dark:text-gray-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800 dark:text-gray-200">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl text-center">
            <span className="text-xs text-emerald-800 dark:text-emerald-450 font-bold block mb-1">Montant à créditer</span>
            <span className="text-2xl font-black font-mono text-emerald-900 dark:text-emerald-455">
              {transaction.amount.toLocaleString()} <span className="text-sm">XAF</span>
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
              Référence de transaction / Bordereau
            </label>
            <input
              type="text"
              required
              placeholder="Saisir la référence unique du ticket/bordereau"
              value={confirmRef}
              onChange={(e) => setConfirmRef(e.target.value)}
              className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-350 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
              Photo / Scan du Reçu (facultatif)
            </label>
            <div className="border-2 border-dashed border-slate-300 dark:border-gray-700 rounded-xl p-4 text-center hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setReceiptFile(e.target.files?.[0])}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-8 h-8 text-slate-450 dark:text-gray-505 mx-auto mb-2" />
              <span className="text-xs font-semibold text-slate-650 dark:text-gray-300 block">
                {receiptFile ? receiptFile.name : "Cliquez ou glissez une image pour charger le reçu"}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5 block">
                Format d'image accepté (JPG, PNG) - Max 4Mo
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-gray-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-gray-700 hover:bg-slate-150 dark:hover:bg-gray-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={confirmMutation.isPending}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-350 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              {confirmMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Valider le dépôt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
