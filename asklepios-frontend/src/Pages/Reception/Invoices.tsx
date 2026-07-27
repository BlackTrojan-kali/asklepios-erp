import React, { useEffect, useState } from "react";
import {
  Receipt,
  Printer,
  Eye,
  Trash2,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Wallet,
  Building2,
  FileDown,
  Search,
  Stethoscope,
  User,
} from "lucide-react";
import Swal from "sweetalert2";
import Select from "react-select";

// --- STORES & CONTEXT ---
import useInvoiceStore from "../../functions/base_hospital/useInvoiceStore";
import useCenterStore from "../../functions/center/useCenterStore";
import { useAuth } from "../../contexts/AuthContext";

// --- TYPES ---
import type { InvoiceDto } from "../../types/InvoiceTypes";

// --- MODALES ---
import { InvoicePreviewModal } from "../../components/modals/Base_hopital/hospital/InvoicePreviewModal";
import { GenerateInvoiceModal } from "../../components/modals/Base_hopital/facturation/GenerateInvoiceModal";
import { CreatePaymentModal } from "../../components/modals/Base_hopital/Finance/CreatePaymentModal";
import { ExportInvoicesModal } from "../../components/modals/Base_hopital/Finance/ExportInvoicesModal";
import { LabExamInvoiceModal } from "../../components/modals/Base_hopital/facturation/LabExamInvoiceModal";
import { Button } from "../../components/common/Button";
import { Beaker } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

