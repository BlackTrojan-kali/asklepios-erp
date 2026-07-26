import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
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
  Eye,
  Scale,
  Info,
  Coins,
  Landmark,
  Smartphone,
  Wallet,
  Building2,
  LayoutGrid,
  Table,
  Search,
} from "lucide-react";
import { useBranches } from "../../../../hooks/pharmacy/useBranche";
import {
  usePaymentAccounts,
  useDeletePaymentAccount,
} from "../../../../hooks/pharmacy/usePaymentAccount";
import { type PaymentAccountDto } from "../../../../services/pharmacy/paymentAccountService";
import PaymentAccountTransactionsModal from "../../../../components/modals/Pharmacy/Admin/PaymentAccountTransactionsModal";
import CreateOrUpdateAccountModal from "../../../../components/modals/Pharmacy/Admin/CreateOrUpdateAccountModal";

// Helper pour normaliser les chaînes (insensible à la casse et aux accents : é = e = E)
const normalizeStr = (str: string = "") =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function AdminAccounts() {
  // --- ÉTATS ---
  // Par défaut, undefined = "Toutes les succursales" pour un affichage immédiat en 0 clic !
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(
    undefined,
  );

  // Recherche textuelle (filtre par nom de compte, pharmacie, coffre-fort...)
  const [searchQuery, setSearchQuery] = useState("");

  // Mode de vue : Cartes vs Tableau persistant dans le LocalStorage
  const [viewMode, setViewMode] = useState<"cards" | "table">(() => {
    const saved = localStorage.getItem("admin_accounts_view_mode");
    return saved === "cards" || saved === "table" ? saved : "cards";
  });

  const handleViewModeChange = (mode: "cards" | "table") => {
    setViewMode(mode);
    localStorage.setItem("admin_accounts_view_mode", mode);
  };

  // Modales
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] =
    useState<PaymentAccountDto | null>(null);
  const [showTxHistoryModal, setShowTxHistoryModal] =
    useState<PaymentAccountDto | null>(null);

  // --- HOOKS ---
  const { data: branches = [] } = useBranches();

  // Tous les comptes (on charge tout et on filtre 100% côté front pour réactivité 0ms)
  const { data: accounts = [], isLoading: loadingAccounts } =
    usePaymentAccounts({
      pharmacy_branch_id: undefined,
    });

  const deleteAccountMutation = useDeletePaymentAccount();

  // --- STYLES REACT-SELECT AVEC SUPPORT DARK MODE ---
  const selectStyles = useMemo(() => {
    const isDark =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark");
    return {
      control: (base: any, state: any) => ({
        ...base,
        backgroundColor: isDark ? "#0b0f17" : "#f8fafc",
        borderColor: state.isFocused
          ? "#10b981"
          : isDark
            ? "#1f2937"
            : "#e2e8f0",
        color: isDark ? "#f9fafb" : "#1e293b",
        borderRadius: "0.75rem",
        padding: "1px 4px",
        boxShadow: "none",
        fontSize: "0.875rem",
        fontWeight: "600",
        cursor: "pointer",
        "&:hover": {
          borderColor: "#10b981",
        },
      }),
      singleValue: (base: any) => ({
        ...base,
        color: isDark ? "#f3f4f6" : "#1e293b",
      }),
      menu: (base: any) => ({
        ...base,
        backgroundColor: isDark ? "#111827" : "#ffffff",
        borderColor: isDark ? "#1f2937" : "#e2e8f0",
        borderRadius: "0.75rem",
        overflow: "hidden",
        zIndex: 50,
      }),
      option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected
          ? "#10b981"
          : state.isFocused
            ? isDark
              ? "#1f2937"
              : "#f1f5f9"
            : "transparent",
        color: state.isSelected ? "#ffffff" : isDark ? "#f3f4f6" : "#1e293b",
        fontSize: "0.875rem",
        cursor: "pointer",
      }),
    };
  }, []);

  // Options pour React Select Succursale
  const branchOptions = useMemo(() => {
    const options = [
      {
        value: undefined,
        label: `🌐 Toutes les succursales (${accounts.length})`,
      },
    ];

    branches.forEach((b) => {
      const count = accounts.filter(
        (a) => a.pharmacy_branch_id === b.id,
      ).length;
      options.push({
        value: b.id as any,
        label: `📍 ${b.name} (${count})`,
      });
    });

    return options;
  }, [branches, accounts]);

  // --- FILTRAGE DES COMPTES EN FRONTEND (RÉACTIVITÉ INSTANTANÉE 0ms) ---
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      // Filtre Succursale
      if (
        selectedBranchId !== undefined &&
        account.pharmacy_branch_id !== selectedBranchId
      ) {
        return false;
      }

      // Filtre Recherche textuelle (nom du compte, nom de succursale, n° compte, coffre...)
      if (searchQuery.trim()) {
        const queryNorm = normalizeStr(searchQuery);
        const nameNorm = normalizeStr(account.name);
        const branchNorm = normalizeStr(account.branch?.name || "");
        const numberNorm = normalizeStr(account.account_number || "");
        const typeNorm = normalizeStr(
          account.type === "mobile_money"
            ? "mobile money momo om orange mtn"
            : account.type === "bank"
              ? "banque bank"
              : account.type === "safe"
                ? "coffre fort coffre-fort"
                : account.type === "cash_register"
                  ? "caisse"
                  : account.type,
        );

        return (
          nameNorm.includes(queryNorm) ||
          branchNorm.includes(queryNorm) ||
          numberNorm.includes(queryNorm) ||
          typeNorm.includes(queryNorm)
        );
      }

      return true;
    });
  }, [accounts, selectedBranchId, searchQuery]);

  // --- STATISTIQUES GLOBALES EN HAUT DE PAGE (SUR LES COMPTES FILTRÉS OU GLOBAUX) ---
  const kpiStats = useMemo(() => {
    let totalTheoretical = 0;
    let bankTotal = 0;
    let bankCount = 0;
    let momoTotal = 0;
    let momoCount = 0;
    let cashSafeTotal = 0;
    let cashSafeCount = 0;

    filteredAccounts.forEach((acc) => {
      const bal = Number(acc.balance) || 0;
      totalTheoretical += bal;
      if (acc.type === "bank") {
        bankTotal += bal;
        bankCount++;
      } else if (acc.type === "mobile_money") {
        momoTotal += bal;
        momoCount++;
      } else {
        cashSafeTotal += bal;
        cashSafeCount++;
      }
    });

    return {
      totalTheoretical,
      bankTotal,
      bankCount,
      momoTotal,
      momoCount,
      cashSafeTotal,
      cashSafeCount,
    };
  }, [filteredAccounts]);

  // Groupement pour la vue en cartes
  const groupedAccounts = useMemo(() => {
    const groups: {
      [key: string]: { title: string; items: PaymentAccountDto[] };
    } = {
      safe: { title: "Coffres-forts & Caisses", items: [] },
      bank: { title: "Comptes bancaires", items: [] },
      mobile_money: { title: "Comptes Mobile Money", items: [] },
      cash_register: { title: "Comptes Caisses enregistreuses", items: [] },
      owner: { title: "Comptes Propriétaire / Capital", items: [] },
    };

    filteredAccounts.forEach((acc) => {
      if (groups[acc.type]) {
        groups[acc.type].items.push(acc);
      } else {
        if (!groups["other"]) {
          groups["other"] = { title: "Autres comptes", items: [] };
        }
        groups["other"].items.push(acc);
      }
    });

    return Object.entries(groups).filter(
      ([_, group]) => group.items.length > 0,
    );
  }, [filteredAccounts]);

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

  const handleReconciliationNotice = (accountName?: string) => {
    Swal.fire({
      icon: "info",
      title: "Rapprochement Bancaire",
      text: accountName
        ? `Le module de rapprochement pour "${accountName}" vous permettra d'ajuster le solde théorique de l'ERP avec votre extrait de compte réel.`
        : "Le module de rapprochement vous permettra d'aligner le solde théorique de l'ERP avec vos relevés bancaires ou Mobile Money réels.",
      confirmButtonColor: "#10b981",
      confirmButtonText: "Compris",
    });
  };

  const selectedBranchName = useMemo(() => {
    if (!selectedBranchId) return "Toutes les succursales";
    const b = branches.find((branch) => branch.id === selectedBranchId);
    return b ? b.name : "Toutes les succursales";
  }, [branches, selectedBranchId]);

  return (
    <div className="p-3 bg-slate-50 dark:bg-gray-950 min-h-screen text-slate-800 dark:text-gray-200">
      {/* EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-emerald-600" /> Comptes &
            Trésorerie
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400">
            Vue synthétique et gestion des banques, coffres et Mobile Money (
            {selectedBranchName})
          </p>
        </div>

        {/* Boutons d'actions globales */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleReconciliationNotice()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700 dark:border-gray-700 shadow-xs"
          >
            <Scale className="w-4 h-4 text-emerald-400" /> Rapprochement
            Bancaire
          </button>

          <button
            type="button"
            onClick={() => openAccountModal()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Ajouter un compte
          </button>
        </div>
      </div>

      {/* --- CARTES DE SYNTHÈSE FINANCIÈRE (DASHBOARD KPIs) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 1. Trésorerie Théorique Globale */}
        <div
          className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-5 rounded-2xl shadow-xs relative overflow-hidden group cursor-help transition-all hover:border-emerald-500/50"
          title="Trésorerie Théorique Globale : Somme cumulée des avoirs théoriques calculés par l'ERP sur l'ensemble des comptes (banques, mobile money, coffres) de l'établissement ou de la succursale sélectionnée."
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 flex items-center gap-1">
              Trésorerie Théorique{" "}
              <Info className="w-3.5 h-3.5 text-emerald-500" />
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {kpiStats.totalTheoretical.toLocaleString("fr-FR")}{" "}
            <span className="text-xs font-bold text-slate-400">FCFA</span>
          </h3>
          <p className="text-xs text-slate-400 dark:text-gray-500 mt-1 flex items-center gap-1">
            <Info className="w-3 h-3 inline text-emerald-500" /> Solde cumulé (
            {filteredAccounts.length} compte(s) affiché(s))
          </p>
        </div>

        {/* 2. Total Banques */}
        <div
          className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-5 rounded-2xl shadow-xs relative overflow-hidden group cursor-help transition-all hover:border-blue-500/50"
          title="Comptes Bancaires : Total des liquidités théoriques réparties sur les comptes bancaires (ex: Afriland First Bank, SGBC, etc.)."
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 flex items-center gap-1">
              Comptes Bancaires <Info className="w-3.5 h-3.5 text-blue-500" />
            </span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black font-mono text-slate-800 dark:text-white">
            {kpiStats.bankTotal.toLocaleString("fr-FR")}{" "}
            <span className="text-xs font-bold text-slate-400">FCFA</span>
          </h3>
          <p className="text-xs text-slate-400 dark:text-gray-500 mt-1 flex items-center gap-1">
            <Info className="w-3 h-3 inline text-blue-500" />{" "}
            {kpiStats.bankCount} compte(s) bancaire(s)
          </p>
        </div>

        {/* 3. Mobile Money */}
        <div
          className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-5 rounded-2xl shadow-xs relative overflow-hidden group cursor-help transition-all hover:border-amber-500/50"
          title="Mobile Money : Cumul des fonds théoriques disponibles sur les comptes marchands et puces de paiement Mobile Money (MTN MoMo, Orange Money)."
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 flex items-center gap-1">
              Mobile Money (MoMo / OM){" "}
              <Info className="w-3.5 h-3.5 text-amber-500" />
            </span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black font-mono text-slate-800 dark:text-white">
            {kpiStats.momoTotal.toLocaleString("fr-FR")}{" "}
            <span className="text-xs font-bold text-slate-400">FCFA</span>
          </h3>
          <p className="text-xs text-slate-400 dark:text-gray-500 mt-1 flex items-center gap-1">
            <Info className="w-3 h-3 inline text-amber-500" />{" "}
            {kpiStats.momoCount} compte(s) Mobile Money
          </p>
        </div>

        {/* 4. Coffres & Caisses */}
        <div
          className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-5 rounded-2xl shadow-xs relative overflow-hidden group cursor-help transition-all hover:border-purple-500/50"
          title="Coffres-Forts & Caisses : Total des espèces théoriques stockées physiquement dans les coffres-forts internes et caisses enregistreuses."
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 flex items-center gap-1">
              Coffres-Forts & Caisses{" "}
              <Info className="w-3.5 h-3.5 text-purple-500" />
            </span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black font-mono text-slate-800 dark:text-white">
            {kpiStats.cashSafeTotal.toLocaleString("fr-FR")}{" "}
            <span className="text-xs font-bold text-slate-400">FCFA</span>
          </h3>
          <p className="text-xs text-slate-400 dark:text-gray-500 mt-1 flex items-center gap-1">
            <Info className="w-3 h-3 inline text-purple-500" />{" "}
            {kpiStats.cashSafeCount} coffre(s) / caisse(s)
          </p>
        </div>
      </div>

      {/* --- BARRE DE FILTRAGE PAR RECHERCHE TEXTUELLE & REACT-SELECT SUCCURSALE --- */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-xs mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Input de recherche textuelle (Insensible à la casse et aux accents) */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrer par nom de compte, pharmacie, coffre-fort..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtrage par Succursale avec React Select */}
        <div className="w-full md:w-72 shrink-0">
          <Select
            options={branchOptions}
            value={
              branchOptions.find((opt) => opt.value === selectedBranchId) ||
              branchOptions[0]
            }
            onChange={(opt: any) =>
              setSelectedBranchId(opt ? opt.value : undefined)
            }
            styles={selectStyles}
            placeholder="Sélectionnez une succursale..."
            isSearchable
          />
        </div>

        {/* Boutons commutateurs de vue Cartes / Tableau avec stockage LocalStorage */}
        <div className="flex items-center bg-slate-100 dark:bg-gray-950 p-1 rounded-xl shrink-0 self-end md:self-auto border border-slate-200 dark:border-gray-800 shadow-xs">
          <button
            type="button"
            onClick={() => handleViewModeChange("cards")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              viewMode === "cards"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white"
            }`}
            title="Affichage sous forme de cartes"
          >
            <LayoutGrid size={15} /> <span>Cartes</span>
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange("table")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              viewMode === "table"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white"
            }`}
            title="Affichage sous forme de tableau"
          >
            <Table size={15} /> <span>Tableau</span>
          </button>
        </div>
      </div>

      {/* --- CONTENU DE LA LISTE DES COMPTES --- */}
      {loadingAccounts ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-12 text-center shadow-xs">
          <Inbox className="w-12 h-12 stroke-1 mx-auto mb-3 text-slate-400" />
          <h3 className="text-base font-bold text-slate-700 dark:text-gray-300">
            Aucun compte financier trouvé
          </h3>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
            {searchQuery
              ? `Aucun compte ne correspond à "${searchQuery}".`
              : selectedBranchId
                ? "Aucun compte n'a été créé pour cette succursale."
                : "Aucun compte de trésorerie n'a encore été créé dans l'établissement."}
          </p>
        </div>
      ) : viewMode === "cards" ? (
        /* VUE EN CARTES (WIDGETS FINANCIERS) */
        <div className="space-y-8">
          {groupedAccounts.map(([typeKey, group]) => (
            <div key={typeKey} className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-wider">
                  {group.title} ({group.items.length})
                </h3>
                <div className="flex-1 h-px bg-slate-200 dark:bg-gray-800" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.items.map((account) => {
                  const isMomo = account.type === "mobile_money";
                  const isBank = account.type === "bank";
                  const isSafe = account.type === "safe";

                  return (
                    <div
                      key={account.id}
                      className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs relative flex flex-col justify-between hover:shadow-md transition-shadow group"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider rounded-md ${
                                isBank
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400"
                                  : isMomo
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                                    : isSafe
                                      ? "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400"
                                      : "bg-slate-100 text-slate-800 dark:bg-gray-800 dark:text-gray-300"
                              }`}
                            >
                              {account.type === "mobile_money"
                                ? "Momo / OM"
                                : account.type === "bank"
                                  ? "Banque"
                                  : account.type === "safe"
                                    ? "Coffre-fort"
                                    : account.type === "cash_register"
                                      ? "Caisse"
                                      : account.type}
                            </span>

                            {/* Badge Succursale (très utile en vue globale) */}
                            {account.branch && (
                              <span className="text-[10px] px-2 py-0.5 font-semibold bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 rounded-md border border-slate-200/60 dark:border-gray-700">
                                📍 {account.branch.name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openAccountModal(account)}
                              className="p-1 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                              title="Modifier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAccount(account.id)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                              title="Supprimer"
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
                        <span
                          className="text-xs text-slate-400 flex items-center gap-1 cursor-help"
                          title="Solde théorique calculé d'après les mouvements enregistrés dans l'ERP"
                        >
                          Solde Théorique{" "}
                          <Info className="w-3 h-3 text-slate-400" />
                        </span>
                        <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                          {account.balance.toLocaleString("fr-FR")}{" "}
                          <span className="text-xs font-bold text-slate-500">
                            XAF
                          </span>
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        <button
                          type="button"
                          onClick={() => setShowTxHistoryModal(account)}
                          className="w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-gray-800/40 dark:hover:bg-gray-800 border border-slate-150 dark:border-gray-800 text-slate-700 dark:text-gray-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />{" "}
                          Voir l'historique des flux
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleReconciliationNotice(account.name)
                          }
                          className="w-full py-2 bg-emerald-50/60 hover:bg-emerald-100/80 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Scale className="w-4 h-4" /> Rapprochement Bancaire
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VUE EN TABLEAU HAUTE DENSITÉ */
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-800/60 border-b border-slate-200 dark:border-gray-800 text-[11px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">
                  <th className="p-4">Compte</th>
                  <th className="p-4">Succursale</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">N° / Téléphone</th>
                  <th className="p-4 text-right">Solde Théorique</th>
                  <th className="p-4 text-center">Statut</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                {filteredAccounts.map((account) => {
                  const isMomo = account.type === "mobile_money";
                  const isBank = account.type === "bank";
                  const isSafe = account.type === "safe";

                  return (
                    <tr
                      key={account.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        {account.name}
                      </td>
                      <td className="p-4 text-xs text-slate-600 dark:text-gray-300">
                        {account.branch ? `📍 ${account.branch.name}` : "-"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] px-2.5 py-1 font-bold uppercase tracking-wider rounded-md ${
                            isBank
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400"
                              : isMomo
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                                : isSafe
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400"
                                  : "bg-slate-100 text-slate-800 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {account.type === "mobile_money"
                            ? "Momo / OM"
                            : account.type === "bank"
                              ? "Banque"
                              : account.type === "safe"
                                ? "Coffre-fort"
                                : account.type === "cash_register"
                                  ? "Caisse"
                                  : account.type}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-600 dark:text-gray-400">
                        {account.account_number || "-"}
                      </td>
                      <td className="p-4 text-right font-mono font-black text-slate-900 dark:text-white text-base">
                        {account.balance.toLocaleString("fr-FR")}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          FCFA
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            account.status === "active"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {account.status === "active" ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setShowTxHistoryModal(account)}
                            className="p-1.5 text-slate-600 dark:text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Historique des flux"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleReconciliationNotice(account.name)
                            }
                            className="p-1.5 text-slate-600 dark:text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Rapprochement Bancaire"
                          >
                            <Scale className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openAccountModal(account)}
                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAccount(account.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* MODALE AUTONOME : COMPTE DE TRÉSORERIE (AJOUT/MODIFICATION) */}
      <CreateOrUpdateAccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        editingAccount={editingAccount}
        selectedBranchId={selectedBranchId}
        onSuccess={() => {}}
      />

      {showTxHistoryModal && (
        <PaymentAccountTransactionsModal
          isOpen={!!showTxHistoryModal}
          onClose={() => setShowTxHistoryModal(null)}
          account={showTxHistoryModal}
        />
      )}
    </div>
  );
}
