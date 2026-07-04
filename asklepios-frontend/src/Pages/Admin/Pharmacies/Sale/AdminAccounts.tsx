import React, { useState } from "react";
import Swal from "sweetalert2";
import {
  Plus,
  Trash2,
  Edit2,
  Building,
  DollarSign,
  Inbox,
} from "lucide-react";
import { useBranches } from "../../../../hooks/pharmacy/useBranche";
import {
  usePaymentAccounts,
  useDeletePaymentAccount,
} from "../../../../hooks/pharmacy/usePaymentAccount";
import { type PaymentAccountDto } from "../../../../services/pharmacy/paymentAccountService";
import CreateOrUpdateAccountModal from "../../../../components/modals/Pharmacy/Admin/CreateOrUpdateAccountModal";

export default function AdminAccounts() {
  // --- ÉTATS ---
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
  
  // Modale
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccountDto | null>(null);

  // --- HOOKS ---
  const { data: branches = [] } = useBranches();
  
  // Comptes
  const { data: accounts = [], isLoading: loadingAccounts, refetch: refetchAccounts } = usePaymentAccounts({
    pharmacy_branch_id: selectedBranchId,
  });
  const deleteAccountMutation = useDeletePaymentAccount();

  // Gérer ouverture modale compte
  const openAccountModal = (account: PaymentAccountDto | null = null) => {
    setEditingAccount(account);
    setShowAccountModal(true);
  };

  // Supprimer compte
  const handleDeleteAccount = (id: number) => {
    Swal.fire({
      title: "Supprimer le compte ?",
      text: "Cette action est irréversible. Le compte ne sera supprimé que s'il n'a aucune transaction liée.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteAccountMutation.mutate(id, {
          onSuccess: () => {
            Swal.fire({
              icon: "success",
              title: "Compte supprimé",
              confirmButtonColor: "#10b981",
            });
            refetchAccounts();
          },
          onError: (err: any) => {
            Swal.fire({
              icon: "error",
              title: "Erreur",
              text: err.response?.data?.message || "Erreur de suppression.",
              confirmButtonColor: "#ef4444",
            });
          },
        });
      }
    });
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-gray-950 min-h-screen text-slate-800 dark:text-gray-200">
      {/* En-tête principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-emerald-600" /> Comptes Financiers
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Gestion des banques, coffres-forts et comptes Mobile Money par succursale
          </p>
        </div>

        {/* Sélection Succursale */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-xl shadow-xs border border-slate-200 dark:border-gray-700">
          <Building className="w-4 h-4 text-slate-400" />
          <select
            value={selectedBranchId || ""}
            onChange={(e) => setSelectedBranchId(e.target.value ? parseInt(e.target.value) : undefined)}
            className="bg-transparent border-none text-sm font-semibold text-slate-700 dark:text-gray-255 focus:outline-hidden"
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
            Veuillez choisir une succursale dans la liste déroulante ci-dessus pour afficher et gérer ses comptes de trésorerie.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Comptes enregistrés</h2>
            <button
              onClick={() => openAccountModal()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Ajouter un compte
            </button>
          </div>

          {loadingAccounts ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-8 text-center">
              <Inbox className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-semibold text-slate-500">Aucun compte financier créé pour cette succursale.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {accounts.map((account) => {
                const isMomo = account.type === "mobile_money";
                const isBank = account.type === "bank";
                const isSafe = account.type === "safe";

                return (
                  <div
                    key={account.id}
                    className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs relative flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider rounded-md ${
                            isBank
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400"
                              : isMomo
                                ? "bg-amber-105 text-amber-800 dark:bg-amber-955/20 dark:text-amber-400"
                                : isSafe
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-400"
                                  : "bg-slate-100 text-slate-800 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {account.type === "mobile_money" ? "Momo / OM" : account.type}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openAccountModal(account)}
                            className="p-1 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(account.id)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                        {account.name}
                      </h3>
                      {account.account_number && (
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-mono mt-0.5">
                          N° : {account.account_number}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-gray-800 flex justify-between items-center">
                      <span className="text-xs text-slate-400">Solde</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                        {account.balance.toLocaleString()} <span className="text-xs font-bold text-slate-500">XAF</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modale de création et d'édition de compte de trésorerie isolée */}
          <CreateOrUpdateAccountModal
            isOpen={showAccountModal}
            onClose={() => setShowAccountModal(false)}
            editingAccount={editingAccount}
            selectedBranchId={selectedBranchId}
            onSuccess={() => refetchAccounts()}
          />
        </div>
      )}
    </div>
  );
}
