import React, { useState } from "react";
import Swal from "sweetalert2";
import {
  Building,
  DollarSign,
  Inbox,
  X,
  Check,
} from "lucide-react";
import { useBranches } from "../../../../hooks/pharmacy/useBranche";
import {
  usePaymentTransactions,
  useCancelPaymentTransaction,
} from "../../../../hooks/pharmacy/usePaymentTransaction";
import { type PaymentTransactionDto } from "../../../../services/pharmacy/paymentTransactionService";
import ConfirmDepositModal from "../../../../components/modals/Pharmacy/Admin/ConfirmDepositModal";

function TableSkeleton() {
  return (
    <tbody className="divide-y divide-slate-100 dark:divide-gray-700 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className="bg-white dark:bg-gray-800">
          <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-24" /></td>
          <td className="p-4"><div className="h-4 bg-slate-150 dark:bg-gray-750 rounded w-32" /></td>
          <td className="p-4"><div className="h-4 bg-slate-100 dark:bg-gray-800 rounded w-20" /></td>
          <td className="p-4"><div className="h-4 bg-slate-150 dark:bg-gray-750 rounded w-32" /></td>
          <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-16 text-right" /></td>
          <td className="p-4"><div className="h-8 bg-slate-200 dark:bg-gray-700 rounded w-28 mx-auto" /></td>
        </tr>
      ))}
    </tbody>
  );
}

export default function AdminPendingDeposits() {
  // --- ÉTATS ---
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
  
  // Modale
  const [showConfirmModal, setShowConfirmModal] = useState<PaymentTransactionDto | null>(null);

  // --- HOOKS ---
  const { data: branches = [] } = useBranches();

  // Transactions
  const { data: pendingTxResponse = [], isLoading: loadingPending, refetch: refetchTransactions } = usePaymentTransactions({
    pharmacy_branch_id: selectedBranchId,
    status: "pending",
    paginated: false,
  });

  const cancelMutation = useCancelPaymentTransaction();

  // Variables calculées
  const pendingTxList = (pendingTxResponse as PaymentTransactionDto[]) || [];

  // Rejeter/Annuler versement bancaire
  const handleCancelVerification = (tx: PaymentTransactionDto) => {
    Swal.fire({
      title: "Annuler ce versement ?",
      text: "Le montant sera restitué sur le compte ou la caisse d'origine.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Oui, annuler",
      cancelButtonText: "Non",
    }).then((result) => {
      if (result.isConfirmed) {
        cancelMutation.mutate(tx.id, {
          onSuccess: () => {
            Swal.fire({
              icon: "success",
              title: "Versement annulé",
              text: "Les fonds ont été replacés sur le compte d'origine.",
              confirmButtonColor: "#10b981",
            });
            refetchTransactions();
          },
          onError: (err: any) => {
            Swal.fire({
              icon: "error",
              title: "Erreur",
              text: err.response?.data?.message || "Erreur lors de l'annulation.",
              confirmButtonColor: "#ef4444",
            });
          },
        });
      }
    });
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-gray-955 min-h-screen text-slate-800 dark:text-gray-205">
      {/* En-tête principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-emerald-600" /> Versements en Attente
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Validation des transferts de fonds et des dépôts bancaires physiques
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
            Veuillez choisir une succursale dans la liste déroulante ci-dessus pour afficher ses versements en attente.
          </p>
        </div>
      ) : (
        <div>
          {loadingPending ? (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-sm">
                <TableSkeleton />
              </table>
            </div>
          ) : pendingTxList.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-12 text-center">
              <Inbox className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-semibold text-slate-500">Aucun versement en attente à confirmer.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-gray-900/60 border-b border-slate-200 dark:border-gray-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                      <th className="p-4">Date</th>
                      <th className="p-4">Initiateur (Caissier)</th>
                      <th className="p-4">Provenance</th>
                      <th className="p-4">Destination</th>
                      <th className="p-4 text-right">Montant</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                    {pendingTxList.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-855/20 transition-colors">
                        <td className="p-4 font-medium">
                          {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="p-4 font-semibold text-slate-900 dark:text-white">
                          {tx.user ? `${tx.user.first_name} ${tx.user.last_name || ""}` : "Système"}
                        </td>
                        <td className="p-4">
                          {tx.session?.register?.name ? (
                            <span className="font-mono text-xs bg-slate-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                              Caisse: {tx.session.register.name}
                            </span>
                          ) : tx.source_account?.name ? (
                            <span className="text-slate-650 dark:text-slate-300 font-semibold">{tx.source_account.name}</span>
                          ) : (
                            "Inconnu"
                          )}
                        </td>
                        <td className="p-4 font-semibold text-slate-700 dark:text-slate-250">
                          {tx.destination_account?.name || "Non affecté"}
                        </td>
                        <td className="p-4 text-right font-bold font-mono text-slate-950 dark:text-white text-base">
                          {tx.amount.toLocaleString()} <span className="text-xs text-slate-500">XAF</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setShowConfirmModal(tx);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Confirmer
                            </button>
                            <button
                              onClick={() => handleCancelVerification(tx)}
                              className="px-3 py-1.5 border border-red-300 dark:border-rose-900/40 text-red-600 hover:bg-red-50 dark:hover:bg-rose-955/20 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Rejeter
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modale ConfirmDepositModal isolée */}
          <ConfirmDepositModal
            isOpen={showConfirmModal !== null}
            onClose={() => setShowConfirmModal(null)}
            transaction={showConfirmModal}
            onSuccess={() => refetchTransactions()}
          />
        </div>
      )}
    </div>
  );
}
