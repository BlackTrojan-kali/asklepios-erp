import React, { useState, useMemo, useEffect } from "react";
import Swal from "sweetalert2";
import {
  Search,
  Calendar,
  CreditCard,
  FileText,
  Printer,
  RefreshCw,
  Eye,
  Filter,
  DollarSign,
  X,
  Loader2,
  Inbox,
  User,
} from "lucide-react";
import { usePosSales } from "../../hooks/pharmacy/usePosSale";
import api from "../../api/api";
import { type PosSaleDto } from "../../services/pharmacy/posSaleService";

export default function SalesHistory() {
  // --- ÉTATS DES FILTRES ---
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  // --- ÉTATS DES MODALES ---
  const [selectedSale, setSelectedSale] = useState<PosSaleDto | null>(null);
  const [previewPdfSaleId, setPreviewPdfSaleId] = useState<number | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  // --- HOOK DE RÉCUPÉRATION DES DONNÉES ---
  const {
    data: sales = [],
    isLoading,
    error,
    refetch,
  } = usePosSales({
    scope: "my-active-session",
    payment_method: paymentMethod || undefined,
  });

  const currency =
    sales?.[0]?.session?.register?.branch?.country?.currency || "XAF";

  // --- CHARGEMENT DU PDF POUR IMPRESSION/PRÉVISUALISATION ---
  useEffect(() => {
    if (previewPdfSaleId !== null) {
      const fetchPdf = async () => {
        try {
          setLoadingPdf(true);
          const response = await api.get(
            `/pharmacy/pos-sales/${previewPdfSaleId}/pdf`,
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
          setPreviewPdfSaleId(null);
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
  }, [previewPdfSaleId]);

  // --- FILTRAGE LOCAL (RECHERCHE TEXTUELLE) ---
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchesSearch =
        sale.receipt_number?.toLowerCase().includes(search.toLowerCase()) ||
        sale.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        sale.prescription_ref?.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [sales, search]);

  // --- TOTAL DES VENTES FILTRÉES ---
  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.total_amount, 0);
  }, [filteredSales]);

  // --- RÉINITIALISATION DES FILTRES ---
  const handleResetFilters = () => {
    setSearch("");
    setPaymentMethod("");
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Filtres réinitialisés",
      showConfirmButton: false,
      timer: 1500,
    });
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-gray-900 min-h-screen text-slate-800 dark:text-white transition-colors duration-200">
      {/* En-tête de page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />{" "}
            Ventes de la Session Active
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Consultez et réimprimez les tickets de caisse réalisés depuis l'ouverture de votre session.
          </p>
        </div>

        {/* Affichage rapide du CA */}
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-md flex items-center gap-3 self-stretch md:self-auto justify-center">
          <div className="p-2 bg-emerald-700 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-emerald-200">
              Total Vendu (Session)
            </p>
            <h3 className="text-lg font-black font-mono mt-0.5">
              {isLoading
                ? "---"
                : `${totalRevenue.toLocaleString()} ${currency}`}
            </h3>
          </div>
        </div>
      </div>

      {/* ================= BLOC DES FILTRES ================= */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-gray-700 mb-6">
        <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wide">
          <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />{" "}
          Filtres de recherche
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Recherche rapide */}
          <div className="md:col-span-8 relative">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-455 mb-1.5">
              Recherche rapide
            </label>
            <span className="absolute left-3.5 bottom-2.5 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Ticket, client, ordonnance..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-slate-350 dark:border-gray-700 rounded-xl text-sm bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white transition-colors"
            />
          </div>

          {/* Règlement */}
          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-455 mb-1.5">
              Règlement
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-slate-350 dark:border-gray-700 rounded-xl text-sm bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white transition-colors cursor-pointer"
            >
              <option value="">Tous</option>
              <option value="CASH">Espèces</option>
              <option value="MOBILE_MONEY">Momo/OM</option>
              <option value="CARD">Carte</option>
            </select>
          </div>

          {/* Bouton Reset */}
          <div className="md:col-span-1 flex justify-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-250 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs cursor-pointer h-[38px]"
              title="Vider les filtres"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= TABLEAU DE L'HISTORIQUE ================= */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-slate-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 items-center animate-pulse">
                <div className="h-6 w-28 bg-slate-200 dark:bg-gray-700 rounded" />
                <div className="h-6 w-20 bg-slate-100 dark:bg-gray-750 rounded" />
                <div className="h-6 w-44 bg-slate-200 dark:bg-gray-700 rounded flex-1" />
                <div className="h-6 w-16 bg-slate-100 dark:bg-gray-750 rounded" />
                <div className="h-6 w-24 bg-slate-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500">
            Une erreur est survenue lors de la récupération des ventes.
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-16 text-center text-slate-400 dark:text-gray-500 space-y-3">
            <Inbox className="w-16 h-16 stroke-1 mx-auto text-slate-300 dark:text-gray-600" />
            <h3 className="font-bold text-slate-700 dark:text-gray-300">
              Aucune vente enregistrée
            </h3>
            <p className="text-xs">
              Aucune transaction ne correspond à vos critères de filtrage
              actuels.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-850 p-3 font-semibold text-[10px] uppercase tracking-wider text-slate-400 dark:text-gray-450 border-b border-slate-250 dark:border-gray-750">
                  <th className="p-4">Réf. Ticket</th>
                  <th className="p-4">Date & Heure</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Caissier</th>
                  <th className="p-4 text-center">Règlement</th>
                  <th className="p-4 text-center">Ordonnance</th>
                  <th className="p-4 text-right">Total ({currency})</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700 text-sm">
                {filteredSales.map((sale) => {
                  const saleDate = sale.created_at
                    ? new Date(sale.created_at)
                    : new Date();
                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-gray-750/10 transition-colors"
                    >
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                        {sale.receipt_number}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-gray-400">
                        {saleDate.toLocaleDateString("fr-FR")} à{" "}
                        {saleDate.toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-4 font-medium text-slate-700 dark:text-gray-300">
                        {sale.customer_name || "Client Passage"}
                      </td>
                      <td className="p-4 text-slate-500 dark:text-gray-400 flex items-center gap-1.5 mt-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {sale.session?.user
                          ? `${sale.session.user.first_name} ${sale.session.user.last_name || ""}`
                          : "Caissier"}
                      </td>

                      {/* Moyen de paiement */}
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-md font-bold
                          ${sale.payment_method === "CASH" ? "bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400" : ""}
                          ${sale.payment_method === "MOBILE_MONEY" ? "bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400" : ""}
                          ${sale.payment_method === "CARD" ? "bg-purple-100 dark:bg-purple-950/20 text-purple-800 dark:text-purple-400" : ""}
                        `}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          {sale.payment_method === "CASH"
                            ? "Espèces"
                            : sale.payment_method === "MOBILE_MONEY"
                              ? "Momo/OM"
                              : "Carte"}
                        </span>
                      </td>

                      {/* Ordonnance */}
                      <td className="p-4 text-center">
                        {sale.has_prescription ? (
                          <span className="inline-flex items-center gap-1 bg-cyan-100 dark:bg-cyan-950/20 text-cyan-800 dark:text-cyan-400 text-xs px-2.5 py-0.5 rounded-md font-bold">
                            <FileText className="w-3.5 h-3.5" />{" "}
                            {sale.prescription_ref || "Présente"}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-gray-500 italic">
                            Aucune
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {sale.total_amount.toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedSale(sale)}
                            className="p-1.5 text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                            title="Voir les détails de la vente"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => setPreviewPdfSaleId(sale.id)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                            title="Réimprimer le ticket de caisse"
                          >
                            <Printer className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODALE DÉTAILS VENTE ================= */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-gray-750 flex justify-between items-center bg-slate-50/50 dark:bg-gray-900/10">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Détails Vente - {selectedSale.receipt_number}
                </h3>
                <p className="text-xs text-slate-400 dark:text-gray-400 mt-0.5">
                  Effectuée le{" "}
                  {selectedSale.created_at
                    ? new Date(selectedSale.created_at).toLocaleString("fr-FR")
                    : ""}
                </p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-250 p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Infos générales */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-gray-450 font-bold uppercase tracking-wider block">
                    Client
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white mt-1 block">
                    {selectedSale.customer_name || "Client Passage"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-gray-455 font-bold uppercase tracking-wider block">
                    Méthode Paiement
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white mt-1 block">
                    {selectedSale.payment_method === "CASH"
                      ? "Espèces"
                      : selectedSale.payment_method === "MOBILE_MONEY"
                        ? "Momo/OM"
                        : "Carte"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-gray-455 font-bold uppercase tracking-wider block">
                    Réf Ordonnance
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white mt-1 block">
                    {selectedSale.prescription_ref || "Aucune"}
                  </span>
                </div>
              </div>

              {/* Table des items */}
              <div>
                <span className="text-[10px] text-slate-400 dark:text-gray-455 font-bold uppercase tracking-wider block mb-2">
                  Produits vendus
                </span>
                <div className="border border-slate-150 dark:border-gray-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-gray-850 text-slate-400 dark:text-gray-450 uppercase font-bold tracking-wider border-b border-slate-150 dark:border-gray-700">
                      <tr>
                        <th className="p-3">Article</th>
                        <th className="p-3 text-center">Qté</th>
                        <th className="p-3 text-right">Prix Unit.</th>
                        <th className="p-3 text-right">Remise</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-700 text-slate-700 dark:text-gray-300">
                      {selectedSale.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">
                            {item.article?.name}
                            {item.batch?.batch_number && (
                              <span className="block text-[9px] text-slate-400 dark:text-gray-500 font-normal mt-0.5">
                                Lot : {item.batch.batch_number}{" "}
                                {item.batch.expire_date
                                  ? `(Exp: ${new Date(item.batch.expire_date).toLocaleDateString("fr-FR")})`
                                  : ""}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center font-bold">
                            {item.qty}
                          </td>
                          <td className="p-3 text-right font-mono">
                            {item.unit_price.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-mono text-rose-500">
                            {item.discount > 0
                              ? `-${item.discount.toLocaleString()}`
                              : "0"}
                          </td>
                          <td className="p-3 text-right font-bold font-mono text-slate-900 dark:text-white">
                            {item.sub_total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 bg-slate-50 dark:bg-gray-850 border-t border-slate-150 dark:border-gray-700 flex justify-between items-center">
              <div className="text-left">
                <span className="text-[10px] text-slate-450 dark:text-gray-450 font-bold uppercase tracking-wider block">
                  Montant total
                </span>
                <strong className="text-xl font-mono text-emerald-600 dark:text-emerald-450 font-black">
                  {selectedSale.total_amount.toLocaleString()} {currency}
                </strong>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSale(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setPreviewPdfSaleId(selectedSale.id);
                    setSelectedSale(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Réimprimer Facture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALE PREVIEW PDF ================= */}
      {previewPdfSaleId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-xl max-w-3xl w-full overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-gray-750 flex justify-between items-center bg-slate-50/50 dark:bg-gray-900/10">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Réimpression de la Facture
                </h3>
              </div>
              <button
                onClick={() => setPreviewPdfSaleId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-250 p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Iframe View */}
            <div className="flex-1 bg-slate-100 dark:bg-gray-900 relative">
              {loadingPdf ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
                  <p className="text-sm font-semibold text-slate-500 dark:text-gray-400">
                    Génération du PDF...
                  </p>
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  src={`${pdfBlobUrl}#toolbar=1`}
                  className="w-full h-full border-0"
                  title="Facture PDF"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-rose-500">
                  <X className="w-10 h-10" />
                  <p className="text-sm font-semibold">
                    Impossible de charger le document.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-gray-850 border-t border-slate-150 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setPreviewPdfSaleId(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-350 dark:bg-gray-700 dark:hover:bg-gray-650 text-slate-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Fermer
              </button>
              {pdfBlobUrl && (
                <a
                  href={pdfBlobUrl}
                  download={`facture_vte_${previewPdfSaleId}.pdf`}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Télécharger le PDF
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
