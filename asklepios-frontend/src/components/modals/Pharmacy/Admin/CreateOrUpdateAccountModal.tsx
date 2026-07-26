import React, { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import Swal from "sweetalert2";
import { useBranches } from "../../../../hooks/pharmacy/useBranche";
import {
  useCreatePaymentAccount,
  useUpdatePaymentAccount,
} from "../../../../hooks/pharmacy/usePaymentAccount";
import { type PaymentAccountDto } from "../../../../services/pharmacy/paymentAccountService";

interface CreateOrUpdateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount: PaymentAccountDto | null;
  selectedBranchId: number | undefined;
  onSuccess: () => void;
}

export default function CreateOrUpdateAccountModal({
  isOpen,
  onClose,
  editingAccount,
  selectedBranchId,
  onSuccess,
}: CreateOrUpdateAccountModalProps) {
  // --- ÉTATS ---
  const [modalBranchId, setModalBranchId] = useState<number | undefined>(
    selectedBranchId,
  );
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<
    "bank" | "mobile_money" | "safe" | "cash_register" | "owner"
  >("bank");
  const [accountNumber, setAccountNumber] = useState("");
  const [initialBalance, setInitialBalance] = useState("0");
  const [accountStatus, setAccountStatus] = useState<"active" | "inactive">(
    "active",
  );

  // --- HOOKS ---
  const { data: branches = [] } = useBranches();
  const createAccountMutation = useCreatePaymentAccount();
  const updateAccountMutation = useUpdatePaymentAccount();

  // Synchroniser les champs du formulaire avec le compte en cours d'édition
  useEffect(() => {
    if (isOpen) {
      if (editingAccount) {
        setModalBranchId(editingAccount.pharmacy_branch_id);
        setAccountName(editingAccount.name);
        setAccountType(editingAccount.type);
        setAccountNumber(editingAccount.account_number || "");
        setInitialBalance(editingAccount.balance.toString());
        setAccountStatus(editingAccount.status);
      } else {
        setModalBranchId(selectedBranchId || branches[0]?.id);
        setAccountName("");
        setAccountType("bank");
        setAccountNumber("");
        setInitialBalance("0");
        setAccountStatus("active");
      }
    }
  }, [isOpen, editingAccount, selectedBranchId, branches]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBranchId = modalBranchId || selectedBranchId;
    if (!finalBranchId) {
      Swal.fire({
        icon: "warning",
        title: "Sélectionnez une succursale",
        text: "Veuillez choisir la succursale rattachée à ce compte.",
        confirmButtonColor: "#10b981",
      });
      return;
    }

    const payload = {
      name: accountName,
      type: accountType,
      pharmacy_branch_id: finalBranchId,
      account_number: accountNumber || null,
      balance: parseFloat(initialBalance) || 0,
      status: accountStatus,
    };

    if (editingAccount) {
      updateAccountMutation.mutate(
        { id: editingAccount.id, payload },
        {
          onSuccess: () => {
            Swal.fire({
              icon: "success",
              title: "Compte modifié",
              text: "Le compte de trésorerie a été mis à jour.",
              confirmButtonColor: "#10b981",
            });
            onSuccess();
            onClose();
          },
          onError: (err: any) => {
            Swal.fire({
              icon: "error",
              title: "Erreur",
              text:
                err.response?.data?.message ||
                "Impossible de modifier le compte.",
              confirmButtonColor: "#ef4444",
            });
          },
        },
      );
    } else {
      createAccountMutation.mutate(payload, {
        onSuccess: () => {
          Swal.fire({
            icon: "success",
            title: "Compte créé",
            text: "Le compte de trésorerie a été enregistré avec succès.",
            confirmButtonColor: "#10b981",
          });
          onSuccess();
          onClose();
        },
        onError: (err: any) => {
          Swal.fire({
            icon: "error",
            title: "Erreur",
            text:
              err.response?.data?.message || "Impossible de créer le compte.",
            confirmButtonColor: "#ef4444",
          });
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/60 text-slate-900 dark:text-white">
          <h3 className="font-bold">
            {editingAccount
              ? "Modifier le compte"
              : "Ajouter un compte financier"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-gray-800 rounded-lg text-slate-400 dark:text-gray-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 text-slate-800 dark:text-gray-200"
        >
          {/* Succursale rattachée */}
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
              Succursale *
            </label>
            <select
              value={modalBranchId || ""}
              onChange={(e) =>
                setModalBranchId(
                  e.target.value ? parseInt(e.target.value) : undefined,
                )
              }
              required
              className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-semibold"
            >
              <option value="">Sélectionnez la succursale...</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
              Type de compte
            </label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-semibold"
            >
              <option value="bank">Banque (Afriland, SG...)</option>
              <option value="mobile_money">Mobile Money (MTN MoMo, OM)</option>
              <option value="safe">Coffre-fort Interne</option>
              <option value="owner">
                Compte Propriétaire / Administrateur
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
              Nom du compte
            </label>
            <input
              type="text"
              required
              placeholder="Nom (ex: Afriland First Bank, Caisse Principale...)"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
              Numéro de compte / Téléphone
            </label>
            <input
              type="text"
              placeholder="N° de compte ou n° de téléphone MoMo (facultatif)"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-mono"
            />
          </div>

          {!editingAccount && (
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Solde Théorique Initial (XAF)
              </label>
              <input
                type="number"
                placeholder="0"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-mono font-bold"
              />
            </div>
          )}

          {editingAccount && (
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Statut
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="accountStatus"
                    checked={accountStatus === "active"}
                    onChange={() => setAccountStatus("active")}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-semibold">Actif</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="accountStatus"
                    checked={accountStatus === "inactive"}
                    onChange={() => setAccountStatus("inactive")}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-semibold text-slate-500">
                    Inactif
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-gray-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={
                createAccountMutation.isPending ||
                updateAccountMutation.isPending
              }
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-350 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              {(createAccountMutation.isPending ||
                updateAccountMutation.isPending) && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
