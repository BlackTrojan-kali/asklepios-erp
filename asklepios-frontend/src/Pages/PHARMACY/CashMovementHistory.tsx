import {
  Search,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Loader2,
  Inbox,
  AlertCircle,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { useMyActiveSession } from "../../hooks/pharmacy/useCashRegisterSession";
import { usePaymentAccounts } from "../../hooks/pharmacy/usePaymentAccount";
import { usePaymentTransactions } from "../../hooks/pharmacy/usePaymentTransaction";
import api from "../../api/api";
import { type PaymentTransactionDto } from "../../services/pharmacy/paymentTransactionService";
import CreateTreasuryTransactionModal from "../../components/modals/Pharmacy/Pharmacien/CreateTreasuryTransactionModal";
import { useState, useMemo } from "react";

const Tooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-flex items-center ml-1">
    <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-help shrink-0" />
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center w-60 p-2.5 bg-slate-900 dark:bg-gray-800 text-white text-[11px] font-normal rounded-xl shadow-xl z-50 pointer-events-none text-center leading-snug border border-slate-700 dark:border-gray-700 animate-in fade-in duration-150">
      <span>{text}</span>
      <div className="w-2 h-2 bg-slate-900 dark:bg-gray-800 rotate-45 -mb-3.5 -mt-1 border-r border-b border-slate-700 dark:border-gray-700"></div>
    </div>
  </div>
);

