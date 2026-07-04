import React, { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import {
  Search,
  Calendar,
  Plus,
  Building,
  DollarSign,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Loader2,
  Inbox,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { useBranches } from "../../../../hooks/pharmacy/useBranche";
import { usePaymentAccounts } from "../../../../hooks/pharmacy/usePaymentAccount";
import {
  usePaymentTransactions,
  useCreatePaymentTransaction,
} from "../../../../hooks/pharmacy/usePaymentTransaction";
import api from "../../../../api/api";
import { type PaymentTransactionDto } from "../../../../services/pharmacy/paymentTransactionService";

function TableSkeleton() {
  return (
    <tbody className="divide-y divide-slate-100 dark:divide-gray-700 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className="bg-white dark:bg-gray-800">
          <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-12" /></td>
          <td className="p-4"><div className="h-4 bg-slate-150 dark:bg-gray-750 rounded w-24" /></td>
          <td className="p-4"><div className="h-4 bg-slate-100 dark:bg-gray-800 rounded w-20" /></td>
          <td className="p-4"><div className="h-4 bg-slate-150 dark:bg-gray-750 rounded w-32" /></td>
          <td className="p-4"><div className="h-4 bg-slate-100 dark:bg-gray-800 rounded w-20" /></td>
          <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-16" /></td>
          <td className="p-4"><div className="h-8 bg-slate-200 dark:bg-gray-700 rounded w-20 mx-auto" /></td>
        </tr>
      ))}
    </tbody>
  );
}

