import React, { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import {
  Calendar,
  Clock,
  Inbox,
  AlertCircle,
  TrendingUp,
  Unlock,
  Building2,
  Terminal,
  User,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAdminSessionsHistory } from "../../../../hooks/pharmacy/useCashRegisterSession";
import { useBranches } from "../../../../hooks/pharmacy/useBranche";
import { useCashRegisters } from "../../../../hooks/pharmacy/useCashRegister";
import { useAdminSellers } from "../../../../hooks/pharmacy/usePosSale";

export default function PosSessionsHistory() {
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
  const [status, setStatus] = useState<"all" | "open" | "closed">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  // --- CONFIGURATION DES RÉSULTATS DES SERVICES ---
  const { data: branches = [] } = useBranches();
  const { data: registers = [] } = useCashRegisters(selectedBranchId || 0);
  const { data: sellers = [] } = useAdminSellers();

  // --- QUERY DE RÉCUPÉRATION DES SESSIONS ---
  const {
    data: paginatedData,
    isLoading,
    error,
    refetch,
  } = useAdminSessionsHistory({
    pharmacy_branch_id: selectedBranchId,
    cash_register_id: selectedRegisterId,
    user_id: selectedSellerId,
    status: status === "all" ? undefined : status,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    search: search || undefined,
    page,
    per_page: perPage,
  });

  const sessions = paginatedData?.data || [];
  const currency = sessions?.[0]?.register?.branch?.country?.currency || "XAF";

  // Réinitialiser la page à 1 si un filtre change
  useEffect(() => {
    setPage(1);
  }, [
    selectedBranchId,
    selectedRegisterId,
    selectedSellerId,
    status,
    startDate,
    endDate,
    search,
  ]);

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? parseInt(e.target.value) : undefined;
    setSelectedBranchId(val);
    setSelectedRegisterId(undefined); // Reset caisse filter
  };

  const handleResetFilters = () => {
    setSelectedBranchId(undefined);
    setSelectedRegisterId(undefined);
    setSelectedSellerId(undefined);
    setStatus("all");
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

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < (paginatedData?.last_page || 1)) setPage(page + 1);
  };

  // --- CALCUL DES TOTALS POUR LE RAPPORT DE LA PAGE ---
  const stats = useMemo(() => {
    let totalSalesPage = 0;
    let openCountPage = 0;
    sessions.forEach((s) => {
      if (s.closed_at === null) {
        openCountPage++;
      }
      if (s.sales_totals) {
        totalSalesPage +=
          (s.sales_totals.cash || 0) +
          (s.sales_totals.mobile_money || 0) +
          (s.sales_totals.card || 0);
      }
    });
    return {
      totalCount: paginatedData?.total || 0,
      openCountPage,
      totalSalesPage,
    };
  }, [paginatedData, sessions]);

  return (
    <div className="p-6 bg-slate-50 dark:bg-gray-900 min-h-screen text-slate-800 dark:text-white transition-colors duration-200">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Clock className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />{" "}
            Historique Global des Sessions de Caisse
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Supervisez les ouvertures, les clôtures, les fonds de caisse
            initiaux et les écarts de caisse de vos vendeurs.
          </p>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-gray-700 flex items-center gap-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-450 dark:text-gray-400 uppercase tracking-wider">
              Sessions (Filtres)
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {isLoading ? "---" : stats.totalCount}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-gray-700 flex items-center gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400">
            <Unlock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-455 dark:text-gray-400 uppercase tracking-wider">
              Actives (Page)
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {isLoading ? "---" : stats.openCountPage}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-gray-700 flex items-center gap-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-600 dark:text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-455 dark:text-gray-400 uppercase tracking-wider">
              CA Sessions (Page)
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
              {isLoading
                ? "---"
                : `${stats.totalSalesPage.toLocaleString()} ${currency}`}
            </h3>
          </div>
        </div>
      </div>

      {/* ================= BLOC DES FILTRES ================= */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-gray-700 mb-6">
        <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wide">
          <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />{" "}
          Filtres d'administration
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
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-450 mb-1.5">
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

            {/* Caissier */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-450 mb-1.5">
                Caissier / Vendeur
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
                <option value="">Tous les caissiers</option>
                {sellers.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                  >{`${s.first_name} ${s.last_name || ""}`}</option>
                ))}
              </select>
            </div>

            {/* Statut de session */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-455 mb-1.5">
                Statut de Session
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-350 dark:border-gray-700 rounded-xl text-sm bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white transition-colors cursor-pointer"
              >
                <option value="all">Tous statuts</option>
                <option value="open">Session Ouverte</option>
                <option value="closed">Session Clôturée</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            {/* Date début */}
            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-455 mb-1.5">
                Ouvertes du (Date)
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

            {/* Date fin */}
            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-455 mb-1.5 font-sans">
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
                <RefreshCw className="w-4 h-4" /> Réinitialiser les filtres
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= LISTE DE L'HISTORIQUE ================= */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-xs animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-48 bg-slate-200 dark:bg-gray-700 rounded-md" />
                <div className="h-5 w-16 bg-slate-200 dark:bg-gray-700 rounded-full" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-16 bg-slate-100 dark:bg-gray-750 rounded-md" />
                    <div className="h-5 w-24 bg-slate-200 dark:bg-gray-700 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center text-rose-500 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-60" />
          <p className="font-semibold text-sm">
            Une erreur est survenue lors du chargement des sessions.
          </p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-200 dark:border-gray-700 text-center shadow-xs  mx-auto space-y-4">
          <Inbox className="w-16 h-16 stroke-1 text-slate-350 dark:text-gray-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            Aucune session trouvée
          </h2>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Aucun historique de session n'est disponible pour la période ou les
            filtres choisis.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const isOpen = session.closed_at === null;
            const openedDate = new Date(session.opened_at);
            const closedDate = session.closed_at
              ? new Date(session.closed_at)
              : null;
            const totalSessionSales = session.sales_totals
              ? (session.sales_totals.cash || 0) +
                (session.sales_totals.mobile_money || 0) +
                (session.sales_totals.card || 0)
              : 0;

            return (
              <div
                key={session.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-xs hover:border-slate-350 dark:hover:border-gray-650 transition-colors overflow-hidden"
              >
                {/* En-tête de la session */}
                <div className="p-6 border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                      <Terminal className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                      {session.register?.name || "Terminal Inconnu"}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-gray-400 mt-1 pl-6">
                      Succursale :{" "}
                      <span className="font-semibold text-slate-600 dark:text-slate-250">
                        {session.register?.branch?.name}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider block">
                      Session N° #{session.id}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        isOpen
                          ? "bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400"
                          : "bg-slate-100 dark:bg-gray-700 text-slate-650 dark:text-gray-300"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
                      ></span>
                      {isOpen ? "Ouverte" : "Clôturée"}
                    </span>
                  </div>
                </div>

                {/* Métriques d'ouverture/fermeture */}
                <div className="p-0 grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <span className="text-xs text-slate-450 dark:text-gray-400 block font-semibold uppercase tracking-wider mb-1">
                      Caissier
                    </span>
                    <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-400" />
                      {session.user
                        ? `${session.user.first_name} ${session.user.last_name || ""}`
                        : "N/A"}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-450 dark:text-gray-400 block font-semibold uppercase tracking-wider mb-1">
                      Ouverture
                    </span>
                    <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {openedDate.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      à{" "}
                      {openedDate.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-450 dark:text-gray-400 block font-semibold uppercase tracking-wider mb-1">
                      Clôture
                    </span>
                    <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      {isOpen ? (
                        <span className="text-slate-400 dark:text-gray-500 font-medium italic">
                          En cours...
                        </span>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {closedDate?.toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          à{" "}
                          {closedDate?.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </>
                      )}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-455 dark:text-gray-400 block font-semibold uppercase tracking-wider mb-1">
                      Fonds Initial
                    </span>
                    <p className="text-sm font-bold text-slate-850 dark:text-white font-mono">
                      {session.opening_balance.toLocaleString()} {currency}
                    </p>
                  </div>
                </div>

                {/* Détails financiers */}
                {session.sales_totals && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-gray-700/60 bg-slate-50/20 dark:bg-gray-900/5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-4">
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-gray-450 font-bold uppercase tracking-wider">
                            Répartition des Ventes ({" "}
                            {totalSessionSales.toLocaleString()} {currency})
                          </span>
                          <div className="flex flex-wrap gap-4 mt-2">
                            <div className="flex items-center gap-1.5 text-xs text-slate-650 dark:text-gray-300 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Espèces :{" "}
                              <strong className="font-mono ">
                                {session.sales_totals.cash.toLocaleString()}{" "}
                                {currency}
                              </strong>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-650 dark:text-gray-300 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              Momo/OM :{" "}
                              <strong className="font-mono">
                                {session.sales_totals.mobile_money.toLocaleString()}{" "}
                                {currency}
                              </strong>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-650 dark:text-gray-300 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                              Carte :{" "}
                              <strong className="font-mono">
                                {session.sales_totals.card.toLocaleString()}{" "}
                                {currency}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {session.treasury_totals && (
                          <div>
                            <span className="text-[10px] text-slate-400 dark:text-gray-450 font-bold uppercase tracking-wider">
                              Mouvements de Trésorerie (Cash Net :{" "}
                              {session.treasury_totals.cash.net >= 0 ? "+" : ""}{" "}
                              {session.treasury_totals.cash.net.toLocaleString()}{" "}
                              {currency})
                            </span>
                            <div className="flex flex-wrap gap-4 mt-2">
                              <div className="flex items-center gap-1.5 text-xs text-slate-650 dark:text-gray-300 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                Apports :{" "}
                                <strong className="font-mono text-teal-600 dark:text-teal-400">
                                  +
                                  {session.treasury_totals.cash.in.toLocaleString()}{" "}
                                  {currency}
                                </strong>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-650 dark:text-gray-300 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Dépenses :{" "}
                                <strong className="font-mono text-rose-600 dark:text-rose-400">
                                  -
                                  {session.treasury_totals.cash.out.toLocaleString()}{" "}
                                  {currency}
                                </strong>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-650 dark:text-gray-300 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Versements :{" "}
                                <strong className="font-mono text-amber-600 dark:text-amber-400">
                                  -
                                  {session.treasury_totals.cash.transfer.toLocaleString()}{" "}
                                  {currency}
                                </strong>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-8 w-full sm:w-auto">
                        {isOpen ? (
                          <div>
                            <span className="text-[10px] text-slate-400 dark:text-gray-450 font-bold uppercase tracking-wider block">
                              Solde Clôture théorique (Cash)
                            </span>
                            <strong className="text-sm font-mono text-slate-800 dark:text-white">
                              {(session.current_balance || 0).toLocaleString()}{" "}
                              {currency}
                            </strong>
                          </div>
                        ) : (
                          <div className="bg-slate-100/50 dark:bg-gray-900/30 p-4 rounded-xl border border-slate-200 dark:border-gray-700/80 w-full sm:w-[350px]">
                            <span className="text-[10px] text-slate-400 dark:text-gray-450 font-bold uppercase tracking-wider block mb-3 text-center">
                              Rapport de clôture & Écarts
                            </span>
                            <div className="space-y-2 text-xs">
                              {/* Headers */}
                              <div className="grid grid-cols-4 font-bold text-[10px] text-slate-400 dark:text-gray-500 pb-1 border-b border-slate-200 dark:border-gray-750">
                                <span>Mode</span>
                                <span className="text-right">Attendu</span>
                                <span className="text-right">Déclaré</span>
                                <span className="text-right">Écart</span>
                              </div>
                              {/* Row Cash */}
                              {(() => {
                                const expected = session.current_balance || 0;
                                const declared = session.closing_balance || 0;
                                const diff = declared - expected;
                                return (
                                  <div className="grid grid-cols-4 font-medium items-center py-1">
                                    <span className="text-slate-600 dark:text-gray-300 font-bold">
                                      Espèces
                                    </span>
                                    <span className="text-right font-mono">
                                      {expected.toLocaleString()}
                                    </span>
                                    <span className="text-right font-mono">
                                      {declared.toLocaleString()}
                                    </span>
                                    <span
                                      className={`text-right font-mono font-bold ${diff === 0 ? "text-emerald-600 dark:text-emerald-400" : diff > 0 ? "text-amber-500 dark:text-amber-400" : "text-rose-500 dark:text-rose-455"}`}
                                    >
                                      {diff > 0 ? "+" : ""}
                                      {diff.toLocaleString()}
                                    </span>
                                  </div>
                                );
                              })()}
                              {/* Row Momo */}
                              {(() => {
                                const expected =
                                  session.treasury_totals?.mobile_money?.net ??
                                  (session.sales_totals?.mobile_money || 0);
                                const declared =
                                  session.closing_mobile_money || 0;
                                const diff = declared - expected;
                                return (
                                  <div className="grid grid-cols-4 font-medium items-center py-1">
                                    <span className="text-slate-600 dark:text-gray-300 font-bold">
                                      Momo/OM
                                    </span>
                                    <span className="text-right font-mono">
                                      {expected.toLocaleString()}
                                    </span>
                                    <span className="text-right font-mono">
                                      {declared.toLocaleString()}
                                    </span>
                                    <span
                                      className={`text-right font-mono font-bold ${diff === 0 ? "text-emerald-600 dark:text-emerald-400" : diff > 0 ? "text-amber-500 dark:text-amber-400" : "text-rose-500 dark:text-rose-455"}`}
                                    >
                                      {diff > 0 ? "+" : ""}
                                      {diff.toLocaleString()}
                                    </span>
                                  </div>
                                );
                              })()}
                              {/* Row Card */}
                              {(() => {
                                const expected =
                                  session.treasury_totals?.card?.net ??
                                  (session.sales_totals?.card || 0);
                                const declared = session.closing_card || 0;
                                const diff = declared - expected;
                                return (
                                  <div className="grid grid-cols-4 font-medium items-center py-1">
                                    <span className="text-slate-600 dark:text-gray-300 font-bold">
                                      Carte BC
                                    </span>
                                    <span className="text-right font-mono">
                                      {expected.toLocaleString()}
                                    </span>
                                    <span className="text-right font-mono">
                                      {declared.toLocaleString()}
                                    </span>
                                    <span
                                      className={`text-right font-mono font-bold ${diff === 0 ? "text-emerald-600 dark:text-emerald-400" : diff > 0 ? "text-amber-500 dark:text-amber-400" : "text-rose-500 dark:text-rose-455"}`}
                                    >
                                      {diff > 0 ? "+" : ""}
                                      {diff.toLocaleString()}
                                    </span>
                                  </div>
                                );
                              })()}
                              {/* Total Discrepancy */}
                              {(() => {
                                const expCash = session.current_balance || 0;
                                const expMomo =
                                  session.treasury_totals?.mobile_money?.net ??
                                  (session.sales_totals?.mobile_money || 0);
                                const expCard =
                                  session.treasury_totals?.card?.net ??
                                  (session.sales_totals?.card || 0);

                                const decCash = session.closing_balance || 0;
                                const decMomo =
                                  session.closing_mobile_money || 0;
                                const decCard = session.closing_card || 0;

                                const globalDiff =
                                  decCash -
                                  expCash +
                                  (decMomo - expMomo) +
                                  (decCard - expCard);

                                return (
                                  <div className="grid grid-cols-4 font-bold items-center pt-2 border-t border-slate-200 dark:border-gray-750 mt-1">
                                    <span className="text-slate-250 dark:text-gray-250">
                                      Écart Global
                                    </span>
                                    <span className="col-span-3 text-right font-mono font-black">
                                      <span
                                        className={`px-2.5 py-0.5 rounded-full text-xs ${
                                          globalDiff === 0
                                            ? "bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400"
                                            : globalDiff > 0
                                              ? "bg-amber-100 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400"
                                              : "bg-rose-100 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400"
                                        }`}
                                      >
                                        {globalDiff === 0
                                          ? ""
                                          : globalDiff > 0
                                            ? "+"
                                            : ""}
                                        {globalDiff.toLocaleString()} {currency}
                                      </span>
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination controls */}
      {paginatedData && paginatedData.last_page > 1 && (
        <div className="mt-6 bg-white dark:bg-gray-800 px-6 py-4 rounded-2xl border border-slate-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-gray-850/30 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-gray-400">
            Affichage de {paginatedData.from || 0} à {paginatedData.to || 0} sur{" "}
            {paginatedData.total} sessions
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
              Page {page} sur {paginatedData.last_page}
            </span>
            <button
              onClick={handleNextPage}
              disabled={page === paginatedData.last_page}
              className="p-2 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-gray-300 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