const Invoices = () => {
  // --- STORES & AUTH ---
  const { profile } = useAuth();
  const { getCenters, centers } = useCenterStore();
  const {
    invoices,
    loading,
    pagination,
    getInvoices,
    cancelInvoice,
    downloadInvoicePdf,
    actionLoading,
  } = useInvoiceStore();

  // --- ÉTATS (Filtres & Pagination) ---
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [statusFilter, setStatusFilter] = useState<string>(""); // '', 'PAID', 'UNPAID'
  const [typeFilter, setTypeFilter] = useState<string>(""); // '', 'CONSULTATION', 'LABORATORY'
  const [selectedCenter, setSelectedCenter] = useState<SelectOption | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  // --- ÉTATS DES MODALES ---
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(
    null,
  );
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
    useState<InvoiceDto | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isLabExamModalOpen, setIsLabExamModalOpen] = useState(false);

  // --- CHARGEMENT DES CENTRES (Si Admin) ---
  useEffect(() => {
    if (profile?.role === "admin" || profile?.role === "super_admin") {
      getCenters(1, {}, 100);
    }
  }, [profile, getCenters]);

  // --- CHARGEMENT DES FACTURES ---
  const fetchInvoices = () => {
    getInvoices(
      page,
      {
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        center_id: selectedCenter?.value
          ? Number(selectedCenter.value)
          : undefined,
        patient_code: searchQuery || undefined,
      },
      perPage,
    );
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, statusFilter, typeFilter, selectedCenter]);

  const handleRefresh = () => {
    fetchInvoices();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    getInvoices(
      1,
      {
        status: statusFilter || undefined,
        center_id: selectedCenter?.value
          ? Number(selectedCenter.value)
          : undefined,
        patient_code: searchQuery || undefined,
      },
      perPage,
    );
  };

  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    getInvoices(
      1,
      {
        status: statusFilter || undefined,
        center_id: selectedCenter?.value
          ? Number(selectedCenter.value)
          : undefined,
        patient_code: undefined,
      },
      perPage,
    );
  };

  const handleFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
  };

  const handleTypeFilterChange = (newType: string) => {
    setTypeFilter(newType);
    setPage(1);
  };

  const handleOpenPayment = (invoice: InvoiceDto) => {
    setSelectedInvoiceForPayment(invoice);
    setIsPaymentOpen(true);
  };

  const getBilledBy = (inv: InvoiceDto) => {
    const doctor =
      (inv as any).consultations?.[0]?.profile_doctor?.user ||
      (inv as any).lab_requests?.[0]?.profile_doctor?.user;
    if (doctor) {
      return `Dr. ${doctor.first_name} ${doctor.last_name || ""}`;
    }
    const extPrescriber = (inv as any).lab_requests?.[0]
      ?.external_prescriber_name;
    if (extPrescriber) {
      return extPrescriber;
    }
    const caissier = (inv as any).payments?.[0]?.reception?.user;
    if (caissier) {
      return `${caissier.first_name} ${caissier.last_name || ""}`;
    }
    return "Réception / Caisse";
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Annuler cette facture ?",
      text: `Cette facture sera supprimée et les soins médicaux associés seront remis en attente de facturation. Cette action est irréversible.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonText: "Non, fermer",
      confirmButtonText: "Oui, annuler la facture",
      customClass: { popup: "rounded-2xl dark:bg-gray-800 dark:text-gray-200" },
    });

    if (result.isConfirmed) {
      await cancelInvoice(id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XAF",
    })
      .format(amount)
      .replace("XAF", "FCFA");
  };

  const centerOptions: SelectOption[] = centers.map((center) => ({
    value: center.id.toString(),
    label: center.name,
  }));

  return (
    <div className="space-y-6">
      {/* --- EN-TÊTE --- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg">
            <Receipt size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                Historique des Factures
              </h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Consultez, imprimez ou encaissez les factures du système.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
          >
            <RefreshCw
              size={18}
              className={loading ? "animate-spin text-[#00a896]" : ""}
            />
            Rafraîchir
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#003366] hover:bg-blue-900 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
          >
            <FileDown size={18} />
            Exporter PDF
          </button>

          <Button
            variant="secondary"
            onClick={() => setIsLabExamModalOpen(true)}
            icon={<Beaker size={18} />}
            title="Facturer et encaisser des examens de laboratoire prescrits par le médecin"
          >
            Facture Examen Labo
          </Button>

          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#00a896] hover:bg-[#008f7f] text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
          >
            <Plus size={18} />
            Nouvelle Facture
          </button>
        </div>
      </div>

      {/* --- RECHERCHE PAR CODE PATIENT --- */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher par Code Patient (ex: H1-0001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 p-2 min-h-[42px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] text-sm text-slate-800 dark:text-white transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-6 py-2 min-h-[42px] rounded-lg font-medium transition-colors text-sm shadow-sm"
            >
              Rechercher
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="px-4 py-2 min-h-[42px] bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border dark:border-gray-600 rounded-lg font-medium transition-colors text-sm"
              >
                Effacer
              </button>
            )}
          </div>
        </form>
      </div>

      {/* --- BARRE DE FILTRES --- */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          {/* Filtre Statut */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">
              <Filter size={15} /> Statut :
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
              {[
                { label: "Toutes", value: "" },
                { label: "Payées", value: "PAID" },
                { label: "Non Payées", value: "UNPAID" },
              ].map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => handleFilterChange(tab.value)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === tab.value
                      ? "bg-white dark:bg-gray-800 text-[#003366] dark:text-[#00a896] shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtre Type de Facture */}
          <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">
              Type :
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
              {[
                { label: "Tous", value: "" },
                { label: "Consult. & Actes", value: "CONSULTATION" },
                { label: "Examens Labo", value: "LABORATORY" },
              ].map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => {
                    setTypeFilter(tab.value);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                    typeFilter === tab.value
                      ? "bg-white dark:bg-gray-800 text-[#00a896] shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filtre Centre (Admin uniquement) */}
        {(profile?.role === "admin" || profile?.role === "super_admin") && (
          <div className="w-full xl:w-1/3 flex items-center gap-2 border-t xl:border-t-0 xl:border-l border-gray-200 dark:border-gray-700 pt-3 xl:pt-0 xl:pl-4">
            <Building2 size={18} className="text-gray-400 shrink-0" />
            <div className="flex-1">
              <Select
                options={centerOptions}
                value={selectedCenter}
                onChange={(option) => {
                  setSelectedCenter(option);
                  setPage(1);
                }}
                isClearable
                placeholder="Tous les centres..."
                className="react-select-container text-sm"
                classNamePrefix="react-select"
                noOptionsMessage={() => "Aucun centre trouvé"}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "38px",
                    borderRadius: "0.5rem",
                    borderColor: "inherit",
                    boxShadow: "none",
                    "&:hover": { borderColor: "#00a896" },
                  }),
                  menu: (base) => ({ ...base, zIndex: 50 }),
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* --- TABLEAU DES FACTURES --- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  N° Facture
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date d'émission
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Patient
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Émis / Facturé par
                </th>
                {/* 👉 MODIFICATION : Focus sur la part patient */}
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  Montant (Patient)
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  Reste à Payer (Patient)
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
                  Statut
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <Loader2
                      size={32}
                      className="animate-spin text-[#00a896] mx-auto mb-2"
                    />
                    <p className="text-gray-500">
                      Chargement des données financières...
                    </p>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <Receipt
                      size={48}
                      className="mx-auto mb-3 opacity-20 text-gray-500"
                    />
                    <p className="font-medium text-gray-500">
                      Aucune facture trouvée pour ces critères.
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  // 👉 NOUVELLE LOGIQUE DE CALCUL DE LA PART PATIENT
                  const patientPart = (inv as any).patient_part ?? inv.total_amount;
                  const patientSplit = (inv as any).splits?.find((s: any) => s.type === 'PATIENT');
                  
                  // On calcule combien le patient a déjà versé pour sa part
                  const patientPaid = (inv as any).payments?.filter((p: any) => 
                    (patientSplit && p.invoice_split_id === patientSplit.id) || !p.invoice_split_id
                  ).reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
                  
                  const patientRemaining = Math.max(0, patientPart - patientPaid);
                  
                  // Est-ce que le patient a payé sa part ? 
                  // (Même si l'assurance n'a pas encore payé le reste)
                  const isPatientPaid = inv.status === 'PAID' || patientRemaining === 0;

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="p-4 font-mono font-bold text-[#003366] dark:text-blue-400">
                        INV-{String(inv.id).padStart(5, "0")}
                      </td>

                      <td className="p-4">
                        {(inv as any).type === "LABORATORY" ||
                        (inv as any).lab_requests?.length > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap">
                            <Beaker size={13} className="text-[#00a896]" />{" "}
                            Examens Labo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap">
                            <Stethoscope size={13} className="text-blue-500" />{" "}
                            Consult. & Actes
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-gray-600 dark:text-gray-300">
                        {new Date(inv.created_at).toLocaleDateString("fr-FR")}{" "}
                        <br />
                        <span className="text-xs text-gray-400">
                          {new Date(inv.created_at).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-gray-200">
                          {inv.patient?.first_name} {inv.patient?.last_name}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                          Code: {inv.patient?.patient_code}
                        </div>
                      </td>

                      <td className="p-4 text-xs font-medium text-slate-700 dark:text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <User size={14} className="text-gray-400 shrink-0" />
                          <span>{getBilledBy(inv)}</span>
                        </div>
                      </td>

                      <td className="p-4 text-right font-mono font-bold text-slate-800 dark:text-gray-200">
                        {formatCurrency(patientPart)}
                      </td>

                      <td className="p-4 text-right font-mono font-bold text-red-500">
                        {formatCurrency(patientRemaining)}
                      </td>

                      <td className="p-4 text-center">
                        {isPatientPaid ? (
                          <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded tracking-widest uppercase">
                            Soldée
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-black px-2.5 py-1 rounded tracking-widest uppercase">
                            Non Payée
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {/* 👉 N'affiche le portefeuille que s'il reste une dette patient */}
                          {!isPatientPaid && (
                            <button
                              onClick={() => handleOpenPayment(inv)}
                              title="Encaisser un paiement"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                            >
                              <Wallet size={18} />
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedInvoiceId(inv.id)}
                            title="Voir les détails"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            onClick={() => downloadInvoicePdf(inv.id, "stream")}
                            disabled={actionLoading}
                            title="Imprimer le PDF"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Printer size={18} />
                          </button>

                          {/* Autorise la suppression si la facture (au global) n'est pas payée */}
                          {inv.status === "UNPAID" && (
                            <button
                              onClick={() => handleDelete(inv.id)}
                              title="Annuler la facture"
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION --- */}
        {pagination && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Affichage de{" "}
                <span className="font-semibold text-slate-800 dark:text-gray-200">
                  {pagination.total > 0
                    ? (pagination.currentPage - 1) * perPage + 1
                    : 0}
                </span>{" "}
                à{" "}
                <span className="font-semibold text-slate-800 dark:text-gray-200">
                  {Math.min(pagination.currentPage * perPage, pagination.total)}
                </span>{" "}
                sur{" "}
                <span className="font-semibold text-slate-800 dark:text-gray-200">
                  {pagination.total}
                </span>{" "}
                éléments
              </span>
              <div className="flex items-center gap-1.5">
                <span>Par page :</span>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 outline-none text-xs text-slate-800 dark:text-white"
                >
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(page - 1)}
                disabled={pagination.currentPage <= 1 || loading}
                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                title="Page précédente"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: pagination.lastPage }, (_, i) => i + 1)
                .filter(
                  (pNum) =>
                    pNum === 1 ||
                    pNum === pagination.lastPage ||
                    Math.abs(pNum - pagination.currentPage) <= 1,
                )
                .reduce((acc: (number | string)[], pNum, idx, arr) => {
                  if (idx > 0 && pNum - (arr[idx - 1] as number) > 1) {
                    acc.push("...");
                  }
                  acc.push(pNum);
                  return acc;
                }, [])
                .map((pNum, idx) =>
                  typeof pNum === "number" ? (
                    <button
                      key={idx}
                      onClick={() => setPage(pNum)}
                      disabled={loading}
                      className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                        pNum === pagination.currentPage
                          ? "bg-[#00a896] text-white font-bold"
                          : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800"
                      }`}
                    >
                      {pNum}
                    </button>
                  ) : (
                    <span key={idx} className="px-2 text-xs text-gray-400">
                      ...
                    </span>
                  ),
                )}

              <button
                onClick={() => setPage(page + 1)}
                disabled={
                  pagination.currentPage >= pagination.lastPage || loading
                }
                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                title="Page suivante"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODALES */}
      <InvoicePreviewModal
        isOpen={!!selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
        invoiceId={selectedInvoiceId}
      />

      <GenerateInvoiceModal
        isOpen={isGenerateModalOpen}
        onClose={() => {
          setIsGenerateModalOpen(false);
          handleRefresh();
        }}
      />

      <CreatePaymentModal
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setSelectedInvoiceForPayment(null);
          handleRefresh();
        }}
        invoice={selectedInvoiceForPayment}
      />

      <ExportInvoicesModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      <LabExamInvoiceModal
        isOpen={isLabExamModalOpen}
        onClose={() => setIsLabExamModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default Invoices;