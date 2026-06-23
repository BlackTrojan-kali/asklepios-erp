import React from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateSaleModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl p-6 shadow-xl border border-transparent dark:border-gray-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">
          Nouveau Vente
        </h2>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            Annuler
          </button>
          <button className="px-6 py-2 bg-[#00a896] text-white rounded-md hover:bg-[#008f7e] disabled:opacity-50 transition-colors">
            Vendre
          </button>
        </div>
      </div>
    </div>
  );
};
