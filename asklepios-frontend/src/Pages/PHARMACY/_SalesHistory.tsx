import { useState, useMemo } from "react";
import Swal from "sweetalert2";
import {
  Search,
  Calendar,
  CreditCard,
  FileText,
  Printer,
  Trash2,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Filter,
  DollarSign,
} from "lucide-react";

// --- TYPES ---
interface SaleRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  cashierName: string;
  paymentMethod: "CASH" | "MOBILE_MONEY" | "CARD";
  hasPrescription: boolean;
  subtotal: number;
  discount: number;
  total: number;
  status: "COMPLETED" | "CANCELLED";
}

// --- DONNÉES STATIQUES DE TEST ---
const MOCK_SALES: SaleRecord[] = [
  {
    id: "VTE-2026-001",
    invoiceNumber: "FAC-260623-01",
    date: "2026-06-23 10:15",
    customerName: "Client Passage",
    cashierName: "M. Amadou",
    paymentMethod: "CASH",
    hasPrescription: false,
    subtotal: 5000,
    discount: 500,
    total: 4500,
    status: "COMPLETED",
  },
  {
    id: "VTE-2026-002",
    invoiceNumber: "FAC-260623-02",
    date: "2026-06-23 11:30",
    customerName: "Jean-Pierre Ngo",
    cashierName: "M. Amadou",
    paymentMethod: "MOBILE_MONEY",
    hasPrescription: true,
    subtotal: 8300,
    discount: 0,
    total: 8300,
    status: "COMPLETED",
  },
  {
    id: "VTE-2026-003",
    invoiceNumber: "FAC-260622-15",
    date: "2026-06-22 16:45",
    customerName: "Client Passage",
    cashierName: "Mme. Bella",
    paymentMethod: "CARD",
    hasPrescription: false,
    subtotal: 12000,
    discount: 1200,
    total: 10800,
    status: "CANCELLED",
  },
  {
    id: "VTE-2026-004",
    invoiceNumber: "FAC-260622-16",
    date: "2026-06-22 17:10",
    customerName: "Oumarou Sanda",
    cashierName: "Mme. Bella",
    paymentMethod: "CASH",
    hasPrescription: true,
    subtotal: 24500,
    discount: 0,
    total: 24500,
    status: "COMPLETED",
  },
];

