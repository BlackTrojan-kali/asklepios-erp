import React, { useState } from "react";
import { CreditCard, Search, FileText, CheckCircle, Clock } from "lucide-react";
import { useLabRequests } from "../../../hooks/laboratory/useLabRequest";
import { CreatePaymentModal } from "../../../components/modals/Base_hopital/Finance/CreatePaymentModal";
import type { LabRequestDto } from "../../../types/types";
import { useQueryClient } from "@tanstack/react-query";

const LabInvoices = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("PENDING_PAYMENT");
  const [searchTerm, setSearchTerm] = useState("");
  const { data: labRequests, isLoading } = useLabRequests(statusFilter);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const handlePay = (req: LabRequestDto) => {
    setSelectedInvoice(req.invoice);
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
                  Montant
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
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Chargement...
                  </td>
                </tr>
              ) : filteredRequests?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Aucune demande trouvée.
                  </td>
                </tr>
              ) : (
                filteredRequests?.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-mono text-sm font-medium text-slate-900 dark:text-white font-bold">
                        REQ-{req.id}
                      </div>
                      <div className="text-xs text-slate-500 mb-1">
                        {req.created_at ? new Date(req.created_at).toLocaleString() : ''}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {req.lines?.map((line) => (
                          <span
                            key={line.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50"
                          >
                            {line.test?.name}
                          </span>
                        ))}
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
                      {req.status === "PENDING_PAYMENT" && (
                        <button
                          onClick={() => handlePay(req)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
                        >
                          <CreditCard className="w-4 h-4" />
                          Encaisser
                        </button>
                      )}
                      {req.status === "PAID" && (
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium">
                          <FileText className="w-4 h-4" />
                          Reçu
                        </button>
                      )}
                    </td>
                  </tr>
                ))
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
            queryClient.invalidateQueries({ queryKey: ["labRequests"] });
          }}
          invoice={selectedInvoice}
        />
      )}
    </div>
  );
};

export default LabInvoices;
