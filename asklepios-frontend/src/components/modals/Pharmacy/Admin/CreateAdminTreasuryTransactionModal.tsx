import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { X, Loader2, ArrowRightLeft, TrendingDown, TrendingUp } from "lucide-react";
import { useCreatePaymentTransaction } from "../../../../hooks/pharmacy/usePaymentTransaction";
import { type PaymentAccountDto } from "../../../../services/pharmacy/paymentAccountService";

interface CreateAdminTreasuryTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBranchId: number;
  accounts: PaymentAccountDto[];
  onSuccess: () => void;
}

export default function CreateAdminTreasuryTransactionModal({
  isOpen,
  onClose,
  selectedBranchId,
  accounts,
  onSuccess,
}: CreateAdminTreasuryTransactionModalProps) {
  // --- ÉTATS ---
  const [manualTxType, setManualTxType] = useState<"cash_in" | "cash_out" | "transfer">("transfer");
  const [manualSourceId, setManualSourceId] = useState<string>("");
  const [manualDestId, setManualDestId] = useState<string>("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualMethod, setManualMethod] = useState<"CASH" | "MOBILE_MONEY" | "CARD">("CASH");
  const [manualRef, setManualRef] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [showOptional, setShowOptional] = useState(false);

  // --- HOOKS ---
  const createTxMutation = useCreatePaymentTransaction(true); // true = admin mode (validated immediately)

  // Reset states on open/close
  useEffect(() => {
    if (!isOpen) {
      setManualTxType("transfer");
      setManualSourceId("");
      setManualDestId("");
      setManualAmount("");
      setManualMethod("CASH");
      setManualRef("");
      setManualDesc("");
      setShowOptional(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) return;

    const amount = parseFloat(manualAmount);
    if (isNaN(amount) || amount <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Montant invalide",
        text: "Veuillez saisir un montant supérieur à 0.",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    if (manualTxType !== "cash_in" && !manualSourceId) {
      Swal.fire({
        icon: "warning",
        title: "Compte source requis",
        text: "Veuillez sélectionner le compte d'origine.",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    if (manualTxType !== "cash_out" && !manualDestId) {
      Swal.fire({
        icon: "warning",
        title: "Compte destination requis",
        text: "Veuillez sélectionner le compte cible.",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    const payload = {
      pharmacy_branch_id: selectedBranchId,
      type: manualTxType,
      payment_method: manualMethod,
      amount,
      source_account_id: manualTxType !== "cash_in" ? parseInt(manualSourceId) : null,
      destination_account_id: manualTxType !== "cash_out" ? parseInt(manualDestId) : null,
      reference: manualRef || null,
      description: manualDesc || null,
      status: "completed" as const,
    };

    createTxMutation.mutate(
      { payload },
      {
        onSuccess: () => {
          Swal.fire({
            icon: "success",
            title: "Mouvement enregistré",
            text: "La transaction de trésorerie a été validée immédiatement.",
            confirmButtonColor: "#10b981",
          });
          onSuccess();
          onClose();
        },
        onError: (err: any) => {
          Swal.fire({
            icon: "error",
            title: "Erreur",
            text: err.response?.data?.message || "Erreur de validation de la transaction.",
            confirmButtonColor: "#ef4444",
          });
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/60">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm md:text-base">
            {manualTxType === "transfer" && <ArrowRightLeft className="w-5 h-5 text-blue-500" />}
            {manualTxType === "cash_in" && <TrendingUp className="w-5 h-5 text-emerald-500" />}
            {manualTxType === "cash_out" && <TrendingDown className="w-5 h-5 text-rose-500" />}
            Nouveau Mouvement Manuel
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-gray-850 rounded-lg text-slate-400 dark:text-gray-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-slate-800 dark:text-gray-200">
          
          {/* Sélecteur de type de mouvement */}
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Type de mouvement
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setManualTxType("transfer");
                  setManualSourceId("");
                  setManualDestId("");
                }}
                className={`py-2.5 px-3 border rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  manualTxType === "transfer"
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-955/20 text-blue-700 dark:text-blue-400 font-extrabold ring-2 ring-blue-500/25"
                    : "border-slate-200 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-850 text-slate-650 dark:text-gray-400"
                }`}
              >
                Transfert / Virement
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualTxType("cash_in");
                  setManualSourceId("");
                  setManualDestId("");
                }}
                className={`py-2.5 px-3 border rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  manualTxType === "cash_in"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-400 font-extrabold ring-2 ring-emerald-500/25"
                    : "border-slate-200 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-850 text-slate-650 dark:text-gray-400"
                }`}
              >
                Apport externe (In)
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualTxType("cash_out");
                  setManualSourceId("");
                  setManualDestId("");
                }}
                className={`py-2.5 px-3 border rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  manualTxType === "cash_out"
                    ? "border-rose-600 bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-455 font-extrabold ring-2 ring-rose-500/25"
                    : "border-slate-200 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-850 text-slate-650 dark:text-gray-400"
                }`}
              >
                Retrait / Dépense (Out)
              </button>
            </div>
          </div>

          {/* Section Comptes Source et Destination côte à côte */}
          {manualTxType === "transfer" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  Compte d'origine (Source)
                </label>
                <select
                  required
                  value={manualSourceId}
                  onChange={(e) => setManualSourceId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-955 border border-slate-350 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-semibold cursor-pointer"
                >
                  <option value="">Sélectionnez la source...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.balance.toLocaleString()} XAF)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  Compte cible (Destination)
                </label>
                <select
                  required
                  value={manualDestId}
                  onChange={(e) => setManualDestId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-955 border border-slate-350 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-semibold cursor-pointer"
                >
                  <option value="">Sélectionnez la cible...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.balance.toLocaleString()} XAF)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                {manualTxType === "cash_in" ? "Compte de Destination" : "Compte de Source"}
              </label>
              <select
                required
                value={manualTxType === "cash_in" ? manualDestId : manualSourceId}
                onChange={(e) => {
                  if (manualTxType === "cash_in") {
                    setManualDestId(e.target.value);
                  } else {
                    setManualSourceId(e.target.value);
                  }
                }}
                className="w-full bg-slate-50 dark:bg-gray-955 border border-slate-350 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-semibold cursor-pointer"
              >
                <option value="">Sélectionnez le compte...</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.balance.toLocaleString()} XAF)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mode de règlement & Montant sur la même ligne */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Mode de règlement
              </label>
              <select
                value={manualMethod}
                onChange={(e) => setManualMethod(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-gray-955 border border-slate-355 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-semibold cursor-pointer"
              >
                <option value="CASH">Espèces (Cash)</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CARD">Carte Bancaire</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Montant du mouvement (XAF)
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="Ex : 50000"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-gray-955 border border-slate-350 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-mono font-bold"
              />
            </div>
          </div>

          {/* Justifications optionnelles toggleable */}
          {!showOptional ? (
            <button
              type="button"
              onClick={() => setShowOptional(true)}
              className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              + Ajouter des justificatifs optionnels (référence, commentaire...)
            </button>
          ) : (
            <div className="space-y-4 pt-1 animate-in fade-in duration-250">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  Référence / Numéro justificatif (Optionnel)
                </label>
                <input
                  type="text"
                  placeholder="N° de chèque, réf MoMo, n° de facture..."
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-955 border border-slate-350 dark:border-gray-805 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  Commentaire / Explication (Optionnel)
                </label>
                <textarea
                  placeholder="Justification ou notes additionnelles..."
                  rows={2}
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-955 border border-slate-350 dark:border-gray-805 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="pt-4 border-t border-slate-100 dark:border-gray-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-slate-300 dark:border-gray-700 hover:bg-slate-150 dark:hover:bg-gray-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createTxMutation.isPending}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {createTxMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Valider le mouvement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