export default function _SalesHistory() {
  // --- ÉTATS DES FILTRES ---
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [prescriptionFilter, setPrescriptionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // --- RÉINITIALISATION DES FILTRES ---
  const handleResetFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setMethodFilter("");
    setPrescriptionFilter("");
    setStatusFilter("");
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Filtres réinitialisés",
      showConfirmButton: false,
      timer: 1500,
    });
  };

  // --- ACTIONS ---
  const handlePrintReceipt = (invoiceNumber: string) => {
    Swal.fire({
      title: "Réimpression",
      text: `Lancement de l'impression pour le ticket ${invoiceNumber}...`,
      icon: "info",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const handleCancelSale = (id: string, invoiceNumber: string) => {
    Swal.fire({
      title: "Annuler cette vente ?",
      text: `Attention, cette action va invalider la facture ${invoiceNumber} et réintégrer les produits en stock.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Oui, annuler la vente",
      cancelButtonText: "Retour",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Vente annulée !",
          text: "Le statut de la facture a été mis à jour.",
          icon: "success",
          confirmButtonColor: "#10b981",
        });
      }
    });
  };

  // --- LOGIQUE DE FILTRAGE ---
  const filteredSales = useMemo(() => {
    return MOCK_SALES.filter((sale) => {
      const matchesSearch =
        sale.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        sale.customerName.toLowerCase().includes(search.toLowerCase()) ||
        sale.cashierName.toLowerCase().includes(search.toLowerCase());

      const matchesMethod = methodFilter
        ? sale.paymentMethod === methodFilter
        : true;
      const matchesStatus = statusFilter ? sale.status === statusFilter : true;

      const matchesPrescription =
        prescriptionFilter === "YES"
          ? sale.hasPrescription
          : prescriptionFilter === "NO"
            ? !sale.hasPrescription
            : true;

      // Filtrage par date (découpage simple basé sur la chaîne YYYY-MM-DD)
      const saleDateOnly = sale.date.split(" ")[0];
      const matchesStartDate = startDate ? saleDateOnly >= startDate : true;
      const matchesEndDate = endDate ? saleDateOnly <= endDate : true;

      return (
        matchesSearch &&
        matchesMethod &&
        matchesPrescription &&
        matchesStatus &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    search,
    startDate,
    endDate,
    methodFilter,
    prescriptionFilter,
    statusFilter,
  ]);

  // --- TOTAL DES VENTES FILTRÉES (uniquement complétées) ---
  const totalRevenue = useMemo(() => {
    return filteredSales
      .filter((s) => s.status === "COMPLETED")
      .reduce((sum, s) => sum + s.total, 0);
  }, [filteredSales]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* En-tête de page */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Historique des Ventes
          </h1>
          <p className="text-sm text-slate-500">
            Consultez, filtrez et gérez les encaissements passés
          </p>
        </div>

        {/* Affichage rapide du CA de la sélection */}
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-md flex items-center gap-3">
          <div className="p-2 bg-emerald-700 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
              Total Sélection (Actives)
            </p>
            <h3 className="text-lg font-black font-mono">
              {totalRevenue.toLocaleString()} XAF
            </h3>
          </div>
        </div>
      </div>

      {/* ================= BLOC DES FILTRES ================= */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 mb-6">
        <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold text-sm uppercase tracking-wide">
          <Filter className="w-4 h-4 text-emerald-600" /> Filtres de recherche
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Recherche textuelle */}
          <div className="md:col-span-3 relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Recherche globale
            </label>
            <Search className="absolute left-3 top-8 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Facture, client, caissier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Date de début */}
          <div className="md:col-span-2 relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Du (Date)
            </label>
            <Calendar className="absolute left-3 top-8 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Date de fin */}
          <div className="md:col-span-2 relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Au (Date)
            </label>
            <Calendar className="absolute left-3 top-8 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Règlement */}
          <div className="md:col-span-1.5">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Règlement
            </label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">Tous</option>
              <option value="CASH">Espèces</option>
              <option value="MOBILE_MONEY">Momo/OM</option>
              <option value="CARD">Carte</option>
            </select>
          </div>

          {/* Ordonnance */}
          <div className="md:col-span-1.5">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Ordonnance
            </label>
            <select
              value={prescriptionFilter}
              onChange={(e) => setPredictionFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">Tous</option>
              <option value="YES">Présente</option>
              <option value="NO">Absente</option>
            </select>
          </div>

          {/* Statut */}
          <div className="md:col-span-1.5">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">Tous</option>
              <option value="COMPLETED">Validée</option>
              <option value="CANCELLED">Annulée</option>
            </select>
          </div>

          {/* Bouton de Reset */}
          <div className="md:col-span-1 flex justify-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs cursor-pointer shadow-xs"
              title="Vider les filtres"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* ================= LISTE DES FACTURES / TABLEAU ================= */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 p-3 font-semibold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="p-4">Réf. Facture</th>
                <th className="p-4">Date & Heure</th>
                <th className="p-4">Client</th>
                <th className="p-4">Caissier</th>
                <th className="p-4 text-center">Règlement</th>
                <th className="p-4 text-center">Ordonnance</th>
                <th className="p-4 text-right">Total (XAF)</th>
                <th className="p-4 text-center">Statut</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Aucune transaction ne correspond aux critères de filtrage.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-slate-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="p-4 text-slate-600">{sale.date}</td>
                    <td className="p-4 font-medium text-slate-700">
                      {sale.customerName}
                    </td>
                    <td className="p-4 text-slate-500">{sale.cashierName}</td>

                    {/* Badge Moyen de paiement */}
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md font-medium
                        ${sale.paymentMethod === "CASH" ? "bg-emerald-50 text-emerald-700" : ""}
                        ${sale.paymentMethod === "MOBILE_MONEY" ? "bg-blue-50 text-blue-700" : ""}
                        ${sale.paymentMethod === "CARD" ? "bg-purple-50 text-purple-700" : ""}
                      `}
                      >
                        <CreditCard className="w-3 h-3" />
                        {sale.paymentMethod === "CASH"
                          ? "Espèces"
                          : sale.paymentMethod === "MOBILE_MONEY"
                            ? "Momo/OM"
                            : "Carte"}
                      </span>
                    </td>

                    {/* Badge Ordonnance */}
                    <td className="p-4 text-center">
                      {sale.hasPrescription ? (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-md font-medium">
                          <FileText className="w-3 h-3" /> Présente
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-normal">
                          Aucune
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                      {sale.total.toLocaleString()}
                    </td>

                    {/* Badge Statut */}
                    <td className="p-4 text-center">
                      {sale.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
                          <CheckCircle className="w-3 h-3" /> Validée
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-xs px-2.5 py-1 rounded-full font-bold">
                          <XCircle className="w-3 h-3" /> Annulée
                        </span>
                      )}
                    </td>

                    {/* Actions sur la facture */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() =>
                            Swal.fire({
                              title: `Détails ${sale.invoiceNumber}`,
                              text: "Fenêtre de prévisualisation des articles à coder ultérieurement.",
                              icon: "info",
                            })
                          }
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintReceipt(sale.invoiceNumber)}
                          className="p-1 text-slate-400 hover:text-emerald-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Réimprimer le ticket"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleCancelSale(sale.id, sale.invoiceNumber)
                          }
                          disabled={sale.status === "CANCELLED"}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Annuler la vente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
