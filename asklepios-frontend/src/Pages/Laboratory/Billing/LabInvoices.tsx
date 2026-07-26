import React, { useState } from "react";
import { CreditCard, Search, FileText, CheckCircle, Clock, ChevronDown, ChevronUp, User } from "lucide-react";
import { useLabRequests } from "../../../hooks/laboratory/useLabRequest";
import { CreatePaymentModal } from "../../../components/modals/Base_hopital/Finance/CreatePaymentModal";
import type { LabRequestDto, LabRequestLineDto } from "../../../types/types";
import { useQueryClient } from "@tanstack/react-query";

const LabInvoices = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("PENDING_PAYMENT");
  const [searchTerm, setSearchTerm] = useState("");
  const { data: labRequests, isLoading } = useLabRequests(statusFilter);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [initialPaymentAmount, setInitialPaymentAmount] = useState<number | undefined>(undefined);
  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(null);
  const [selectedLineIds, setSelectedLineIds] = useState<number[]>([]);

  const getBilledBy = (req: LabRequestDto) => {
    if (req.profileDoctor?.user) {
      return `Dr. ${req.profileDoctor.user.first_name} ${req.profileDoctor.user.last_name || ""}`;
    }
    if (req.external_prescriber_name) {
      return req.external_prescriber_name;
    }
    const caissier = req.invoice?.payments?.[0]?.reception?.user;
    if (caissier) {
      return `${caissier.first_name} ${caissier.last_name || ""}`;
    }
    return "Comptoir Laboratoire";
  };

  // Helper pour vérifier si une ligne d'examen est déjà payée
  const checkIsLinePaid = (line: LabRequestLineDto, req: LabRequestDto) => {
    if (req.status === "PAID" || line.is_paid) return true;
    
    // Calcul de secours basé sur le cumul des montants payés sur la facture
    const totalPaid = (req.invoice?.payments || []).reduce(
      (sum: number, p: any) => sum + Number(p.amount || 0),
      0
    );
    if (totalPaid <= 0) return false;

    const getLinePrice = (l: any) => (l.price !== undefined && l.price !== null ? l.price : (l.test?.price ?? 0));
    let runningSum = 0;
    for (const l of req.lines || []) {
      runningSum += getLinePrice(l);
      if (l.id === line.id) {
        return runningSum <= totalPaid + 0.01;
      }
    }
    return false;
  };

  const toggleExpand = (req: LabRequestDto) => {
    if (expandedRequestId === req.id) {
      setExpandedRequestId(null);
    } else {
      setExpandedRequestId(req.id);
      if (req.lines) {
        // Sélectionner par défaut uniquement les examens NON encore payés
        const unpaidLineIds = req.lines
          .filter((l) => !checkIsLinePaid(l, req))
          .map((l) => l.id);
        setSelectedLineIds(unpaidLineIds);
      }
    }
  };

  const toggleLineSelection = (line: LabRequestLineDto, req: LabRequestDto) => {
    if (checkIsLinePaid(line, req)) return; // Empêcher la sélection si déjà payé

    setSelectedLineIds((prev) =>
      prev.includes(line.id) ? prev.filter((id) => id !== line.id) : [...prev, line.id]
    );
  };

  const handlePay = (req: LabRequestDto, customAmount?: number) => {
    setSelectedInvoice(req.invoice);
    setInitialPaymentAmount(customAmount);
    setIsPaymentModalOpen(true);
  };

  const filteredRequests = labRequests?.filter((req) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      req.patient?.first_name.toLowerCase().includes(searchLower) ||
      req.patient?.last_name.toLowerCase().includes(searchLower) ||
      req.patient?.patient_code.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Facturation Laboratoire
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Encaissez les demandes d'examens
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter("PENDING_PAYMENT")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                statusFilter === "PENDING_PAYMENT"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              <Clock className="w-4 h-4" />
              En attente de paiement
            </button>
            <button
              onClick={() => setStatusFilter("PAID")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                statusFilter === "PAID"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Payées
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Rechercher un patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Demande / Date
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Prescrit / Facturé par
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Montant Total
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Chargement...
                  </td>
                </tr>
              ) : filteredRequests?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Aucune demande trouvée.
                  </td>
                </tr>
              ) : (
                filteredRequests?.map((req) => {
                  const isExpanded = expandedRequestId === req.id;
                  const getLinePrice = (l: any) => (l.price !== undefined && l.price !== null ? l.price : (l.test?.price ?? 0));
                  
                  const unpaidLines = req.lines?.filter((l) => !checkIsLinePaid(l, req)) || [];
                  const unpaidTotal = unpaidLines.reduce((sum, l) => sum + getLinePrice(l), 0);

                  const selectedLinesTotal = req.lines
                    ?.filter((l) => !checkIsLinePaid(l, req) && selectedLineIds.includes(l.id))
                    .reduce((sum, l) => sum + getLinePrice(l), 0) || 0;

                  return (
                    <React.Fragment key={req.id}>
                      <tr
                        onClick={() => toggleExpand(req)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                            <div>
                              <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                                REQ-{req.id}
                              </div>
                              <div className="text-xs text-slate-500">
                                {req.created_at ? new Date(req.created_at).toLocaleString() : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {req.patient?.first_name} {req.patient?.last_name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {req.patient?.patient_code}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{getBilledBy(req)}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {req.invoice?.total_amount?.toLocaleString()} FCFA
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              req.status === "PAID"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                            }`}
                          >
                            {req.status === "PAID" ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {req.status === "PAID" ? "Payé" : "En attente"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {req.status === "PENDING_PAYMENT" && (
                              <button
                                onClick={() => handlePay(req, unpaidTotal > 0 ? unpaidTotal : undefined)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
                              >
                                <CreditCard className="w-4 h-4" />
                                {unpaidLines.length < (req.lines?.length || 0)
                                  ? `Encaisser le reste (${unpaidTotal.toLocaleString()} FCFA)`
                                  : "Encaisser tout"}
                              </button>
                            )}
                            {req.status === "PAID" && (
                              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium">
                                <FileText className="w-4 h-4" />
                                Reçu
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED DETAILS */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                          <td colSpan={6} className="p-0">
                            <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                  Sélection des examens à réaliser/encaisser ({req.lines?.length || 0} au total)
                                </h4>
                                {req.status === "PENDING_PAYMENT" && (
                                  <div className="text-xs text-slate-500">
                                    Les examens déjà réglés sont grisés et verrouillés
                                  </div>
                                )}
                              </div>
                              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                      {req.status === "PENDING_PAYMENT" && (
                                        <th className="px-4 py-2 w-10 text-center"></th>
                                      )}
                                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                                        Examen
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                                        Catégorie
                                      </th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">
                                        Prix
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {req.lines?.map((line) => {
                                      const isPaid = checkIsLinePaid(line, req);
                                      const isChecked = selectedLineIds.includes(line.id) && !isPaid;
                                      const linePrice = getLinePrice(line);
                                      return (
                                        <tr
                                          key={line.id}
                                          className={`transition-colors ${
                                            isPaid
                                              ? "bg-slate-100/70 dark:bg-slate-900/40 opacity-75"
                                              : isChecked
                                              ? "bg-indigo-50/40 dark:bg-indigo-900/10"
                                              : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                          }`}
                                        >
                                          {req.status === "PENDING_PAYMENT" && (
                                            <td className="px-4 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                              <input
                                                type="checkbox"
                                                checked={isPaid || isChecked}
                                                disabled={isPaid}
                                                onChange={() => toggleLineSelection(line, req)}
                                                className={`w-4 h-4 rounded border-slate-300 ${
                                                  isPaid
                                                    ? "text-emerald-500 cursor-not-allowed opacity-60"
                                                    : "text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                }`}
                                              />
                                            </td>
                                          )}
                                          <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">
                                            <div className="flex items-center gap-2">
                                              <span>{line.test?.name}</span>
                                              {isPaid && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 uppercase">
                                                  <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                  Déjà Payé
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                                            {line.test?.category?.name || "-"}
                                          </td>
                                          <td className="px-4 py-2 text-right font-medium">
                                            {isPaid ? (
                                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                                {linePrice?.toLocaleString()} FCFA
                                              </span>
                                            ) : (
                                              <span className="text-slate-700 dark:text-slate-300">
                                                {linePrice?.toLocaleString()} FCFA
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>

                              {req.status === "PENDING_PAYMENT" && (
                                <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-900/60 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-3 border border-slate-200 dark:border-slate-700">
                                  {unpaidLines.length === 0 ? (
                                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4" />
                                      Tous les examens de cette demande ont déjà été entièrement réglés.
                                    </div>
                                  ) : (
                                    <>
                                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Examens à régler sélectionnés :{" "}
                                        <span className="font-bold text-slate-900 dark:text-white">
                                          {selectedLineIds.filter((id) => !req.lines?.find((l) => l.id === id && checkIsLinePaid(l, req)) ? true : false).length} / {unpaidLines.length}
                                        </span>{" "}
                                        — Montant à régler :{" "}
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                                          {selectedLinesTotal.toLocaleString()} FCFA
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handlePay(req, selectedLinesTotal)}
                                        disabled={selectedLinesTotal === 0}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-bold shadow-sm"
                                      >
                                        <CreditCard className="w-4 h-4" />
                                        Encaisser la sélection ({selectedLinesTotal.toLocaleString()} FCFA)
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isPaymentModalOpen && selectedInvoice && (
        <CreatePaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedInvoice(null);
            setInitialPaymentAmount(undefined);
            queryClient.invalidateQueries({ queryKey: ["labRequests"] });
          }}
          invoice={selectedInvoice}
          initialAmount={initialPaymentAmount}
        />
      )}
    </div>
  );
};

export default LabInvoices;
