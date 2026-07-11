import React, { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import {
  Search,
  Calendar,
  CreditCard,
  FileText,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Eye,
  Filter,
  DollarSign,
  Inbox,
  User,
  Building2,
  Terminal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import {
  useAdminPosSales,
  useAdminSellers,
} from "../../../../hooks/pharmacy/usePosSale";
import { useBranches } from "../../../../hooks/pharmacy/useBranche";
import { useCashRegisters } from "../../../../hooks/pharmacy/useCashRegister";
import api from "../../../../api/api";
import { type PosSaleDto } from "../../../../services/pharmacy/posSaleService";
import SaleDetailModal from "../../../../components/modals/Pharmacy/Admin/SaleDetailModal";
import AdminSaleInvoicePreviewModal from "../../../../components/modals/Pharmacy/Admin/AdminSaleInvoicePreviewModal";

function TableSkeleton() {
  return (
    <tbody className="divide-y divide-slate-100 dark:divide-gray-700 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <tr key={i} className="bg-white dark:bg-gray-800">
          <td className="p-4">
            <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-16" />
          </td>
          <td className="p-4">
            <div className="h-4 bg-slate-150 dark:bg-gray-750 rounded w-28" />
          </td>
          <td className="p-4">
            <div className="h-4 bg-slate-100 dark:bg-gray-800 rounded w-24" />
          </td>
          <td className="p-4">
            <div className="h-4 bg-slate-150 dark:bg-gray-750 rounded w-32" />
          </td>
          <td className="p-4">
            <div className="h-4 bg-slate-100 dark:bg-gray-800 rounded w-20" />
          </td>
          <td className="p-4">
            <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-16" />
          </td>
          <td className="p-4">
            <div className="h-4 bg-slate-100 dark:bg-gray-800 rounded w-12" />
          </td>
          <td className="p-4">
            <div className="h-4 bg-slate-150 dark:bg-gray-750 rounded w-20" />
          </td>
          <td className="p-4">
            <div className="h-8 bg-slate-200 dark:bg-gray-700 rounded w-16 mx-auto" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export default function PosSalesHistory() {
  // --- ÉTATS DES FILTRES ---
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(
    undefined,
  );
  const [selectedRegisterId, setSelectedRegisterId] = useState<
    number | undefined
  >(undefined);
  const [selectedSellerId, setSelectedSellerId] = useState<number | undefined>(
    undefined,
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);

  // --- ÉTATS DES MODALES ---
  const [selectedSale, setSelectedSale] = useState<PosSaleDto | null>(null);
  const [previewPdfSaleId, setPreviewPdfSaleId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  // --- DONNÉES DE CONFIGURATION DES SÉLECTEURS ---
  const { data: branches = [] } = useBranches();
  const { data: registers = [] } = useCashRegisters(selectedBranchId || 0);
  const { data: sellers = [] } = useAdminSellers();

  // --- HOOK DE RÉCUPÉRATION DES VENTES (ADMIN) ---
  const {
    data: paginatedData,
    isLoading,
    error,
  } = useAdminPosSales({
    pharmacy_branch_id: selectedBranchId,
    cash_register_id: selectedRegisterId,
    user_id: selectedSellerId,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    search: search || undefined,
    page,
    per_page: perPage,
  });

  const sales = paginatedData?.sales?.data || [];
  const paginationData = paginatedData?.sales;
  const currency =
    sales?.[0]?.session?.register?.branch?.country?.currency || "XAF";

  // Réinitialiser la page à 1 si un filtre change
  useEffect(() => {
    setPage(1);
  }, [
    selectedBranchId,
    selectedRegisterId,
    selectedSellerId,
    startDate,
    endDate,
    search,
  ]);

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? parseInt(e.target.value) : undefined;
    setSelectedBranchId(val);
    setSelectedRegisterId(undefined); // Clear register when branch changes
  };

  // --- RÉINITIALISATION DES FILTRES ---
  const handleResetFilters = () => {
    setSelectedBranchId(undefined);
    setSelectedRegisterId(undefined);
    setSelectedSellerId(undefined);
    setStartDate("");
    setEndDate("");
    setSearch("");
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Filtres réinitialisés",
      showConfirmButton: false,
      timer: 1500,
    });
  };

  // --- EXPORTATION ---
  const handleExport = async (format: "pdf" | "excel") => {
    try {
      setExporting(true);
      const params = {
        pharmacy_branch_id: selectedBranchId,
        cash_register_id: selectedRegisterId,
        user_id: selectedSellerId,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search: search || undefined,
      };

      const endpoint = `/admin/pharmacy/pos-sales/export/${format}`;
      const filename = `ventes_pos_${Date.now()}.${format === "excel" ? "xlsx" : "pdf"}`;

      const response = await api.get(endpoint, {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Export ${format.toUpperCase()} réussi`,
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Erreur d'exportation",
        text: `Impossible de générer le fichier ${format.toUpperCase()}.`,
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setExporting(false);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < (paginationData?.last_page || 1)) setPage(page + 1);
  };

  // --- CALCUL DES TOTALS POUR LE RAPPORT DE LA PAGE ---
  const pageStats = useMemo(() => {
    const totalCount = paginationData?.total || 0;
    const totalRevenue = paginatedData?.total_amount_sum || 0;
    return {
      totalCount,
      totalRevenue,
    };
  }, [paginatedData, paginationData]);

  return (
    <div className="p-6 bg-slate-50 dark:bg-gray-900 min-h-screen text-slate-800 dark:text-white transition-colors duration-200">
      {/* En-tête de page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />{" "}
            Historique Global des Ventes POS
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Supervisez et auditez toutes les transactions de ventes réalisées
            dans les succursales de l'hôpital.
          </p>
        </div>
      </div>

      {/* Rapports Synthétiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider">
              Total Transactions
            </p>
            <h3 className="text-2xl font-black font-mono mt-0.5">
              {isLoading ? "---" : pageStats.totalCount}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-teal-100 dark:bg-teal-955 text-teal-650 dark:text-teal-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider">
              Total Vendu (Filtres)
            </p>
            <h3 className="text-2xl font-black font-mono mt-0.5">
              {isLoading
                ? "---"
                : `${pageStats.totalRevenue.toLocaleString()} ${currency}`}
            </h3>
          </div>
        </div>
      </div>

      {/* ================= BLOC DES FILTRES ================= */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-gray-700 mb-6">
        <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wide">
          <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />{" "}
          Filtres avancés d'administration
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            {/* Succursale */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-450 mb-1.5">
                Succursale
              </label>
              <select
                value={selectedBranchId || ""}
                onChange={handleBranchChange}
                className="w-full px-3 py-2 border border-slate-350 dark:border-gray-700 rounded-xl text-sm bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white transition-colors cursor-pointer"
              >
                <option value="">Toutes les succursales</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Caisse */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-455 mb-1.5">
                Caisse
              </label>
              <select
                value={selectedRegisterId || ""}
                onChange={(e) =>
                  setSelectedRegisterId(
                    e.target.value ? parseInt(e.target.value) : undefined,
                  )
                }
                disabled={!selectedBranchId}
                className="w-full px-3 py-2 border border-slate-350 dark:border-gray-700 rounded-xl text-sm bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Toutes les caisses</option>
                {registers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vendeur / Caissier */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-450 mb-1.5">
                Opérateur / Vendeur
              </label>
              <select
                value={selectedSellerId || ""}
                onChange={(e) =>
                  setSelectedSellerId(
                    e.target.value ? parseInt(e.target.value) : undefined,
                  )
                }
                className="w-full px-3 py-2 border border-slate-350 dark:border-gray-700 rounded-xl text-sm bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white transition-colors cursor-pointer"
              >
                <option value="">Tous les vendeurs</option>
                {sellers.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                  >{`${s.first_name} ${s.last_name || ""}`}</option>
                ))}
              </select>
            </div>

            {/* Recherche textuelle */}
            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-455 mb-1.5">
                Recherche rapide
              </label>
              <span className="absolute left-3.5 bottom-2.5 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Ticket (ex: FA-000001), client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-350 dark:border-gray-700 rounded-xl text-sm bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            {/* Du Date */}
            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-455 mb-1.5">
                Ventes du (Date)
              </label>
              <span className="absolute left-3.5 bottom-2.5 text-slate-400">
                <Calendar className="w-4 h-4 pointer-events-none" />
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-3 py-1.5 border border-slate-350 dark:border-gray-700 rounded-xl text-sm bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white transition-colors"
              />
            </div>

            {/* Au Date */}
            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-455 mb-1.5">
                Au (Date)
              </label>
              <span className="absolute left-3.5 bottom-2.5 text-slate-400">
                <Calendar className="w-4 h-4 pointer-events-none" />
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-3 py-1.5 border border-slate-350 dark:border-gray-700 rounded-xl text-sm bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white transition-colors"
              />
            </div>

            {/* Reset */}
            <div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-750 dark:text-gray-250 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs cursor-pointer h-[38px]"
              >
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
            </div>

            {/* Actions d'exportation */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleExport("excel")}
                disabled={exporting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs cursor-pointer h-[38px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button
                type="button"
                onClick={() => handleExport("pdf")}
                disabled={exporting}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs cursor-pointer h-[38px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= TABLEAU DE L'HISTORIQUE ================= */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-slate-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 dark:bg-gray-850 text-slate-400 dark:text-gray-455 uppercase font-bold tracking-wider border-b border-slate-150 dark:border-gray-700">
                <tr>
                  <th className="p-4 text-xs">Ticket</th>
                  <th className="p-4 text-xs">Date</th>
                  <th className="p-4 text-xs">Succursale</th>
                  <th className="p-4 text-xs">Caisse</th>
                  <th className="p-4 text-xs">Client</th>
                  <th className="p-4 text-xs">Vendeur</th>
                  <th className="p-4 text-xs text-center">Règlement</th>
                  <th className="p-4 text-xs text-right">Montant</th>
                  <th className="p-4 text-xs text-center">Actions</th>
                </tr>
              </thead>
              <TableSkeleton />
            </table>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-60" />
            <p className="font-semibold text-sm">
              Une erreur est survenue lors de la récupération des ventes.
            </p>
          </div>
        ) : sales.length === 0 ? (
          <div className="p-16 text-center text-slate-400 dark:text-gray-500">
            <Inbox className="w-16 h-16 mx-auto mb-3 opacity-40 text-emerald-600 dark:text-emerald-500 animate-bounce" />
            <h4 className="font-black text-slate-800 dark:text-white text-base">
              Aucune vente trouvée
            </h4>
            <p className="text-xs mt-1 text-slate-400">
              Modifiez vos filtres ou effectuez une nouvelle recherche.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 dark:bg-gray-850 text-slate-400 dark:text-gray-455 uppercase font-bold tracking-wider border-b border-slate-150 dark:border-gray-700">
                <tr>
                  <th className="p-4 text-xs">Ticket</th>
                  <th className="p-4 text-xs">Date</th>
                  <th className="p-4 text-xs">Succursale</th>
                  <th className="p-4 text-xs">Caisse</th>
                  <th className="p-4 text-xs">Client</th>
                  <th className="p-4 text-xs">Vendeur</th>
                  <th className="p-4 text-xs text-center">Règlement</th>
                  <th className="p-4 text-xs text-right">Montant</th>
                  <th className="p-4 text-xs text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {sales.map((sale) => {
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
                      <td className="p-4 text-slate-655 dark:text-gray-400 text-xs">
                        {saleDate.toLocaleDateString("fr-FR")} à{" "}
                        {saleDate.toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {sale.branch?.name || "N/A"}
                      </td>
                      <td className="p-4 text-xs text-slate-500 dark:text-gray-400">
                        <Terminal className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                        {sale.session?.register?.name || "Caisse"}
                      </td>
                      <td className="p-4 text-xs">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-gray-200">
                            {sale.customer_name || "Anonyme"}
                          </span>
                          {sale.patient && (
                            <span className="text-[10px] text-teal-605 dark:text-teal-400 font-mono mt-0.5">
                              Code : {sale.patient.patient_code}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-500 dark:text-gray-400">
                        <User className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                        {sale.session?.user
                          ? `${sale.session.user.first_name} ${sale.session.user.last_name || ""}`
                          : "Caissier"}
                      </td>

                      {/* Moyen de paiement */}
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold
                          ${sale.payment_method === "CASH" ? "bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400" : ""}
                          ${sale.payment_method === "MOBILE_MONEY" ? "bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400" : ""}
                          ${sale.payment_method === "CARD" ? "bg-purple-100 dark:bg-purple-950/20 text-purple-800 dark:text-purple-400" : ""}
                        `}
                        >
                          <CreditCard className="w-3 h-3" />
                          {sale.payment_method === "CASH"
                            ? "Espèces"
                            : sale.payment_method === "MOBILE_MONEY"
                              ? "Momo"
                              : "Carte"}
                        </span>
                      </td>

                      <td className="p-4 text-right font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {sale.total_amount.toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedSale(sale)}
                            className="p-1.5 text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                            title="Détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPreviewPdfSaleId(sale.id)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                            title="Re-imprimer"
                          >
                            <Printer className="w-4 h-4" />
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

        {/* Pagination controls */}
        {paginationData && paginationData.last_page > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-755 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-gray-850/30">
            <span className="text-xs text-slate-500 dark:text-gray-400">
              Affichage de {paginationData.from || 0} à {paginationData.to || 0}{" "}
               sur {paginationData.total} ventes
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="p-2 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-gray-300 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                Page {page} sur {paginationData.last_page}
              </span>
              <button
                onClick={handleNextPage}
                disabled={page === paginationData.last_page}
                className="p-2 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-gray-300 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modale Détails Vente Isolée */}
      <SaleDetailModal
        isOpen={selectedSale !== null}
        onClose={() => setSelectedSale(null)}
        sale={selectedSale}
        currency={currency}
        onReprint={(saleId) => setPreviewPdfSaleId(saleId)}
      />

      {/* Modale Preview PDF Facture Isolée */}
      <AdminSaleInvoicePreviewModal
        isOpen={previewPdfSaleId !== null}
        onClose={() => setPreviewPdfSaleId(null)}
        saleId={previewPdfSaleId}
      />
    </div>
  );
}
