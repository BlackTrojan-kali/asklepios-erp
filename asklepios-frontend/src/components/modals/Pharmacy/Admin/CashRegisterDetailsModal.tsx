import React, { useState, useMemo } from "react";
import {
  X,
  User,
  Coins,
  Smartphone,
  CreditCard,
  Landmark,
  Inbox,
  Clock,
} from "lucide-react";
import { useAdminSessionsHistory } from "../../../../hooks/pharmacy/useCashRegisterSession";
import type { CashRegisterDto } from "../../../../services/pharmacy/cashRegisterService";

interface CashRegisterDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  register: CashRegisterDto | null;
}

export default function CashRegisterDetailsModal({
  isOpen,
  onClose,
  register,
}: CashRegisterDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");

  // Query past sessions for this specific cash register
  const { data: sessionsHistoryResponse, isLoading: isLoadingHistory } =
    useAdminSessionsHistory({
      cash_register_id: register?.id,
      per_page: 20,
    });

  const sessions = useMemo(() => {
    return sessionsHistoryResponse?.data || [];
  }, [sessionsHistoryResponse]);

  if (!isOpen || !register) return null;

  const session = register.active_session;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/60">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-base">
              <Landmark className="w-5 h-5 text-teal-600" /> Supervision Caisse
              : {register.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              Code Marchand :{" "}
              <span className="font-mono font-bold">
                {register.merchant_code || "Non configuré"}
              </span>{" "}
              • Statut :{" "}
              <span
                className={`font-bold ${register.status === "active" ? "text-emerald-600" : "text-rose-500"}`}
              >
                {register.status === "active" ? "Active" : "Inactive"}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-400 dark:text-gray-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-700 px-6 bg-gray-50/50 dark:bg-gray-800/40">
          <button
            onClick={() => setActiveTab("current")}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "current"
                ? "border-teal-600 text-teal-600 dark:text-teal-400"
                : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            Session Active & Temps Réel
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "history"
                ? "border-teal-600 text-teal-600 dark:text-teal-400"
                : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            Historique des Sessions
          </button>
        </div>

        {/* Corps - Défilant */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: SESSION ACTIVE & LIVE STATS */}
          {activeTab === "current" && (
            <div className="space-y-6">
              {!session ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                  <Inbox className="w-12 h-12 stroke-1 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <h4 className="font-bold text-gray-800 dark:text-white">
                    Aucune session de garde active
                  </h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-sm mx-auto">
                    Cette caisse est actuellement fermée. Aucun caissier n'est
                    connecté sur ce terminal.
                  </p>
                </div>
              ) : (
                <>
                  {/* Profil Caissier & Date d'ouverture */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 rounded-xl">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-gray-500 block tracking-wider">
                          Caissier Actif
                        </span>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                          {session.user
                            ? `${session.user.first_name} ${session.user.last_name || ""}`
                            : "Chargement..."}
                        </h4>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                          {session.user?.email ||
                            session.user?.phone ||
                            "Pas de contacts"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 md:border-l md:border-gray-200/60 dark:md:border-gray-700 md:pl-6">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-gray-500 block tracking-wider">
                          Ouverture de Session
                        </span>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                          {new Date(session.opened_at).toLocaleDateString()} à{" "}
                          {new Date(session.opened_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </h4>
                        {session.opening_notes && (
                          <p
                            className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 italic max-w-xs truncate"
                            title={session.opening_notes}
                          >
                            Note : {session.opening_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Solde Cash & Totaux */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Encaisse Actuelle (Théorique) */}
                    <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5" /> Encaisse Théorique
                        (CASH)
                      </span>
                      <h4 className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                        {(session.current_balance ?? 0).toLocaleString()}{" "}
                        <span className="text-xs font-bold">XAF</span>
                      </h4>
                      <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1">
                        Fond Initial ({session.opening_balance.toLocaleString()}
                        ) + Ventes Cash + Entrées - Retraits
                      </p>
                    </div>

                    {/* Ventes par Mode de Règlement */}
                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl md:col-span-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 block mb-2.5">
                        Ventes Enregistrées par ce Terminal
                      </span>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="border-r border-gray-200/60 dark:border-gray-700 pr-2">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <Coins className="w-3 h-3 text-amber-500" /> Espèces
                          </span>
                          <p className="text-sm font-bold text-gray-800 dark:text-white font-mono mt-0.5">
                            {(session.sales_totals?.cash ?? 0).toLocaleString()}{" "}
                            XAF
                          </p>
                        </div>
                        <div className="border-r border-gray-200/60 dark:border-gray-700 pr-2">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <Smartphone className="w-3 h-3 text-blue-500" />{" "}
                            Mobile Money
                          </span>
                          <p className="text-sm font-bold text-slate-800 dark:text-white font-mono mt-0.5">
                            {(
                              session.sales_totals?.mobile_money ?? 0
                            ).toLocaleString()}{" "}
                            XAF
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-purple-500" />{" "}
                            Carte Bancaire
                          </span>
                          <p className="text-sm font-bold text-slate-800 dark:text-white font-mono mt-0.5">
                            {(session.sales_totals?.card ?? 0).toLocaleString()}{" "}
                            XAF
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Détails des flux de Trésorerie Manuels */}
                  {session.treasury_totals && (
                    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                      <h4 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-3">
                        Mouvements Manuels de Trésorerie sur la Session
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Espèces */}
                        <div className="bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700">
                          <span className="font-bold text-gray-700 dark:text-gray-300 block border-b border-gray-200 dark:border-gray-700 pb-1.5 mb-2">
                            Espèces (CASH)
                          </span>
                          <div className="space-y-1.5 font-mono">
                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                              <span>Apports (+) :</span>
                              <span>
                                +
                                {(
                                  session.treasury_totals.cash?.in ?? 0
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-rose-600 dark:text-rose-400">
                              <span>Décaissements (-) :</span>
                              <span>
                                -
                                {(
                                  session.treasury_totals.cash?.out ?? 0
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-blue-600 dark:text-blue-400 border-t border-dashed border-gray-200 dark:border-gray-700 pt-1">
                              <span>Transferts émis :</span>
                              <span>
                                -
                                {(
                                  session.treasury_totals.cash?.transfer ?? 0
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Mobile Money */}
                        <div className="bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700">
                          <span className="font-bold text-gray-700 dark:text-gray-300 block border-b border-gray-200 dark:border-gray-700 pb-1.5 mb-2">
                            Mobile Money
                          </span>
                          <div className="space-y-1.5 font-mono">
                            <div className="flex justify-between text-emerald-600">
                              <span>Apports (+) :</span>
                              <span>
                                +
                                {(
                                  session.treasury_totals.mobile_money?.in ?? 0
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-rose-600">
                              <span>Décaissements (-) :</span>
                              <span>
                                -
                                {(
                                  session.treasury_totals.mobile_money?.out ?? 0
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-blue-600 border-t border-dashed border-slate-200 dark:border-gray-750 pt-1">
                              <span>Transferts émis :</span>
                              <span>
                                -
                                {(
                                  session.treasury_totals.mobile_money
                                    ?.transfer ?? 0
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Carte Bancaire */}
                        <div className="bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700">
                          <span className="font-bold text-gray-700 dark:text-gray-300 block border-b border-gray-200 dark:border-gray-700 pb-1.5 mb-2">
                            Carte Bancaire
                          </span>
                          <div className="space-y-1.5 font-mono">
                            <div className="flex justify-between text-emerald-600">
                              <span>Apports (+) :</span>
                              <span>
                                +
                                {(
                                  session.treasury_totals.card?.in ?? 0
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-rose-600">
                              <span>Décaissements (-) :</span>
                              <span>
                                -
                                {(
                                  session.treasury_totals.card?.out ?? 0
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-blue-600 border-t border-dashed border-slate-200 dark:border-gray-750 pt-1">
                              <span>Transferts émis :</span>
                              <span>
                                -
                                {(
                                  session.treasury_totals.card?.transfer ?? 0
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 2: HISTORIQUE DES SESSIONS */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                        <th className="p-4">Agent / Caissier</th>
                        <th className="p-4">Ouverture</th>
                        <th className="p-4">Fermeture</th>
                        <th className="p-4 text-right">Fond Initial</th>
                        <th className="p-4 text-right">Solde Final Réel</th>
                        <th className="p-4 text-right">Écart constaté</th>
                        <th className="p-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-xs">
                      {isLoadingHistory ? (
                        [1, 2, 3, 4].map((i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="p-4">
                              <div className="h-3.5 bg-slate-200 dark:bg-gray-800 rounded-md w-28" />
                            </td>
                            <td className="p-4">
                              <div className="h-3.5 bg-slate-150 dark:bg-gray-800 rounded-md w-24" />
                            </td>
                            <td className="p-4">
                              <div className="h-3.5 bg-slate-150 dark:bg-gray-800 rounded-md w-24" />
                            </td>
                            <td className="p-4 text-right">
                              <div className="h-3.5 bg-slate-200 dark:bg-gray-800 rounded-md w-16 ml-auto" />
                            </td>
                            <td className="p-4 text-right">
                              <div className="h-3.5 bg-slate-200 dark:bg-gray-800 rounded-md w-16 ml-auto" />
                            </td>
                            <td className="p-4 text-right">
                              <div className="h-3.5 bg-slate-200 dark:bg-gray-800 rounded-md w-12 ml-auto" />
                            </td>
                            <td className="p-4">
                              <div className="h-5 bg-slate-150 dark:bg-gray-800 rounded-md w-12" />
                            </td>
                          </tr>
                        ))
                      ) : sessions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="p-12 text-center text-gray-400 dark:text-gray-500"
                          >
                            <Inbox className="w-12 h-12 stroke-1 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                            Aucune session de caisse n'a été enregistrée pour ce
                            terminal.
                          </td>
                        </tr>
                      ) : (
                        sessions.map((sess) => {
                          const isClosed = !!sess.closed_at;

                          // Calcul d'écart (théorique vs réel)
                          // Le solde réel déclaré à la clôture est dans sess.closing_balance.
                          // Le solde théorique de fin est dans sess.current_balance ou sess.balance.
                          const theoretical = sess.current_balance ?? 0;
                          const real = sess.closing_balance ?? 0;
                          const gap = isClosed ? real - theoretical : 0;

                          return (
                            <tr
                              key={sess.id}
                              className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <td className="p-4 font-semibold text-gray-800 dark:text-white">
                                {sess.user
                                  ? `${sess.user.first_name} ${sess.user.last_name || ""}`
                                  : "-"}
                              </td>
                              <td className="p-4 font-mono text-gray-500 dark:text-gray-400">
                                {new Date(sess.opened_at).toLocaleDateString()}{" "}
                                {new Date(sess.opened_at).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </td>
                              <td className="p-4 font-mono text-slate-500">
                                {sess.closed_at ? (
                                  <>
                                    {new Date(
                                      sess.closed_at,
                                    ).toLocaleDateString()}{" "}
                                    {new Date(
                                      sess.closed_at,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </>
                                ) : (
                                  <span className="text-teal-600 dark:text-teal-400 font-bold">
                                    En cours
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-right font-mono font-medium">
                                {sess.opening_balance.toLocaleString()}
                              </td>
                              <td className="p-4 text-right font-mono font-medium">
                                {isClosed ? real.toLocaleString() : "-"}
                              </td>
                              <td className="p-4 text-right font-mono">
                                {isClosed ? (
                                  gap === 0 ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                      0
                                    </span>
                                  ) : gap > 0 ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                      +{gap.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-rose-600 dark:text-rose-400 font-black">
                                      {gap.toLocaleString()}
                                    </span>
                                  )
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-4">
                                <span
                                  className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold tracking-wider uppercase ${
                                    isClosed
                                      ? "bg-slate-100 text-slate-800 dark:bg-gray-800 dark:text-gray-400"
                                      : "bg-teal-100 text-teal-800 dark:bg-teal-950/20 dark:text-teal-400"
                                  }`}
                                >
                                  {isClosed ? "Fermée" : "Ouverte"}
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
