import { useState, useMemo } from "react";
import Swal from "sweetalert2";
import {
  Search,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  ArrowUpRight,
  TrendingUp,
  XCircle,
  Building,
  User,
} from "lucide-react";

// --- TYPES ---
interface DepositRecord {
  id: string;
  reference: string;
  date: string;
  amount: number;
  type: "BANK_DEPOSIT" | "CASH_COUNT" | "PARTNER_PAYMENT";
  destinationAccount: string;
  operatorName: string;
  status: "VALIDATED" | "PENDING" | "REJECTED";
  notes?: string;
}

// --- DONNÉES STATIQUES DE TEST ---
const MOCK_DEPOSITS: DepositRecord[] = [
  {
    id: "VERS-2026-001",
    reference: "VRM-Afriland-901",
    date: "2026-06-23 09:00",
    amount: 450000,
    type: "BANK_DEPOSIT",
    destinationAccount: "Afriland First Bank - Compte Principal",
    operatorName: "M. Amadou",
    status: "VALIDATED",
    notes: "Versement des espèces de la veille",
  },
  {
    id: "VERS-2026-002",
    reference: "VERS-MOMO-234",
    date: "2026-06-22 18:30",
    amount: 125000,
    type: "CASH_COUNT",
    destinationAccount: "Coffre Fort Fort",
    operatorName: "Mme. Bella",
    status: "VALIDATED",
    notes: "Clôture de caisse du soir",
  },
  {
    id: "VERS-2026-003",
    reference: "VRM-UBA-551",
    date: "2026-06-21 11:15",
    amount: 800000,
    type: "BANK_DEPOSIT",
    destinationAccount: "UBA Cameroon - Compte Dev",
    operatorName: "Fotié Martial",
    status: "PENDING",
    notes: "Transfert pour provisionnement fournisseurs",
  },
  {
    id: "VERS-2026-004",
    reference: "VRM-BICEC-012",
    date: "2026-06-20 14:00",
    amount: 300000,
    type: "PARTNER_PAYMENT",
    destinationAccount: "BICEC - Épargne Gérant",
    operatorName: "M. Amadou",
    status: "REJECTED",
    notes: "Erreur de libellé sur le bordereau",
  },
];

