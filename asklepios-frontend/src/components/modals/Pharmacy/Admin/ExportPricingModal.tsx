import type { PharmacyBranchDto } from "../../../../types/PharmTypes";
import { FileSpreadsheet, FileText, X } from "lucide-react";

interface ExportPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportFormat: "excel" | "pdf";
  exportTarget: "all" | "single";
  setExportTarget: (target: "all" | "single") => void;
  selectedExportBranchId: number | null;
  setSelectedExportBranchId: (id: number | null) => void;
  branches: PharmacyBranchDto[] | undefined;
  onConfirmExport: () => void;
  isExporting: boolean;
}

export default function ExportPricingModal({
  isOpen,
  onClose,
  exportFormat,
  exportTarget,
  setExportTarget,
  selectedExportBranchId,
  setSelectedExportBranchId,
  branches,
  onConfirmExport,
  isExporting,
}: ExportPricingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-150 dark:border-gray-700 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            {exportFormat === "excel" ? (
              <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <FileText className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            )}
            Exporter la Tarification (
            {exportFormat === "excel" ? "Excel" : "PDF"})
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 transition-colors p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Générez une fiche tarifaire au format{" "}
            {exportFormat === "excel" ? "Excel" : "PDF"} propre et allégée
            (contenant uniquement le nom des articles et leurs prix de vente
            finaux) prête à être imprimée ou affichée pour les clients.
          </p>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block">
              Périmètre de l'exportation :
            </label>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  name="exportTarget"
                  checked={exportTarget === "all"}
                  onChange={() => setExportTarget("all")}
                  className="text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                Toutes les succursales de pharmacie
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  name="exportTarget"
                  checked={exportTarget === "single"}
                  onChange={() => setExportTarget("single")}
                  className="text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                Une succursale spécifique
              </label>
            </div>
          </div>

          {exportTarget === "single" && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block">
                Sélectionner la pharmacie :
              </label>
              <select
                value={selectedExportBranchId || ""}
                onChange={(e) =>
                  setSelectedExportBranchId(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="w-full text-xs p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-teal-500"
              >
                {branches?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            disabled={
              isExporting ||
              (exportTarget === "single" && !selectedExportBranchId)
            }
            onClick={onConfirmExport}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50 ${
              exportFormat === "excel"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {isExporting ? "Génération..." : "Télécharger"}
          </button>
        </div>
      </div>
    </div>
  );
}
