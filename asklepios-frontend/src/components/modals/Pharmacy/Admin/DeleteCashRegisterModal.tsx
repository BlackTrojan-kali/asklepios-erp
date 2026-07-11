import React from "react";
import { X, AlertCircle } from "lucide-react";
import type { CashRegisterDto } from "../../../../services/pharmacy/cashRegisterService";

interface DeleteCashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  register: CashRegisterDto | null;
  onConfirm: () => void;
  isPending: boolean;
}

export default function DeleteCashRegisterModal({
  isOpen,
  onClose,
  register,
  onConfirm,
  isPending,
}: DeleteCashRegisterModalProps) {
  if (!isOpen || !register) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-950/30 text-red-600 rounded-xl">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Supprimer la caisse ?
            </h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Êtes-vous sûr de vouloir supprimer la caisse{" "}
            <span className="font-bold text-slate-800 dark:text-white">
              {register.name}
            </span>{" "}
            ? Cette action est irréversible.
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-gray-900/60 p-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-750">
          <button
            onClick={onClose}
            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Suppression..." : "Supprimer définitivement"}
          </button>
        </div>
      </div>
    </div>
  );
}
