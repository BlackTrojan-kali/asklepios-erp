import React, { useState, useEffect } from "react";
import { X, Power, AlertCircle } from "lucide-react";
import type { CashRegisterDto } from "../../../../services/pharmacy/cashRegisterService";

interface CloseCashRegisterSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  register: CashRegisterDto | null;
  onSubmit: (closingBalance: number) => void;
  isPending: boolean;
  currency: string;
}

export default function CloseCashRegisterSessionModal({
  isOpen,
  onClose,
  register,
  onSubmit,
  isPending,
  currency,
}: CloseCashRegisterSessionModalProps) {
  const [closingBalance, setClosingBalance] = useState<number | "">("");

  useEffect(() => {
    if (register) {
      setClosingBalance(register.balance);
    }
  }, [register]);

  if (!isOpen || !register) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (closingBalance === "") return;
    onSubmit(closingBalance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Power className="h-5 w-5 text-rose-600" /> Fermer la session
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg text-slate-400 dark:text-gray-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              Caisse : <span className="font-bold text-slate-700 dark:text-gray-300">{register.name}</span>
            </p>

            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-gray-900/60 rounded-xl p-3 flex justify-between items-center text-xs border border-slate-150 dark:border-gray-750">
                <span className="text-gray-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-blue-500" /> Solde calculé (théorique)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">
                  {register.balance.toLocaleString()} {currency}
                </span>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Solde de clôture réel ({currency}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={closingBalance}
                  onChange={(e) => {
                    const val = e.target.value;
                    setClosingBalance(val === "" ? "" : parseFloat(val));
                  }}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-hidden focus:ring-2 focus:ring-teal-500 bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 text-sm text-slate-800 dark:text-white transition-all font-mono"
                />
                <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1.5">
                  Veuillez déclarer le montant réel d'espèces présent dans le tiroir-caisse à la clôture de la session.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-gray-900/60 p-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-750">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending || closingBalance === ""}
              className="px-4 py-2 bg-rose-650 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {isPending ? "Clôture..." : "Confirmer la clôture"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
