import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  Plus,
  Trash2,
  Edit2,
  Building,
  DollarSign,
  Loader2,
  Inbox,
  X,
} from "lucide-react";
import { useBranches } from "../../../../hooks/pharmacy/useBranche";
import {
  usePaymentAccounts,
  useCreatePaymentAccount,
  useUpdatePaymentAccount,
  useDeletePaymentAccount,
} from "../../../../hooks/pharmacy/usePaymentAccount";
import { type PaymentAccountDto } from "../../../../services/pharmacy/paymentAccountService";

export default function AdminAccounts() {
  // --- ÉTATS ---
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(
    undefined,
  );

  // Modale
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] =
    useState<PaymentAccountDto | null>(null);

  // Formulaire Comptes
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<
    "bank" | "mobile_money" | "safe" | "cash_register" | "owner"
  >("bank");
  const [accountNumber, setAccountNumber] = useState("");
  const [initialBalance, setInitialBalance] = useState("0");
  const [accountStatus, setAccountStatus] = useState<"active" | "inactive">(
    "active",
  );

  // --- HOOKS ---
  const { data: branches = [] } = useBranches();

  // Comptes
  const { data: accounts = [], isLoading: loadingAccounts } =
    usePaymentAccounts({
      pharmacy_branch_id: selectedBranchId,
    });
  const createAccountMutation = useCreatePaymentAccount();
  const updateAccountMutation = useUpdatePaymentAccount();
  const deleteAccountMutation = useDeletePaymentAccount();

  // Gérer ouverture modale compte
  const openAccountModal = (account: PaymentAccountDto | null = null) => {
    if (account) {
      setEditingAccount(account);
      setAccountName(account.name);
      setAccountType(account.type);
      setAccountNumber(account.account_number || "");
      setInitialBalance(account.balance.toString());
      setAccountStatus(account.status);
    } else {
      setEditingAccount(null);
      setAccountName("");
      setAccountType("bank");
      setAccountNumber("");
      setInitialBalance("0");
      setAccountStatus("active");
    }
    setShowAccountModal(true);
  };

  // Enregistrer compte
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) {
      Swal.fire({
        icon: "warning",
        title: "Sélectionnez une succursale",
        text: "Veuillez choisir une succursale avant de créer un compte.",
        confirmButtonColor: "#10b981",
      });
      return;
    }

    const payload = {
      name: accountName,
      type: accountType,
      pharmacy_branch_id: selectedBranchId,
      account_number: accountNumber || null,
      balance: parseFloat(initialBalance) || 0,
      status: accountStatus,
    };

    if (editingAccount) {
      updateAccountMutation.mutate(
        { id: editingAccount.id, payload },
        {
          onSuccess: () => {
            Swal.fire({
              icon: "success",
              title: "Compte modifié",
              text: "Le compte de trésorerie a été mis à jour.",
              confirmButtonColor: "#10b981",
            });
            setShowAccountModal(false);
          },
          onError: (err: any) => {
            Swal.fire({
              icon: "error",
              title: "Erreur",
              text:
                err.response?.data?.message ||
                "Impossible de modifier le compte.",
              confirmButtonColor: "#ef4444",
            });
          },
        },
      );
    } else {
      createAccountMutation.mutate(payload, {
        onSuccess: () => {
          Swal.fire({
            icon: "success",
            title: "Compte créé",
            text: "Le compte de trésorerie a été enregistré avec succès.",
            confirmButtonColor: "#10b981",
          });
          setShowAccountModal(false);
        },
        onError: (err: any) => {
          Swal.fire({
            icon: "error",
            title: "Erreur",
            text:
              err.response?.data?.message || "Impossible de créer le compte.",
            confirmButtonColor: "#ef4444",
          });
        },
      });
    }
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

  const selectedBranchName = React.useMemo(() => {
    const b = branches.find((branch) => branch.id === selectedBranchId);
    return b ? b.name : "";
  }, [branches, selectedBranchId]);

  const groupedAccounts = React.useMemo(() => {
    const groups: { [key: string]: { title: string; items: PaymentAccountDto[] } } = {
      safe: { title: "Coffres-forts", items: [] },
      bank: { title: "Comptes bancaires", items: [] },
      mobile_money: { title: "Comptes Mobile Money", items: [] },
      cash_register: { title: "Comptes Caisses", items: [] },
      owner: { title: "Comptes Propriétaire / Capital", items: [] },
    };

    accounts.forEach((acc) => {
      if (groups[acc.type]) {
        groups[acc.type].items.push(acc);
      } else {
        if (!groups["other"]) {
          groups["other"] = { title: "Autres comptes", items: [] };
        }
        groups["other"].items.push(acc);
      }
    });

    return Object.entries(groups).filter(([_, group]) => group.items.length > 0);
  }, [accounts]);

  return (
    <div className="p-6 bg-slate-50 dark:bg-gray-950 min-h-screen text-slate-800 dark:text-gray-200">
      {/* En-tête principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-emerald-600" /> Comptes Financiers {selectedBranchName && ` - ${selectedBranchName}`}
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Gestion des banques, coffres-forts et comptes Mobile Money par
            succursale
          </p>
        </div>

        {/* Sélection Succursale */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-xl shadow-xs border border-slate-200 dark:border-gray-700">
          <Building className="w-4 h-4 text-slate-400" />
          <select
            value={selectedBranchId || ""}
            onChange={(e) =>
              setSelectedBranchId(
                e.target.value ? parseInt(e.target.value) : undefined,
              )
            }
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
          <h3 className="text-lg font-bold text-slate-700 dark:text-gray-300">
            Aucune succursale sélectionnée
          </h3>
          <p className="text-sm text-slate-500 dark:text-gray-455 mt-1 max-w-md mx-auto">
            Veuillez choisir une succursale dans la liste déroulante ci-dessus
            pour afficher et gérer ses comptes de trésorerie.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Comptes enregistrés
            </h2>
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
                <div
                  key={i}
                  className="h-32 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-8 text-center">
              <Inbox className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-semibold text-slate-500">
                Aucun compte financier créé pour cette succursale.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedAccounts.map(([typeKey, group]) => (
                <div key={typeKey} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-wider">
                      {group.title} ({group.items.length})
                    </h3>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-gray-850" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.items.map((account) => {
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
                                    ? "bg-blue-105 text-blue-800 dark:bg-blue-955/20 dark:text-blue-400"
                                    : isMomo
                                      ? "bg-amber-105 text-amber-800 dark:bg-amber-955/20 dark:text-amber-400"
                                      : isSafe
                                        ? "bg-purple-105 text-purple-800 dark:bg-purple-955/20 dark:text-purple-400"
                                        : "bg-slate-105 text-slate-800 dark:bg-gray-800 dark:text-gray-300"
                                }`}
                              >
                                {account.type === "mobile_money" ? "Momo / OM" : account.type === "bank" ? "Banque" : account.type === "safe" ? "Coffre-fort" : account.type === "cash_register" ? "Caisse" : account.type}
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
                              {account.balance.toLocaleString()}{" "}
                              <span className="text-xs font-bold text-slate-500">
                                XAF
                              </span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ============================================================ */}
          {/* MODALE: COMPTE DE TRÉSORERIE (AJOUT/MODIFICATION) */}
          {/* ============================================================ */}
          {showAccountModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/60">
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {editingAccount
                      ? "Modifier le compte"
                      : "Ajouter un compte financier"}
                  </h3>
                  <button
                    onClick={() => setShowAccountModal(false)}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-gray-855 rounded-lg text-slate-400 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveAccount} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                      Type de compte
                    </label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-350 dark:border-gray-800 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-semibold"
                    >
                      <option value="bank">Banque (Afriland, SG...)</option>
                      <option value="mobile_money">
                        Mobile Money (MTN MoMo, OM)
                      </option>
                      <option value="safe">Coffre-fort Interne</option>
                      <option value="owner">
                        Compte Propriétaire / Administrateur
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                      Nom du compte
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nom (ex: Afriland First Bank, Caisse Principale...)"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-350 dark:border-gray-800 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                      Numéro de compte / Téléphone
                    </label>
                    <input
                      type="text"
                      placeholder="N° de compte ou n° de téléphone MoMo (facultatif)"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-350 dark:border-gray-800 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-mono"
                    />
                  </div>

                  {!editingAccount && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                        Solde Initial (XAF)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={initialBalance}
                        onChange={(e) => setInitialBalance(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-350 dark:border-gray-800 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white font-mono font-bold"
                      />
                    </div>
                  )}

                  {editingAccount && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                        Statut
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="accountStatus"
                            checked={accountStatus === "active"}
                            onChange={() => setAccountStatus("active")}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm font-semibold">Actif</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="accountStatus"
                            checked={accountStatus === "inactive"}
                            onChange={() => setAccountStatus("inactive")}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm font-semibold text-slate-500">
                            Inactif
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 dark:border-gray-800 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAccountModal(false)}
                      className="px-4 py-2 border border-slate-300 dark:border-gray-700 hover:bg-slate-150 dark:hover:bg-gray-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={
                        createAccountMutation.isPending ||
                        updateAccountMutation.isPending
                      }
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {(createAccountMutation.isPending ||
                        updateAccountMutation.isPending) && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      )}
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