export default function AdminTreasuryTransactions() {
  // --- ÉTATS ---
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
  
  // Filtres
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterMethod, setFilterMethod] = useState<string>("");
  const [journalPage, setJournalPage] = useState(1);
  const perPage = 15;

  // Modale Transaction manuelle (admin)
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [manualTxType, setManualTxType] = useState<"cash_in" | "cash_out" | "transfer">("transfer");
  const [manualSourceId, setManualSourceId] = useState<string>("");
  const [manualDestId, setManualDestId] = useState<string>("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualMethod, setManualMethod] = useState<"CASH" | "MOBILE_MONEY" | "CARD">("CASH");
  const [manualRef, setManualRef] = useState("");
  const [manualDesc, setManualDesc] = useState("");

  // --- HOOKS ---
  const { data: branches = [] } = useBranches();
  
  // Comptes pour la saisie manuelle
  const { data: accounts = [] } = usePaymentAccounts({
    pharmacy_branch_id: selectedBranchId,
  });

  // Transactions
  const { data: journalResponse, isLoading: loadingJournal } = usePaymentTransactions({
    pharmacy_branch_id: selectedBranchId,
    type: filterType || undefined,
    status: filterStatus || undefined,
    payment_method: filterMethod || undefined,
    paginated: true,
    page: journalPage,
    per_page: perPage,
  });

  const createTxMutation = useCreatePaymentTransaction();

  // Variables calculées
  const journalTxList = useMemo(() => {
    if (journalResponse && "data" in journalResponse) {
      return journalResponse.data;
    }
    return Array.isArray(journalResponse) ? journalResponse : [];
  }, [journalResponse]);

  const journalPagination = useMemo(() => {
    if (journalResponse && "current_page" in journalResponse) {
      return journalResponse;
    }
    return null;
  }, [journalResponse]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setJournalPage(1);
  }, [selectedBranchId, filterType, filterStatus, filterMethod]);

  // Saisir transaction manuelle
  const handleCreateManualTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) return;

    const payload = {
      pharmacy_branch_id: selectedBranchId,
      type: manualTxType,
      payment_method: manualMethod,
      amount: parseFloat(manualAmount),
      source_account_id: manualTxType !== "cash_in" ? parseInt(manualSourceId) : null,
      destination_account_id: manualTxType !== "cash_out" ? parseInt(manualDestId) : null,
      reference: manualRef || null,
      description: manualDesc || null,
      status: "completed" as const,
    };

    createTxMutation.mutate({ payload }, {
      onSuccess: () => {
        Swal.fire({
          icon: "success",
          title: "Mouvement enregistré",
          text: "La transaction de trésorerie a été validée immédiatement.",
          confirmButtonColor: "#10b981",
        });
        setShowTransactionModal(false);
        setManualAmount("");
        setManualSourceId("");
        setManualDestId("");
        setManualRef("");
        setManualDesc("");
      },
      onError: (err: any) => {
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: err.response?.data?.message || "Erreur de validation de la transaction.",
          confirmButtonColor: "#ef4444",
        });
      },
    });
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-gray-950 min-h-screen text-slate-800 dark:text-gray-200">
      {/* En-tête principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-emerald-600" /> Mouvements de Trésorerie
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Journal complet des flux financiers et des opérations manuelles de caisse
          </p>
        </div>

        {/* Sélection Succursale */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-xl shadow-xs border border-slate-200 dark:border-gray-700">
          <Building className="w-4 h-4 text-slate-400" />
          <select
            value={selectedBranchId || ""}
            onChange={(e) => setSelectedBranchId(e.target.value ? parseInt(e.target.value) : undefined)}
            className="bg-transparent border-none text-sm font-semibold text-slate-700 dark:text-gray-250 focus:outline-hidden"
          >
            <option value="">Sélectionnez une succursale...</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedBranchId ? (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-12 text-center shadow-xs">
          <Inbox className="w-16 h-16 stroke-1 mx-auto mb-3 text-slate-350 dark:text-gray-600" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-gray-300">Aucune succursale sélectionnée</h3>
          <p className="text-sm text-slate-500 dark:text-gray-455 mt-1 max-w-md mx-auto">
            Veuillez choisir une succursale dans la liste déroulante ci-dessus pour afficher l'historique des transactions.
          </p>
        </div>
      ) : (
        <div>
          {/* Entête d'action */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Registre des transactions</h2>
            <button
              onClick={() => setShowTransactionModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Mouvement manuel
            </button>
          </div>

          {/* Barre de Filtres */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4 mb-4 grid grid-cols-12 gap-4 items-end shadow-xs">
            <div className="col-span-12 md:col-span-3">
              <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Type de mouvement
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-gray-955 border border-slate-300 dark:border-gray-850 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white text-slate-800 dark:text-white font-semibold"
              >
                <option value="">Tous les types</option>
                <option value="cash_in">Encaissement (In)</option>
                <option value="cash_out">Décaissement (Out)</option>
                <option value="transfer">Transfert / Versement</option>
              </select>
            </div>

            <div className="col-span-12 md:col-span-3">
              <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Statut
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-gray-955 border border-slate-300 dark:border-gray-850 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white text-slate-800 dark:text-white font-semibold"
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente (Pending)</option>
                <option value="completed">Validé (Completed)</option>
                <option value="cancelled">Annulé (Cancelled)</option>
              </select>
            </div>

            <div className="col-span-12 md:col-span-3">
              <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Mode de règlement
              </label>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="w-full bg-slate-50 dark:bg-gray-955 border border-slate-300 dark:border-gray-850 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white text-slate-800 dark:text-white font-semibold"
              >
                <option value="">Tous les modes</option>
                <option value="CASH">Espèces (Cash)</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CARD">Carte Bancaire</option>
              </select>
            </div>

            <div className="col-span-12 md:col-span-3 flex justify-end">
              <button
                onClick={() => {
                  setFilterType("");
                  setFilterStatus("");
                  setFilterMethod("");
                }}
                className="px-4 py-2 border border-slate-300 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-850 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer w-full justify-center"
              >
                <X className="w-4 h-4" /> Réinitialiser
              </button>
            </div>
          </div>

          {loadingJournal ? (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-sm">
                <TableSkeleton />
              </table>
            </div>
          ) : journalTxList.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-12 text-center">
              <Inbox className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-semibold text-slate-500">Aucun mouvement financier enregistré.</p>
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-gray-900/60 border-b border-slate-200 dark:border-gray-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                        <th className="p-4">Date</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Détails (Origine / Dest)</th>
                        <th className="p-4 text-right">Montant</th>
                        <th className="p-4">Règlement</th>
                        <th className="p-4">Statut</th>
                        <th className="p-4">Commentaire / Preuve</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                      {journalTxList.map((tx) => {
                        const isCashIn = tx.type === "cash_in";
                        const isCashOut = tx.type === "cash_out";
                        const isTransfer = tx.type === "transfer";

                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-855/20 transition-colors">
                            <td className="p-4 text-xs font-mono">
                              {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="p-4 font-semibold">
                              {isCashIn && (
                                <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                  <TrendingUp className="w-4 h-4" /> In
                                </span>
                              )}
                              {isCashOut && (
                                <span className="text-rose-600 dark:text-rose-455 flex items-center gap-1">
                                  <TrendingDown className="w-4 h-4" /> Out
                                </span>
                              )}
                              {isTransfer && (
                                <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                  <ArrowRightLeft className="w-4 h-4" /> Transfer
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col text-xs">
                                {isTransfer && (
                                  <div className="flex items-center gap-1 text-slate-500 dark:text-gray-400">
                                    <span>De:</span>
                                    <span className="font-semibold text-slate-700 dark:text-gray-300">
                                      {tx.session?.register?.name ? `Caisse (${tx.session.register.name})` : tx.source_account?.name || "-"}
                                    </span>
                                  </div>
                                )}
                                {isCashOut && (
                                  <div className="flex items-center gap-1 text-slate-500 dark:text-gray-400">
                                    <span>Depuis:</span>
                                    <span className="font-semibold text-slate-700 dark:text-gray-300">
                                      {tx.session?.register?.name ? `Caisse (${tx.session.register.name})` : tx.source_account?.name || "-"}
                                    </span>
                                  </div>
                                )}
                                {(isTransfer || isCashIn) && (
                                  <div className="flex items-center gap-1 text-slate-500 dark:text-gray-400 mt-0.5">
                                    <span>Vers:</span>
                                    <span className="font-semibold text-slate-700 dark:text-gray-300">
                                      {tx.destination_account?.name || "-"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-right font-black font-mono text-slate-900 dark:text-white text-base">
                              {tx.amount.toLocaleString()} <span className="text-xs text-slate-500">XAF</span>
                            </td>
                            <td className="p-4 text-xs font-semibold">
                              {tx.payment_method}
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                                  tx.status === "completed"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                                    : tx.status === "pending"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
                                      : "bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400"
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>
                            <td className="p-4 text-xs max-w-xs truncate">
                              <div className="flex flex-col">
                                <span className="text-slate-500 dark:text-gray-400 italic">
                                  {tx.description || "Aucun commentaire"}
                                </span>
                                {tx.reference && (
                                  <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                                    Réf: {tx.reference}
                                  </span>
                                )}
                                {tx.receipt_path && (
                                  <a
                                    href={`${api.defaults.baseURL?.replace('/api', '')}/storage/${tx.receipt_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Reçu bancaire
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

              {/* Pagination */}
              {journalPagination && journalPagination.last_page > 1 && (
                <div className="flex justify-between items-center mt-4 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-4 rounded-2xl shadow-xs">
                  <span className="text-xs text-slate-500">
                    Page {journalPagination.current_page} sur {journalPagination.last_page} ({journalPagination.total} transactions)
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={journalPage === 1}
                      onClick={() => setJournalPage((p) => p - 1)}
                      className="p-1.5 border border-slate-300 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-655 rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      disabled={journalPage >= journalPagination.last_page}
                      onClick={() => setJournalPage((p) => p + 1)}
                      className="p-1.5 border border-slate-300 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-655 rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ============================================================ */}
          {/* MODALE: MOUVEMENT MANUEL DE CAISSE (ADMIN ONLY) */}
          {/* ============================================================ */}
          {showTransactionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/60">
                  <h3 className="font-bold text-slate-900 dark:text-white">Nouveau mouvement manuel</h3>
                  <button
                    onClick={() => setShowTransactionModal(false)}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-gray-850 rounded-lg text-slate-400 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateManualTx} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                      Type de mouvement
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setManualTxType("transfer");
                          setManualSourceId("");
                          setManualDestId("");
                        }}
                        className={`p-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          manualTxType === "transfer"
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-955/20 text-blue-700 dark:text-blue-400 font-extrabold"
                            : "border-slate-300 dark:border-gray-800 hover:bg-slate-50"
                        }`}
                      >
                        Transfert
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setManualTxType("cash_in");
                          setManualSourceId("");
                          setManualDestId("");
                        }}
                        className={`p-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          manualTxType === "cash_in"
                            ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-400 font-extrabold"
                            : "border-slate-300 dark:border-gray-800 hover:bg-slate-50"
                        }`}
                      >
                        Apport (In)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setManualTxType("cash_out");
                          setManualSourceId("");
                          setManualDestId("");
                        }}
                        className={`p-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          manualTxType === "cash_out"
                            ? "border-rose-600 bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-455 font-extrabold"
                            : "border-slate-300 dark:border-gray-800 hover:bg-slate-50"
                        }`}
                      >
                        Retrait (Out)
                      </button>
                    </div>
                  </div>

                  {manualTxType !== "cash_in" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                        Compte Source
                      </label>
                      <select
                        required
                        value={manualSourceId}
                        onChange={(e) => setManualSourceId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-gray-955 border border-slate-350 dark:border-gray-805 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white"
                      >
                        <option value="">Sélectionnez le compte d'origine...</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.balance.toLocaleString()} XAF)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {manualTxType !== "cash_out" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                        Compte Destination
                      </label>
                      <select
                        required
                        value={manualDestId}
                        onChange={(e) => setManualDestId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-gray-955 border border-slate-350 dark:border-gray-805 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white"
                      >
                        <option value="">Sélectionnez le compte cible...</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.balance.toLocaleString()} XAF)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                      Mode de paiement / règlement
                    </label>
                    <select
                      value={manualMethod}
                      onChange={(e) => setManualMethod(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-gray-955 border border-slate-355 dark:border-gray-805 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-semibold"
                    >
                      <option value="CASH">Espèces (Cash)</option>
                      <option value="MOBILE_MONEY">Mobile Money</option>
                      <option value="CARD">Carte Bancaire</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                      Montant du mouvement (XAF)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="0"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-gray-955 border border-slate-350 dark:border-gray-805 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                      Référence / Numéro justificatif
                    </label>
                    <input
                      type="text"
                      placeholder="N° de chèque, réf MoMo, n° de facture..."
                      value={manualRef}
                      onChange={(e) => setManualRef(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-gray-955 border border-slate-350 dark:border-gray-805 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                      Commentaire / Explication
                    </label>
                    <textarea
                      placeholder="Justification ou notes additionnelles..."
                      rows={2}
                      value={manualDesc}
                      onChange={(e) => setManualDesc(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-gray-955 border border-slate-350 dark:border-gray-805 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-gray-800 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowTransactionModal(false)}
                      className="px-4 py-2 border border-slate-300 dark:border-gray-700 hover:bg-slate-150 dark:hover:bg-gray-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={createTxMutation.isPending}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {createTxMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
