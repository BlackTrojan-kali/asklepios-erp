import React, { useState } from "react";
import { X, Play } from "lucide-react";
import type { CashRegisterDto } from "../../../../services/pharmacy/cashRegisterService";

interface OpenCashRegisterSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  register: CashRegisterDto | null;
  onSubmit: (openingBalance: number) => void;
  isPending: boolean;
  currency: string;
}

export default function OpenCashRegisterSessionModal({
  isOpen,
  onClose,
  register,
  onSubmit,
  isPending,
  currency,
}: OpenCashRegisterSessionModalProps) {
  const [openingBalance, setOpeningBalance] = useState<number | "">("");

  if (!isOpen || !register) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (openingBalance === "") return;
    onSubmit(openingBalance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Play className="h-5 w-5 text-emerald-650" /> Ouvrir la session
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
              Caisse de destination : <span className="font-bold text-slate-700 dark:text-gray-300">{register.name}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Solde d'ouverture initial ({currency}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={openingBalance}
                  onChange={(e) => {
                    const val = e.target.value;
                    setOpeningBalance(val === "" ? "" : parseFloat(val));
                  }}
                  min="0"
                  placeholder="Saisissez le fond de caisse initial..."
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-hidden focus:ring-2 focus:ring-teal-500 bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 text-sm text-slate-800 dark:text-white transition-all font-mono"
                />
                <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1.5">
                  Veuillez renseigner le montant exact en espèces présent dans la caisse physique à l'ouverture.
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
              disabled={isPending || openingBalance === ""}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {isPending ? "Ouverture..." : "Confirmer l'ouverture"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
