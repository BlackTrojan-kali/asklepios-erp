import React, { useState, useMemo, useEffect } from "react";
import Swal from "sweetalert2";
import {
  X,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Inbox,
  Landmark,
  Smartphone,
  Coins,
  ChevronLeft,
  ChevronRight,
  Scale,
  Info,
} from "lucide-react";
import { usePaymentTransactions } from "../../../../hooks/pharmacy/usePaymentTransaction";
import { type PaymentAccountDto } from "../../../../services/pharmacy/paymentAccountService";

interface PaymentAccountTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: PaymentAccountDto | null;
}

export default function PaymentAccountTransactionsModal({
  isOpen,
  onClose,
  account,
}: PaymentAccountTransactionsModalProps) {
  // --- FILTRES ---
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterMethod, setFilterMethod] = useState("");

  // --- QUERY ---
  // Fetch non-paginated transactions for this branch to perform accurate filtering and statistics client-side
  const { data: allTransactionsResponse = [], isLoading } =
    usePaymentTransactions(
      {
        pharmacy_branch_id: account?.pharmacy_branch_id,
        paginated: false,
      },
      true,
    );

  const transactionsList = useMemo(() => {
    return Array.isArray(allTransactionsResponse)
      ? allTransactionsResponse
      : [];
  }, [allTransactionsResponse]);

  // --- TRANSFORMATION & FILTRAGE CLIENT ---
  const filteredTransactions = useMemo(() => {
    if (!account) return [];

    return transactionsList.filter((tx) => {
      // 1. Doit concerner ce compte spécifique (en source ou destination)
      const belongsToAccount =
        tx.source_account_id === account.id ||
        tx.destination_account_id === account.id;
      if (!belongsToAccount) return false;

      // Ignorer les transactions annulées de la comptabilité courante
      if (tx.status === "cancelled") return false;

      // 2. Filtre par type
      if (filterType) {
        if (filterType === "cash_in") {
          // Entrée de fonds directe ou transfert reçu
          if (tx.destination_account_id !== account.id) return false;
        } else if (filterType === "cash_out") {
          // Sortie de fonds directe ou transfert émis
          if (tx.source_account_id !== account.id) return false;
        }
      }

      // 3. Filtre par méthode
      if (filterMethod && tx.payment_method !== filterMethod) return false;

      // 4. Filtre par date de début
      if (dateStart) {
        const txDate = new Date(tx.created_at).toISOString().split("T")[0];
        if (txDate < dateStart) return false;
      }

      // 5. Filtre par date de fin
      if (dateEnd) {
        const txDate = new Date(tx.created_at).toISOString().split("T")[0];
        if (txDate > dateEnd) return false;
      }

      return true;
    });
  }, [transactionsList, account, filterType, filterMethod, dateStart, dateEnd]);

  // --- PAGINATION CLIENT ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateStart, dateEnd, filterType, filterMethod]);

  // --- STATISTIQUES ---
  const stats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;

    let cashIn = 0;
    let cashOut = 0;

    let momoIn = 0;
    let momoOut = 0;

    let cardIn = 0;
    let cardOut = 0;

    if (!account)
      return {
        totalIn,
        totalOut,
        cashIn,
        cashOut,
        momoIn,
        momoOut,
        cardIn,
        cardOut,
      };

    filteredTransactions.forEach((tx) => {
      // Entrée si le compte cible est notre compte
      const isInflow = tx.destination_account_id === account.id;

      if (isInflow) {
        totalIn += tx.amount;
        if (tx.payment_method === "CASH") cashIn += tx.amount;
        if (tx.payment_method === "MOBILE_MONEY") momoIn += tx.amount;
        if (tx.payment_method === "CARD") cardIn += tx.amount;
      } else {
        totalOut += tx.amount;
        if (tx.payment_method === "CASH") cashOut += tx.amount;
        if (tx.payment_method === "MOBILE_MONEY") momoOut += tx.amount;
        if (tx.payment_method === "CARD") cardOut += tx.amount;
      }
    });

    return {
      totalIn,
      totalOut,
      cashIn,
      cashOut,
      momoIn,
      momoOut,
      cardIn,
      cardOut,
    };
  }, [filteredTransactions, account]);

  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl max-w-7xl w-full h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/60">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2 text-base">
                <Landmark className="w-5 h-5 text-emerald-600" /> Historique :{" "}
                {account.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Consultez et filtrez tous les flux financiers de ce compte de
                trésorerie
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                Swal.fire({
                  icon: "info",
                  title: "Rapprochement Bancaire",
                  text: `Le module de rapprochement bancaire pour "${account.name}" vous permettra de rapprocher le solde théorique de l'ERP avec votre relevé bancaire ou Mobile Money réels.`,
                  confirmButtonColor: "#10b981",
                  confirmButtonText: "Compris",
                });
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Scale className="w-4 h-4" /> Rapprochement Bancaire
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-400 dark:text-gray-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps - Défilant */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Solde Théorique */}
            <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-2xl">
              <span
                className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 cursor-help"
                title="Solde calculé par l'ERP d'après tous les encaissements, décaissements et transferts enregistrés sur ce compte"
              >
                <Coins className="w-3.5 h-3.5" /> Solde Théorique (ERP){" "}
                <Info className="w-3 h-3 text-emerald-500" />
              </span>
              <h4 className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                {account.balance.toLocaleString()}{" "}
                <span className="text-xs font-bold">XAF</span>
              </h4>
            </div>

            {/* Total Entrées / Sorties */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl flex flex-col justify-between">
              <span
                className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 flex items-center justify-between cursor-help"
                title="Volume total cumulé des mouvements financiers entrants (+) et sortants (-) de ce compte sur la période"
              >
                <span>Volume de Flux</span>
                <Info className="w-3 h-3 text-slate-400" />
              </span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <span
                    className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5 cursor-help"
                    title="Total des encaissements / versements reçus (+)"
                  >
                    <ArrowUpRight className="w-3 h-3 text-emerald-500" /> In
                  </span>
                  <p className="text-xs font-bold text-gray-800 dark:text-white font-mono">
                    {stats.totalIn.toLocaleString()} XAF
                  </p>
                </div>
                <div>
                  <span
                    className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5 cursor-help"
                    title="Total des décaissements / retraits effectués (-)"
                  >
                    <ArrowDownLeft className="w-3 h-3 text-rose-500" /> Out
                  </span>
                  <p className="text-xs font-bold text-gray-800 dark:text-white font-mono">
                    {stats.totalOut.toLocaleString()} XAF
                  </p>
                </div>
              </div>
            </div>

            {/* Flux Espèces */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl flex flex-col justify-between">
              <span
                className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 flex items-center justify-between cursor-help"
                title="Mouvements financiers réalisés exclusivement en espèces physiques (cash)"
              >
                <span className="flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-600" /> Flux Espèces
                  (CASH)
                </span>
                <Info className="w-3 h-3 text-amber-500" />
              </span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    Entrées
                  </span>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 font-mono">
                    +{stats.cashIn.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    Sorties
                  </span>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 font-mono">
                    -{stats.cashOut.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Flux Mobile Money */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl flex flex-col justify-between">
              <span
                className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 flex items-center justify-between cursor-help"
                title="Mouvements financiers réalisés par paiement ou transfert Mobile Money (MTN MoMo, Orange Money)"
              >
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-blue-500" /> Flux
                  Mobile Money
                </span>
                <Info className="w-3 h-3 text-blue-400" />
              </span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    Entrées
                  </span>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 font-mono">
                    +{stats.momoIn.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    Sorties
                  </span>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 font-mono">
                    -{stats.momoOut.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres de date et de type */}
          <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Date Début
                </label>
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-xs focus:outline-hidden text-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Date Fin
                </label>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-xs focus:outline-hidden text-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Type de mouvement
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-xs focus:outline-hidden text-gray-800 dark:text-white font-semibold"
                >
                  <option value="">Tous les types</option>
                  <option value="cash_in">Entrées / Encaissements</option>
                  <option value="cash_out">Sorties / Décaissements</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Mode de règlement
                </label>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-xs focus:outline-hidden text-gray-800 dark:text-white font-semibold"
                >
                  <option value="">Tous les modes</option>
                  <option value="CASH">Espèces (CASH)</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="CARD">Carte Bancaire</option>
                </select>
              </div>
            </div>

            {/* Bouton de réinitialisation rapide des filtres */}
            {(dateStart || dateEnd || filterType || filterMethod) && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setDateStart("");
                    setDateEnd("");
                    setFilterType("");
                    setFilterMethod("");
                  }}
                  className="text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 font-bold transition-colors cursor-pointer"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>

          {/* Tableau des transactions */}
          <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                    <th className="p-4">Date & Heure</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Provenance / Destination</th>
                    <th className="p-4">Description / Référence</th>
                    <th className="p-4">Mode</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-xs">
                  {isLoading ? (
                    [1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-4">
                          <div className="h-3.5 bg-slate-200 dark:bg-gray-800 rounded-md w-24" />
                        </td>
                        <td className="p-4">
                          <div className="h-5 bg-slate-150 dark:bg-gray-800/80 rounded-md w-16" />
                        </td>
                        <td className="p-4">
                          <div className="h-3.5 bg-slate-200 dark:bg-gray-800 rounded-md w-32" />
                        </td>
                        <td className="p-4">
                          <div className="h-3.5 bg-slate-200 dark:bg-gray-800 rounded-md w-40 mb-1" />
                          <div className="h-2.5 bg-slate-150 dark:bg-gray-800/50 rounded-md w-20" />
                        </td>
                        <td className="p-4">
                          <div className="h-3.5 bg-slate-200 dark:bg-gray-800 rounded-md w-10" />
                        </td>
                        <td className="p-4">
                          <div className="h-5 bg-slate-150 dark:bg-gray-800/85 rounded-md w-14" />
                        </td>
                        <td className="p-4 text-right">
                          <div className="h-4 bg-slate-205 dark:bg-gray-800 rounded-md w-20 ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-12 text-center text-gray-400 dark:text-gray-500"
                      >
                        <Inbox className="w-12 h-12 stroke-1 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                        Aucune transaction ne correspond à ce compte ou à vos
                        filtres.
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((tx) => {
                      const isInflow = tx.destination_account_id === account.id;

                      let labelType = "";
                      let typeColor = "";
                      if (tx.type === "transfer") {
                        labelType = isInflow
                          ? "Transfert Reçu"
                          : "Transfert Émis";
                        typeColor = isInflow
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400";
                      } else {
                        labelType =
                          tx.type === "cash_in"
                            ? "Apport"
                            : "Retrait / Dépense";
                        typeColor =
                          tx.type === "cash_in"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
                      }

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="p-4 font-mono text-gray-500 dark:text-gray-400">
                            {new Date(tx.created_at).toLocaleDateString()}{" "}
                            {new Date(tx.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] ${typeColor}`}
                            >
                              {labelType}
                            </span>
                          </td>
                          <td className="p-4 text-gray-600 dark:text-gray-300">
                            {tx.type === "transfer" ? (
                              <div className="flex items-center gap-1 text-[11px]">
                                <span>
                                  {tx.source_account?.name ||
                                    (tx.session?.register?.name
                                      ? `Caisse (${tx.session.register.name})`
                                      : "-")}
                                </span>
                                <ArrowRightLeft className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                <span>
                                  {tx.destination_account?.name || "-"}
                                </span>
                              </div>
                            ) : isInflow ? (
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                Externe &rarr; ce compte
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                ce compte &rarr; Externe
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-gray-800 dark:text-white">
                              {tx.description || "Mouvement de trésorerie"}
                            </div>
                            {tx.reference && (
                              <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                                Réf : {tx.reference}
                              </div>
                            )}
                            {/* Initiateur, Caisse & Validateur */}
                            {(tx.user ||
                              tx.session?.register ||
                              tx.confirmed_by) && (
                              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 space-y-0.5 border-t border-gray-100 dark:border-gray-700 pt-1">
                                {tx.user && (
                                  <div>
                                    Opérateur :{" "}
                                    <span className="truncate font-bold text-gray-600 dark:text-gray-300">
                                      {tx.user.first_name} {tx.user.last_name}
                                    </span>
                                  </div>
                                )}
                                {tx.session?.register && (
                                  <div>
                                    Caisse :{" "}
                                    <span className="font-bold text-gray-600 dark:text-gray-300">
                                      {tx.session.register.name}
                                    </span>
                                  </div>
                                )}
                                {tx.confirmed_by && (
                                  <div>
                                    Validé par :{" "}
                                    <span className="truncate font-bold text-gray-600 dark:text-gray-300">
                                      {tx.confirmed_by.first_name}{" "}
                                      {tx.confirmed_by.last_name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-4 font-bold text-gray-500 dark:text-gray-400">
                            {tx.payment_method}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold tracking-wider ${
                                tx.status === "completed"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                                  : tx.status === "pending"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-slate-100 text-slate-800 dark:bg-gray-800 dark:text-gray-400"
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <span
                              className={`font-black font-mono text-sm ${
                                isInflow
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-500"
                              }`}
                            >
                              {isInflow ? "+" : "-"}
                              {tx.amount.toLocaleString()}
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 ml-1">
                                XAF
                              </span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl shadow-xs">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Page {currentPage} sur {totalPages} (
                {filteredTransactions.length} transactions)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-1.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-1.5 border border-slate-300 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pied de page */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end bg-gray-50 dark:bg-gray-800/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