export default function CashMovementHistory() {
  // --- ÉTATS ---
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  // Modales
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<"cash_in" | "cash_out" | "transfer">(
    "transfer",
  );

  // --- HOOKS ---
  // Session active du caissier
  const {
    data: activeSession,
    isLoading: loadingSession,
    refetch: refetchSession,
  } = useMyActiveSession();
  const currentBranchId = activeSession?.register?.pharmacy_branch_id;

  // Comptes disponibles pour transferts/dépenses (isAdmin = false)
  const { data: accounts = [] } = usePaymentAccounts(
    { pharmacy_branch_id: currentBranchId || undefined },
    false,
  );

  // Transactions de trésorerie du caissier (isAdmin = false)
  const {
    data: transactionsResponse = [],
    isLoading: loadingTx,
    refetch: refetchTransactions,
  } = usePaymentTransactions({ paginated: false }, false);

  const transactions = (transactionsResponse as PaymentTransactionDto[]) || [];

  // Filtrer la liste des transactions du caissier pour affichage local
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesType = !filterType || tx.type === filterType;
      const matchesStatus = !filterStatus || tx.status === filterStatus;

      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search.trim() ||
        tx.description?.toLowerCase().includes(searchLower) ||
        tx.reference?.toLowerCase().includes(searchLower) ||
        tx.destination_account?.name?.toLowerCase().includes(searchLower);

      return matchesType && matchesStatus && matchesSearch;
    });
  }, [transactions, filterType, filterStatus, search]);

  // Totaux de session
  const currency = activeSession?.register?.branch?.country?.currency || "XAF";
  const openingBalance = activeSession?.opening_balance || 0;
  const cashSales = activeSession?.sales_totals?.cash || 0;

  const treasuryCash = useMemo(() => {
    if (!activeSession?.treasury_totals?.cash) {
      return { in: 0, out: 0, transfer: 0, net: 0 };
    }
    return activeSession.treasury_totals.cash;
  }, [activeSession]);

  const expectedCashInDrawer = openingBalance + cashSales + treasuryCash.net;

  // Ouvrir la modale
  const handleOpenTxModal = (type: "cash_in" | "cash_out" | "transfer") => {
    setTxType(type);
    setShowTxModal(true);
  };

  // Callback après soumission réussie
  const handleTxSuccess = () => {
    refetchSession();
    refetchTransactions();
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-gray-950 min-h-screen text-slate-800 dark:text-gray-200 transition-colors duration-250">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowRightLeft className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />{" "}
            Versements & Mouvements
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Saisissez vos versements (banque/coffre), décaissements ou apports
            sur votre session de caisse
          </p>
        </div>
      </div>

      {!loadingSession && !activeSession ? (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6 flex items-start gap-4 shadow-xs">
          <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-900 dark:text-amber-400">
              Aucune session active
            </h3>
            <p className="text-sm text-amber-755 dark:text-amber-500 mt-1">
              Vous devez ouvrir une session de caisse physique pour pouvoir
              enregistrer des mouvements de trésorerie ou des versements.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section d'état de caisse actuel */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-4 flex items-center">
              État de caisse actuel (Espèces / Cash)
              <Tooltip text="Suivi en temps réel des espèces physiques de la session active du caissier." />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
              <div className="bg-slate-50 dark:bg-gray-950 p-4 rounded-xl border border-slate-100 dark:border-gray-850">
                <span className="text-xs text-slate-400 dark:text-gray-500 block mb-1 flex items-center justify-between">
                  <span>Fond de caisse initial</span>
                  <Tooltip text="Montant d'espèces présent dans le tiroir-caisse lors de l'ouverture de la session." />
                </span>
                {loadingSession ? (
                  <div className="h-6 w-24 bg-slate-200 dark:bg-gray-800 rounded-md animate-pulse mt-1"></div>
                ) : (
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                    {openingBalance.toLocaleString()}{" "}
                    <span className="text-xs text-slate-400 dark:text-gray-500">
                      {currency}
                    </span>
                  </span>
                )}
              </div>
              <div className="bg-slate-50 dark:bg-gray-950 p-4 rounded-xl border border-slate-100 dark:border-gray-850">
                <span className="text-xs text-slate-400 dark:text-gray-500 block mb-1 flex items-center justify-between">
                  <span>Ventes (Espèces)</span>
                  <Tooltip text="Cumul de l'argent encaissé en espèces pour les ventes de cette session." />
                </span>
                {loadingSession ? (
                  <div className="h-6 w-24 bg-slate-200 dark:bg-gray-800 rounded-md animate-pulse mt-1"></div>
                ) : (
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                    {cashSales.toLocaleString()}{" "}
                    <span className="text-xs text-slate-400 dark:text-gray-500">
                      {currency}
                    </span>
                  </span>
                )}
              </div>
              <div className="bg-slate-50 dark:bg-gray-950 p-4 rounded-xl border border-slate-100 dark:border-gray-850">
                <span className="text-xs text-slate-400 dark:text-gray-500 block mb-1 flex items-center justify-between">
                  <span>Mouvements (Net)</span>
                  <Tooltip text="Solde net des apports de caisse (+) et des versements ou dépenses (-)." />
                </span>
                {loadingSession ? (
                  <div className="h-6 w-24 bg-slate-200 dark:bg-gray-800 rounded-md animate-pulse mt-1"></div>
                ) : (
                  <span
                    className={`text-lg font-bold font-mono ${treasuryCash.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}
                  >
                    {treasuryCash.net >= 0 ? "+" : ""}
                    {treasuryCash.net.toLocaleString()}{" "}
                    <span className="text-xs text-slate-450 dark:text-gray-500">
                      {currency}
                    </span>
                  </span>
                )}
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                <span className="text-xs text-emerald-805 dark:text-emerald-450 block mb-1 flex items-center justify-between">
                  <span>Solde théorique attendu</span>
                  <Tooltip text="Montant devant être présent physiquement dans la caisse (Fond initial + Ventes espèces + Mouvements net)." />
                </span>
                {loadingSession ? (
                  <div className="h-7 w-28 bg-emerald-200/50 dark:bg-emerald-900/40 rounded-md animate-pulse mt-1"></div>
                ) : (
                  <span className="text-xl font-black font-mono text-emerald-900 dark:text-emerald-400">
                    {expectedCashInDrawer.toLocaleString()}{" "}
                    <span className="text-sm font-bold">{currency}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleOpenTxModal("transfer")}
                disabled={loadingSession}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4" /> Faire un versement
                (Dépôt)
                <Tooltip text="Transférer les espèces de la caisse vers une banque, un coffre-fort ou un compte Mobile Money." />
              </button>
              <button
                onClick={() => handleOpenTxModal("cash_out")}
                disabled={loadingSession}
                className="px-4 py-2 border border-slate-300 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <TrendingDown className="w-4 h-4 text-rose-500" /> Déclarer une
                dépense (Retrait)
                <Tooltip text="Enregistrer une sortie d'espèces du tiroir-caisse pour régler une dépense urgente." />
              </button>
              <button
                onClick={() => handleOpenTxModal("cash_in")}
                disabled={loadingSession}
                className="px-4 py-2 border border-slate-300 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Apport de
                caisse (Alimentation)
                <Tooltip text="Alimenter le tiroir-caisse avec des espèces (ex: ajout de monnaie)." />
              </button>
            </div>
          </div>

          {/* Section Historique des mouvements */}
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Historique de vos mouvements de caisse
            </h2>

            {/* Filtres */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4 mb-4 grid grid-cols-12 gap-4 items-end shadow-xs">
              <div className="col-span-12 md:col-span-4">
                <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  Rechercher
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Recherche motif, réf, banque..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-300 dark:border-gray-800 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-300 dark:border-gray-800 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-semibold"
                >
                  <option value="">Tous les types</option>
                  <option value="cash_in">Apport (Alimentation)</option>
                  <option value="cash_out">Décaissement (Dépense)</option>
                  <option value="transfer">Versement (Dépôt)</option>
                </select>
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  Statut
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-300 dark:border-gray-800 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-semibold"
                >
                  <option value="">Tous les statuts</option>
                  <option value="pending">En attente (Pending)</option>
                  <option value="completed">Validé (Completed)</option>
                  <option value="cancelled">Annulé (Cancelled)</option>
                </select>
              </div>

              <div className="col-span-12 md:col-span-2">
                <button
                  onClick={() => {
                    setFilterType("");
                    setFilterStatus("");
                    setSearch("");
                  }}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-850 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl flex items-center gap-1.5 justify-center transition-colors cursor-pointer"
                >
                  Effacer
                </button>
              </div>
            </div>

            {!loadingTx && filteredTransactions.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-12 text-center">
                <Inbox className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-400" />
                <p className="text-sm font-semibold text-slate-500">
                  Aucun mouvement ne correspond aux filtres.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-gray-900/60 border-b border-slate-200 dark:border-gray-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                        <th className="p-4">Date</th>
                        <th className="p-4">
                          <span className="flex items-center">
                            Type
                            <Tooltip text="Nature de l'opération : Apport (alimentation), Dépense (retrait) ou Versement (dépôt vers compte)." />
                          </span>
                        </th>
                        <th className="p-4">
                          <span className="flex items-center">
                            Destination / Détail
                            <Tooltip text="Compte financier récepteur (Banque/Coffre) pour un versement, ou Caisse locale." />
                          </span>
                        </th>
                        <th className="p-4 text-right">Montant</th>
                        <th className="p-4">Mode</th>
                        <th className="p-4">
                          <span className="flex items-center">
                            Statut
                            <Tooltip text="État de validation du mouvement par la trésorerie ou le gestionnaire." />
                          </span>
                        </th>
                        <th className="p-4">Commentaire / Justificatif</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                      {loadingTx
                        ? Array.from({ length: 5 }).map((_, idx) => (
                            <tr key={idx} className="animate-pulse">
                              <td className="p-4">
                                <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-28"></div>
                              </td>
                              <td className="p-4">
                                <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-24"></div>
                              </td>
                              <td className="p-4">
                                <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-32"></div>
                              </td>
                              <td className="p-4">
                                <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-20 ml-auto"></div>
                              </td>
                              <td className="p-4">
                                <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-16"></div>
                              </td>
                              <td className="p-4">
                                <div className="h-6 bg-slate-200 dark:bg-gray-800 rounded-full w-20"></div>
                              </td>
                              <td className="p-4">
                                <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-40"></div>
                              </td>
                            </tr>
                          ))
                        : filteredTransactions.map((tx) => {
                            const isCashIn = tx.type === "cash_in";
                            const isCashOut = tx.type === "cash_out";
                            const isTransfer = tx.type === "transfer";

                            return (
                              <tr
                                key={tx.id}
                                className="hover:bg-slate-50/50 dark:hover:bg-gray-855/20 transition-colors"
                              >
                                <td className="p-4 text-xs font-mono">
                                  {new Date(tx.created_at).toLocaleDateString()}{" "}
                                  {new Date(tx.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </td>
                                <td className="p-4 font-semibold">
                                  {isCashIn && (
                                    <span className="text-emerald-750 dark:text-emerald-400 flex items-center gap-1">
                                      <TrendingUp className="w-4 h-4" /> Apport
                                      (Float)
                                    </span>
                                  )}
                                  {isCashOut && (
                                    <span className="text-rose-650 dark:text-rose-450 flex items-center gap-1">
                                      <TrendingDown className="w-4 h-4" /> Dépense
                                    </span>
                                  )}
                                  {isTransfer && (
                                    <span className="text-blue-650 dark:text-blue-400 flex items-center gap-1">
                                      <ArrowRightLeft className="w-4 h-4" />{" "}
                                      Versement
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 font-semibold text-slate-700 dark:text-slate-250">
                                  {isTransfer
                                    ? tx.destination_account?.name || "Transit"
                                    : "Caisse locale"}
                                </td>
                                <td className="p-4 text-right font-black font-mono text-slate-900 dark:text-white text-base">
                                  {tx.amount.toLocaleString()}{" "}
                                  <span className="text-xs text-slate-500">
                                    {currency}
                                  </span>
                                </td>
                                <td className="p-4 text-xs font-semibold">
                                  {tx.payment_method}
                                </td>
                                <td className="p-4">
                                  {tx.status === "completed" && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-full">
                                      <CheckCircle2 className="w-3 h-3" /> Validé
                                      <Tooltip text="Ce mouvement a été validé et confirmé." />
                                    </span>
                                  )}
                                  {tx.status === "pending" && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-955/20 dark:text-amber-400 rounded-full">
                                      <Clock className="w-3 h-3" /> En transit
                                      <Tooltip text="En attente de validation ou de réception sur le compte destination." />
                                    </span>
                                  )}
                                  {tx.status === "cancelled" && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-955/20 dark:text-rose-450 rounded-full">
                                      <XCircle className="w-3 h-3" /> Annulé
                                      <Tooltip text="Ce mouvement a été rejeté ou annulé." />
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-xs">
                                  <div className="flex flex-col">
                                    <span className="text-slate-500 italic">
                                      {tx.description || "-"}
                                    </span>
                                    {tx.reference && (
                                      <span className="text-[10px] font-mono text-slate-400">
                                        Réf: {tx.reference}
                                      </span>
                                    )}
                                    {tx.receipt_path && (
                                      <a
                                        href={`${api.defaults.baseURL?.replace("/api", "")}/storage/${tx.receipt_path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> Voir
                                        justificatif
                                      </a>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Modale déplacée */}
          <CreateTreasuryTransactionModal
            isOpen={showTxModal}
            onClose={() => setShowTxModal(false)}
            txType={txType}
            activeSession={activeSession}
            expectedCashInDrawer={expectedCashInDrawer}
            accounts={accounts}
            onSuccess={handleTxSuccess}
          />
        </div>
      )}
    </div>
  );
}
