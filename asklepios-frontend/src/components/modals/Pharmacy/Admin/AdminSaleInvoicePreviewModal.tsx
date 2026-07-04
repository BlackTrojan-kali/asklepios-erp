import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import api from "../../../../api/api";

interface AdminSaleInvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: number | null;
}

export default function AdminSaleInvoicePreviewModal({
  isOpen,
  onClose,
  saleId,
}: AdminSaleInvoicePreviewModalProps) {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  useEffect(() => {
    if (isOpen && saleId !== null) {
      const fetchPdf = async () => {
        try {
          setLoadingPdf(true);
          const response = await api.get(
            `/pharmacy/pos-sales/${saleId}/pdf`,
            {
              responseType: "blob",
            }
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
          onClose();
        } finally {
          setLoadingPdf(false);
        }
      };
      fetchPdf();
    } else {
      if (pdfBlobUrl) {
        window.URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
    }
  }, [isOpen, saleId]);

  // Clean up URL on unmount
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        window.URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  if (!isOpen || saleId === null) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-xl max-w-3xl w-full overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 dark:border-gray-750 flex justify-between items-center bg-slate-50/50 dark:bg-gray-900/10">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Réimpression de la Facture
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-650 dark:hover:text-gray-250 p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 bg-slate-100 dark:bg-gray-900 relative">
          {loadingPdf ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-slate-600 dark:text-gray-400">
                Génération du reçu PDF...
              </span>
            </div>
          ) : pdfBlobUrl ? (
            <iframe
              src={pdfBlobUrl}
              className="w-full h-full border-none bg-white"
              title="Aperçu Facture"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
              Chargement du PDF échoué.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
