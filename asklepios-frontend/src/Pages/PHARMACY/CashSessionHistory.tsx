import React, { useState, useMemo } from "react";
import {
  Calendar,
  TrendingUp,
  Inbox,
  AlertCircle,
  Clock,
  LayoutGrid,
  Unlock,
} from "lucide-react";
import { useMySessionsHistory } from "../../hooks/pharmacy/useCashRegisterSession";

export default function CashSessionHistory() {
  const { data: history, isLoading, error, refetch } = useMySessionsHistory();
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "closed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const currency = history?.[0]?.register?.branch?.country?.currency || "XAF";

  // Filtrer l'historique
  const filteredHistory = useMemo(() => {
    if (!history) return [];
    return history.filter((session) => {
      const matchesSearch =
        session.register?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.register?.branch?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isOpen = session.closed_at === null;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "open" && isOpen) ||
        (filterStatus === "closed" && !isOpen);

      return matchesSearch && matchesStatus;
    });
  }, [history, searchQuery, filterStatus]);

  // Calculer les statistiques des 7 derniers jours
  const stats = useMemo(() => {
    if (!history) return { totalCount: 0, openCount: 0, totalSales: 0 };
    let totalSales = 0;
    let openCount = 0;
    history.forEach((session) => {
      if (session.closed_at === null) {
        openCount++;
      }
      if (session.sales_totals) {
        totalSales += (session.sales_totals.cash || 0) +
                     (session.sales_totals.mobile_money || 0) +
                     (session.sales_totals.card || 0);
      }
    });
    return {
      totalCount: history.length,
      openCount,
      totalSales,
    };
  }, [history]);

  if (error) {
    return (
      <div className="p-6 bg-slate-50 dark:bg-gray-900 min-h-screen text-slate-900 dark:text-white transition-colors duration-200">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-slate-200 dark:border-gray-700 max-w-xl mx-auto text-center shadow-sm space-y-4">
          <AlertCircle className="w-14 h-14 text-rose-500 mx-auto animate-bounce" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Erreur de chargement</h2>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Impossible de récupérer l'historique de vos sessions de caisse.
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer mx-auto block"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 dark:bg-gray-900 min-h-screen text-slate-900 dark:text-white transition-colors duration-200 animate-in fade-in duration-300">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Clock className="w-7 h-7 text-emerald-600 dark:text-emerald-400" /> Historique des Sessions
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Consultez vos ouvertures et clôtures de caisse sur les 7 derniers jours.
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
            <p className="text-xs font-bold text-slate-450 dark:text-gray-400 uppercase tracking-wider">Sessions cette semaine</p>
            {isLoading ? (
              <div className="h-7 w-12 bg-slate-200 dark:bg-gray-700 animate-pulse rounded-md mt-1" />
            ) : (
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.totalCount}</h3>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-gray-700 flex items-center gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400">
            <Unlock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-455 dark:text-gray-400 uppercase tracking-wider">Sessions actives</p>
            {isLoading ? (
              <div className="h-7 w-12 bg-slate-200 dark:bg-gray-700 animate-pulse rounded-md mt-1" />
            ) : (
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.openCount}</h3>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-gray-700 flex items-center gap-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-600 dark:text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-455 dark:text-gray-400 uppercase tracking-wider">Volume de ventes total</p>
            {isLoading ? (
              <div className="h-7 w-28 bg-slate-200 dark:bg-gray-700 animate-pulse rounded-md mt-1" />
            ) : (
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
                {stats.totalSales.toLocaleString()} {currency}
              </h3>
            )}
          </div>
        </div>
      </div>

      {/* Filtres & Recherche */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xs border border-slate-200 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === "all"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-600 dark:text-gray-300"
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setFilterStatus("open")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === "open"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-600 dark:text-gray-300"
            }`}
          >
            Ouvertes
          </button>
          <button
            onClick={() => setFilterStatus("closed")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === "closed"
                ? "bg-slate-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-600 dark:text-gray-300"
            }`}
          >
            Clôturées
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-gray-550">
            <LayoutGrid className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Rechercher par caisse, succursale..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white transition-colors"
          />
        </div>
      </div>

      {/* Liste de l'historique */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-xs animate-pulse space-y-4">
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
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl border border-slate-200 dark:border-gray-700 text-center shadow-xs max-w-xl mx-auto space-y-4">
          <Inbox className="w-16 h-16 stroke-1 text-slate-300 dark:text-gray-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Aucune session trouvée</h2>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Aucun historique de session n'est disponible pour la période ou les filtres choisis.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((session) => {
            const isOpen = session.closed_at === null;
            const openedDate = new Date(session.opened_at);
            const closedDate = session.closed_at ? new Date(session.closed_at) : null;
            const totalSessionSales = session.sales_totals
              ? (session.sales_totals.cash || 0) +
                (session.sales_totals.mobile_money || 0) +
                (session.sales_totals.card || 0)
              : 0;

            return (
              <div
                key={session.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-xs hover:border-slate-300 dark:hover:border-gray-600 transition-colors overflow-hidden"
              >
                {/* En-tête de la session */}
                <div className="p-6 border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">
                      {session.register?.name || "Terminal Inconnu"}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-gray-400 mt-0.5">
                      Succursale : <span className="font-semibold text-slate-600 dark:text-gray-305">{session.register?.branch?.name}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider block">Session N° #{session.id}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        isOpen
                          ? "bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400"
                          : "bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                      {isOpen ? "Ouverte" : "Clôturée"}
                    </span>
                  </div>
                </div>

                {/* Métriques d'ouverture/fermeture */}
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <span className="text-xs text-slate-455 dark:text-gray-405 block font-semibold uppercase tracking-wider mb-1">Ouverture</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {openedDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} à{" "}
                      {openedDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-455 dark:text-gray-405 block font-semibold uppercase tracking-wider mb-1">Clôture</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      {isOpen ? (
                        <span className="text-slate-400 dark:text-gray-500 font-medium italic">En cours...</span>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {closedDate?.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} à{" "}
                          {closedDate?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </>
                      )}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-455 dark:text-gray-405 block font-semibold uppercase tracking-wider mb-1">Fonds Initial</span>
                    <p className="text-sm font-bold text-slate-850 dark:text-white font-mono">
                      {session.opening_balance.toLocaleString()} {currency}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-455 dark:text-gray-405 block font-semibold uppercase tracking-wider mb-1">
                      {isOpen ? "Solde Estimé" : "Solde Final Clôturé"}
                    </span>
                    <p className="text-sm font-bold text-slate-850 dark:text-white font-mono">
                      {isOpen
                        ? `${(session.current_balance || 0).toLocaleString()} ${currency}`
                        : `${(session.closing_balance || 0).toLocaleString()} ${currency}`}
                    </p>
                  </div>
                </div>

                {/* Détails financiers */}
                {session.sales_totals && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-gray-700/60 bg-slate-50/20 dark:bg-gray-900/5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-gray-450 font-bold uppercase tracking-wider">Répartition des Ventes ({totalSessionSales.toLocaleString()} {currency})</span>
                        <div className="flex flex-wrap gap-4 mt-2">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-gray-300 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Espèces : <strong className="font-mono">{session.sales_totals.cash.toLocaleString()} {currency}</strong>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-gray-300 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Momo/OM : <strong className="font-mono">{session.sales_totals.mobile_money.toLocaleString()} {currency}</strong>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-gray-300 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                            Carte : <strong className="font-mono">{session.sales_totals.card.toLocaleString()} {currency}</strong>
                          </div>
                        </div>
                      </div>
                      
                      {!isOpen && (
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-slate-400 dark:text-gray-450 font-bold uppercase tracking-wider block">Écart de caisse</span>
                          {(() => {
                            const expected = (session.current_balance || 0);
                            const actual = (session.closing_balance || 0);
                            const diff = actual - expected;
                            if (diff === 0) {
                              return <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Équilibré (0 {currency})</span>;
                            } else if (diff > 0) {
                              return <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">Excédent (+{diff.toLocaleString()} {currency})</span>;
                            } else {
                              return <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">Déficit ({diff.toLocaleString()} {currency})</span>;
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