export default function DepositsHistory() {
  // --- ÉTATS DES FILTRES ---
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // --- RÉINITIALISATION DES FILTRES ---
  const handleResetFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setTypeFilter("");
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
  const handleViewNotes = (record: DepositRecord) => {
    Swal.fire({
      title: `Détails du Versement`,
      html: `
        <div class="text-left text-sm space-y-2">
          <p><strong>Référence :</strong> ${record.reference}</p>
          <p><strong>Opérateur :</strong> ${record.operatorName}</p>
          <p><strong>Destination :</strong> ${record.destinationAccount}</p>
          <p><strong>Note/Observation :</strong> ${record.notes || "Aucune note"}</p>
        </div>
      `,
      icon: "info",
      confirmButtonColor: "#0f172a",
    });
  };

  const handleCancelDeposit = (reference: string) => {
    Swal.fire({
      title: "Annuler ce versement ?",
      text: `Voulez-vous vraiment rejeter ou annuler la référence ${reference} ? Cette action impactera les soldes attendus.`,
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Oui, rejeter",
      cancelButtonText: "Retour",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Mis à jour !",
          text: "Le versement a été marqué comme rejeté/annulé.",
          icon: "success",
          confirmButtonColor: "#10b981",
        });
      }
    });
  };

  // --- LOGIQUE DE FILTRAGE ---
  const filteredDeposits = useMemo(() => {
    return MOCK_DEPOSITS.filter((deposit) => {
      const matchesSearch =
        deposit.reference.toLowerCase().includes(search.toLowerCase()) ||
        deposit.destinationAccount
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        deposit.operatorName.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter ? deposit.type === typeFilter : true;
      const matchesStatus = statusFilter
        ? deposit.status === statusFilter
        : true;

      const depositDateOnly = deposit.date.split(" ")[0];
      const matchesStartDate = startDate ? depositDateOnly >= startDate : true;
      const matchesEndDate = endDate ? depositDateOnly <= endDate : true;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [search, startDate, endDate, typeFilter, statusFilter]);

  // --- CUMUL DES VERSEMENTS VALIDÉS ---
  const totalValidated = useMemo(() => {
    return filteredDeposits
      .filter((d) => d.status === "VALIDATED")
      .reduce((sum, d) => sum + d.amount, 0);
  }, [filteredDeposits]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* En-tête de page */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Historique des Versements
          </h1>
          <p className="text-sm text-slate-500">
            Suivi et pointage des dépôts bancaires et mouvements de coffre
          </p>
        </div>

        {/* Totalisateur */}
        <div className="bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-md flex items-center gap-3">
          <div className="p-2 bg-indigo-700 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
              Total Validé Sélection
            </p>
            <h3 className="text-lg font-black font-mono">
              {totalValidated.toLocaleString()} XAF
            </h3>
          </div>
        </div>
      </div>

      {/* ================= BLOC DES FILTRES ================= */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 mb-6">
        <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold text-sm uppercase tracking-wide">
          <Filter className="w-4 h-4 text-indigo-600" /> Options de filtrage
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Recherche */}
          <div className="md:col-span-3 relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Recherche globale
            </label>
            <Search className="absolute left-3 top-8 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Réf., banque, opérateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Date début */}
          <div className="md:col-span-2 relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Du
            </label>
            <Calendar className="absolute left-3 top-8 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Date fin */}
          <div className="md:col-span-2 relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Au
            </label>
            <Calendar className="absolute left-3 top-8 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Type de versement */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Nature/Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Tous</option>
              <option value="BANK_DEPOSIT">Dépôt Bancaire</option>
              <option value="CASH_COUNT">Mouvement Coffre</option>
              <option value="PARTNER_PAYMENT">Règlement Partenaire</option>
            </select>
          </div>

          {/* Statut */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Statut de validation
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Tous</option>
              <option value="VALIDATED">Validé</option>
              <option value="PENDING">En attente</option>
              <option value="REJECTED">Rejeté</option>
            </select>
          </div>

          {/* Bouton Reset */}
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

      {/* ================= TABLEAU DES VERSEMENTS ================= */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 p-3 font-semibold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="p-4">Réf. Versement</th>
                <th className="p-4">Date & Heure</th>
                <th className="p-4">Type</th>
                <th className="p-4">Compte Destination</th>
                <th className="p-4">Auteur</th>
                <th className="p-4 text-right">Montant (XAF)</th>
                <th className="p-4 text-center">Statut</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Aucun versement ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((deposit) => (
                  <tr
                    key={deposit.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500" />
                      {deposit.reference}
                    </td>
                    <td className="p-4 text-slate-600">{deposit.date}</td>

                    {/* Badge Type */}
                    <td className="p-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-medium
                        ${deposit.type === "BANK_DEPOSIT" ? "bg-amber-50 text-amber-800 border border-amber-200" : ""}
                        ${deposit.type === "CASH_COUNT" ? "bg-slate-100 text-slate-800" : ""}
                        ${deposit.type === "PARTNER_PAYMENT" ? "bg-purple-50 text-purple-800" : ""}
                      `}
                      >
                        {deposit.type === "BANK_DEPOSIT"
                          ? "Banque"
                          : deposit.type === "CASH_COUNT"
                            ? "Coffre"
                            : "Partenaire"}
                      </span>
                    </td>

                    <td className="p-4 font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {deposit.destinationAccount}
                      </div>
                    </td>

                    <td className="p-4 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {deposit.operatorName}
                      </div>
                    </td>

                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                      {deposit.amount.toLocaleString()}
                    </td>

                    {/* Badge Statut */}
                    <td className="p-4 text-center">
                      {deposit.status === "VALIDATED" && (
                        <span className="inline-flex items-center bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-md font-bold">
                          Validé
                        </span>
                      )}
                      {deposit.status === "PENDING" && (
                        <span className="inline-flex items-center bg-amber-50 text-amber-700 text-xs px-2.5 py-0.5 rounded-md font-bold animate-pulse">
                          En attente
                        </span>
                      )}
                      {deposit.status === "REJECTED" && (
                        <span className="inline-flex items-center bg-rose-50 text-rose-700 text-xs px-2.5 py-0.5 rounded-md font-bold">
                          Rejeté
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleViewNotes(deposit)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Détails & Notes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancelDeposit(deposit.reference)}
                          disabled={deposit.status === "REJECTED"}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Rejeter / Annuler"
                        >
                          <XCircle className="w-4 h-4" />
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
