import React, { useState, useEffect } from "react";
import { X, Loader2, Download, ExternalLink } from "lucide-react";
import Swal from "sweetalert2";
import api from "../../../../api/api";

interface SaleReceiptPreviewModalProps {
  isOpen: boolean;
  saleId: number;
  onClose: () => void;
}

export default function SaleReceiptPreviewModal({
  isOpen,
  saleId,
  onClose,
}: SaleReceiptPreviewModalProps) {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !saleId) return;

    const fetchPdf = async () => {
      try {
        setLoadingPdf(true);
        const response = await api.get(
          `/pharmacy/pos-sales/${saleId}/pdf`,
          {
            responseType: "blob",
          },
        );
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        setPdfBlobUrl(url);
      } catch (err) {
        console.error("Erreur de chargement du PDF:", err);
        Swal.fire({
          icon: "error",
          title: "Erreur PDF",
          text: "Impossible de charger la facture PDF.",
          confirmButtonColor: "#ef4444",
        });
      } finally {
        setLoadingPdf(false);
      }
    };

    fetchPdf();

    return () => {
      if (pdfBlobUrl) {
        window.URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [isOpen, saleId]);

  // Clean up blob URL on unmount or URL replacement
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        window.URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (pdfBlobUrl) {
      const link = document.createElement("a");
      link.href = pdfBlobUrl;
      link.setAttribute("download", `Facture_Vente_${saleId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const handleOpenNewTab = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 dark:bg-gray-900 font-sans text-slate-800 dark:text-gray-250 animate-in fade-in duration-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Facture de Vente Générée</span>
            <span className="text-sm bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded-md font-mono">
              N° #{saleId}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
            Prévisualisation complète du document de facturation
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 dark:hover:bg-gray-750 rounded-xl text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors cursor-pointer border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xs"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Area - Expanded to take maximum space */}
      <div className="flex-1 p-6 bg-slate-50 dark:bg-gray-950 flex flex-col overflow-hidden">
        {loadingPdf ? (
          <div className="flex-1 flex flex-col justify-center items-center bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-850 rounded-2xl shadow-sm">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mb-3" />
            <span className="text-base text-slate-600 dark:text-gray-300 font-semibold">
              Génération de la facture PDF en cours...
            </span>
            <p className="text-xs text-slate-400 mt-1">Veuillez patienter quelques instants.</p>
          </div>
        ) : pdfBlobUrl ? (
          <div className="flex-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-850 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <iframe
              src={pdfBlobUrl}
              className="w-full flex-1 border-none bg-white"
              title="Aperçu Facture"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-850 rounded-2xl shadow-sm text-slate-400">
            <span className="text-base font-semibold text-slate-500">
              Impossible de générer l'aperçu de la facture.
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-white dark:bg-gray-800 border-t border-slate-200 dark:border-gray-700 flex justify-end gap-3 shadow-md">
        <button
          onClick={handleDownload}
          disabled={!pdfBlobUrl}
          className="px-5 py-2.5 border border-slate-350 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-750 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Télécharger la facture
        </button>
        <button
          onClick={handleOpenNewTab}
          disabled={!pdfBlobUrl}
          className="px-5 py-2.5 border border-slate-350 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-750 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Ouvrir dans un nouvel onglet
        </button>
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-sm"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
