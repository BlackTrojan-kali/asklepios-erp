import React, { useState } from "react";
import { X, Landmark } from "lucide-react";

interface CreateCashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, merchantCode: string) => void;
  isPending: boolean;
}

export default function CreateCashRegisterModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: CreateCashRegisterModalProps) {
  const [name, setName] = useState("");
  const [merchantCode, setMerchantCode] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name, merchantCode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Landmark className="h-5 w-5 text-teal-600" /> Ajouter une caisse
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg text-slate-400 dark:text-gray-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Nom de la caisse
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Caisse Principale, Comptoir A..."
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-hidden focus:ring-2 focus:ring-teal-500 bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 text-sm text-slate-800 dark:text-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Code Marchand / Caisse
                </label>
                <input
                  type="text"
                  value={merchantCode}
                  onChange={(e) => setMerchantCode(e.target.value)}
                  placeholder="ex: CODE-CAISSE-1..."
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-hidden focus:ring-2 focus:ring-teal-500 bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 text-sm text-slate-800 dark:text-white transition-all font-mono"
                />
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
              disabled={isPending || !name.trim()}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {isPending ? "Création..." : "Ajouter la caisse"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
