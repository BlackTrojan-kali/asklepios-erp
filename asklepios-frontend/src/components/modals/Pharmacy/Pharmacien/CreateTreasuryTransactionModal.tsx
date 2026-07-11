import React, { useState, useMemo, useEffect } from "react";
import Swal from "sweetalert2";
import {
  X,
  Upload,
  Loader2,
  ArrowRightLeft,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useCreatePaymentTransaction } from "../../../../hooks/pharmacy/usePaymentTransaction";
import { type PaymentAccountDto } from "../../../../services/pharmacy/paymentAccountService";

interface CreateTreasuryTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  txType: "cash_in" | "cash_out" | "transfer";
  activeSession: any;
  expectedCashInDrawer: number;
  accounts: PaymentAccountDto[];
  onSuccess: () => void;
}

export default function CreateTreasuryTransactionModal({
  isOpen,
  onClose,
  txType,
  activeSession,
  expectedCashInDrawer,
  accounts,
  onSuccess,
}: CreateTreasuryTransactionModalProps) {
  // --- ÉTATS ---
  const [destAccountId, setDestAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MOBILE_MONEY" | "CARD">("CASH");
  const [description, setDescription] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | undefined>(undefined);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [showOptional, setShowOptional] = useState(false);

  // Réinitialiser les champs à la fermeture ou à l'ouverture de la modale
  useEffect(() => {
    if (!isOpen) {
      setDestAccountId("");
      setAmount("");
      setPaymentMethod("CASH");
      setDescription("");
      setReceiptFile(undefined);
      setShowOptional(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!receiptFile) {
      setReceiptPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(receiptFile);
    setReceiptPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [receiptFile]);

  // --- HOOKS ---
  const createTxMutation = useCreatePaymentTransaction(false); // false = cashier mode

  // Filtrer les comptes de destination autorisés (coffres, banques, propriétaires)
  const allowedDestAccounts = useMemo(() => {
    return accounts.filter(
      (a) => a.type === "safe" || a.type === "bank" || a.type === "owner"
    );
  }, [accounts]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !activeSession.register?.pharmacy_branch_id) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Montant invalide",
        text: "Veuillez saisir un montant supérieur à 0.",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    if (txType === "transfer" && !destAccountId) {
      Swal.fire({
        icon: "warning",
        title: "Compte requis",
        text: "Veuillez sélectionner le compte de destination pour le versement.",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    if (txType === "cash_out" && expectedCashInDrawer < parsedAmount) {
      Swal.fire({
        title: "Solde insuffisant ?",
        text: `Le montant saisi (${parsedAmount.toLocaleString()} XAF) est supérieur au cash attendu dans votre tiroir (${expectedCashInDrawer.toLocaleString()} XAF). Voulez-vous continuer ?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#f59e0b",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Oui, enregistrer",
        cancelButtonText: "Annuler",
      }).then((result) => {
        if (result.isConfirmed) {
          executeTxCreation(parsedAmount);
        }
      });
    } else {
      executeTxCreation(parsedAmount);
    }
  };

  const executeTxCreation = (parsedAmount: number) => {
    const branchId = activeSession.register.pharmacy_branch_id;
    const payload = {
      pharmacy_branch_id: branchId,
      type: txType,
      payment_method: paymentMethod,
      amount: parsedAmount,
      destination_account_id: txType === "transfer" ? parseInt(destAccountId) : null,
      source_account_id: null,
      description: description || null,
    };

    createTxMutation.mutate(
      { payload, receipt: receiptFile },
      {
        onSuccess: () => {
          Swal.fire({
            icon: "success",
            title: "Mouvement enregistré",
            text:
              txType === "transfer"
                ? "Le versement est en attente de validation par l'administrateur."
                : "Le mouvement de caisse a été validé.",
            confirmButtonColor: "#10b981",
          });
          onSuccess();
          onClose();
        },
        onError: (err: any) => {
          Swal.fire({
            icon: "error",
            title: "Erreur",
            text: err.response?.data?.message || "Impossible d'enregistrer la transaction.",
            confirmButtonColor: "#ef4444",
          });
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-805 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/60">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm md:text-base">
            {txType === "transfer" && (
              <>
                <ArrowRightLeft className="w-5 h-5 text-blue-500" /> Nouveau Versement / Dépôt
              </>
            )}
            {txType === "cash_out" && (
              <>
                <TrendingDown className="w-5 h-5 text-rose-500" /> Nouvelle Dépense / Retrait
              </>
            )}
            {txType === "cash_in" && (
              <>
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Apport de Caisse / Alimentation
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-gray-850 rounded-lg text-slate-400 dark:text-gray-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800 dark:text-gray-200">
          {txType === "transfer" && (
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Déposer vers (Compte Cible)
              </label>
              <select
                required
                value={destAccountId}
                onChange={(e) => setDestAccountId(e.target.value)}
                className="w-full bg-slate-55 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-semibold"
              >
                <option value="">Sélectionner une banque, coffre ou gérant...</option>
                {allowedDestAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type === "bank" ? "Banque" : a.type === "safe" ? "Coffre" : "Gérant"})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1 font-medium">
                * Ce dépôt sera en attente (Transit) jusqu'à validation par l'administrateur.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
              Mode de transaction
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full bg-slate-55 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-semibold"
            >
              <option value="CASH">Espèces (Cash)</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CARD">Carte Bancaire</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-gray-505 uppercase tracking-wider mb-1.5">
              Montant (XAF)
            </label>
            <input
              type="number"
              required
              min="100"
              placeholder="Saisir le montant..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-55 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-mono font-bold"
            />
          </div>

          {txType === "cash_out" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  Justification / Notes
                </label>
                <textarea
                  placeholder="Raison de la dépense (obligatoire)..."
                  required
                  rows={2.5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white"
                />
              </div>

              {!showOptional ? (
                <button
                  type="button"
                  onClick={() => setShowOptional(true)}
                  className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  + Joindre un justificatif / photo (optionnel)
                </button>
              ) : (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                    Photo / Scan justificatif (Optionnel)
                  </label>
                  {receiptPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700 max-h-40 flex items-center justify-center bg-slate-50 dark:bg-gray-800">
                      <img src={receiptPreview} alt="Aperçu du justificatif" className="object-contain max-h-40" />
                      <button
                        type="button"
                        onClick={() => setReceiptFile(undefined)}
                        className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-full hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-300 dark:border-gray-700 rounded-xl p-4 text-center hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setReceiptFile(e.target.files?.[0])}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="w-8 h-8 text-slate-400 dark:text-gray-505 mx-auto mb-2" />
                      <span className="text-xs font-semibold text-slate-650 dark:text-gray-300 block">
                        Cliquez pour charger une photo
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Si c'est un apport (cash_in) ou versement (transfer), tout est facultatif
            !showOptional ? (
              <button
                type="button"
                onClick={() => setShowOptional(true)}
                className="w-full py-3 border border-dashed border-slate-350 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-xl text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                + Ajouter des justificatifs (reçu, notes...) (facultatif)
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                    Justification / Notes (facultatif)
                  </label>
                  <textarea
                    placeholder="Raison du mouvement (optionnel)..."
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                    Photo / Scan justificatif (Optionnel)
                  </label>
                  {receiptPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700 max-h-40 flex items-center justify-center bg-slate-50 dark:bg-gray-800">
                      <img src={receiptPreview} alt="Aperçu du justificatif" className="object-contain max-h-40" />
                      <button
                        type="button"
                        onClick={() => setReceiptFile(undefined)}
                        className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-full hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-300 dark:border-gray-700 rounded-xl p-4 text-center hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setReceiptFile(e.target.files?.[0])}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="w-8 h-8 text-slate-400 dark:text-gray-500 mx-auto mb-2" />
                      <span className="text-xs font-semibold text-slate-650 dark:text-gray-300 block">
                        Cliquez pour charger une photo
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          )}

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
              disabled={createTxMutation.isPending}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-350 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              {createTxMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
