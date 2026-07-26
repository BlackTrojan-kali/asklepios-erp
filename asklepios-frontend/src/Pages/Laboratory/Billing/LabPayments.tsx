import React, { useEffect, useState } from "react";
import {
  Wallet,
  Search,
  Edit3,
  Trash2,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileDown,
  FileSpreadsheet,
  User,
  Calendar,
  Clock,
  Filter,
} from "lucide-react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import Select from "react-select";

// --- STORES & CONTEXT ---
import usePaymentStore from "../../../functions/base_hospital/usePaymentStore";
import useCenterStore from "../../../functions/center/useCenterStore";
import { useAuth } from "../../../contexts/AuthContext";

// --- MODALES & TYPES ---
import { UpdatePaymentModal } from "../../../components/modals/Base_hopital/Finance/UpdatePaymentModal";
import { ExportPaymentsModal } from "../../../components/modals/Base_hopital/Finance/ExportPaymentsModal";
import type { PaymentInvoiceDto } from "../../../types/PaymentTypes";

interface SelectOption {
  value: string;
  label: string;
}

const LabPayments = () => {
  // --- STORES & AUTH ---
  const { profile } = useAuth();
  const { getCenters, centers } = useCenterStore();
  const {
    payments,
    loading,
    pagination,
    getPayments,
    deletePayment,
    actionLoading,
  } = usePaymentStore();

  const isAdmin = ["admin", "super_admin"].includes(profile?.role || "");

  // --- ÉTATS DES FILTRES ---
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [selectedCenter, setSelectedCenter] = useState<SelectOption | null>(null);

  // Modales
  const [selectedPayment, setSelectedPayment] = useState<PaymentInvoiceDto | null>(null);
  const [autoRefreshPage, setAutoRefreshPage] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // --- CHARGEMENT DES CENTRES ---
  useEffect(() => {
    if (isAdmin) {
      getCenters(1, {}, 100);
    }
  }, [isAdmin, getCenters]);

  // --- CHARGEMENT DES PAIEMENTS ---
  useEffect(() => {
    fetchPayments();
  }, [page, perPage, selectedCenter, filterDate, startTime, endTime, autoRefreshPage]);

  const fetchPayments = () => {
    getPayments(
      page,
      {
        center_id: selectedCenter?.value ? Number(selectedCenter.value) : undefined,
        search: searchQuery || undefined,
        date: filterDate || undefined,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
      },
      perPage
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  };

  const handleResetSearch = () => {
    setSearchQuery("");
    setFilterDate("");
    setStartTime("");
    setEndTime("");
    setSelectedCenter(null);
    setPage(1);
    getPayments(1, {}, perPage);
  };

  // Exportation CSV / Excel
  const handleExportCSV = () => {
    if (!payments || payments.length === 0) {
      return toast.error("Aucun encaissement à exporter.");
    }
    const headers = [
      "Reçu N°",
      "Date & Heure",
      "N° Facture",
      "Code Patient",
      "Nom Patient",
      "Mode de Paiement",
      "Référence",
      "Montant (FCFA)",
      "Encaissé par"
    ];
    const rows = payments.map((p) => [
      `REC-${p.id.toString().padStart(5, "0")}`,
      p.created_at ? new Date(p.created_at).toLocaleString("fr-FR") : "",
      `FAC-${p.invoice_id}`,
      p.invoice?.patient?.patient_code || "",
      `"${p.invoice?.patient?.first_name || ""} ${p.invoice?.patient?.last_name || ""}"`,
      p.payment_method,
      p.reference_number || "-",
      p.amount,
      `"${p.reception?.user ? `${p.reception.user.first_name} ${p.reception.user.last_name || ""}` : "Caisse Laboratoire"}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Journal_Caisse_Labo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Fichier Excel/CSV exporté avec succès !");
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Annuler cet encaissement ?",
      text: `Le montant sera déduit de la facture d'examen associée et son statut sera recalculé. Cette action est irréversible.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonText: "Non, fermer",
      confirmButtonText: "Oui, annuler",
      customClass: { popup: "rounded-2xl dark:bg-slate-800 dark:text-slate-200" },
    });

    if (result.isConfirmed) {
      await deletePayment(id);
      fetchPayments();
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

  const centerOptions: SelectOption[] = [
    { value: "", label: "Tous les centres de l'hôpital" },
    ...(centers?.map((c) => ({
      value: c.id.toString(),
      label: c.name,
    })) || []),
  ];

  const handleDirectExportPDF = async () => {
    const filters = {
      start_date: filterDate || undefined,
      end_date: filterDate || undefined,
      center_id: selectedCenter?.value ? Number(selectedCenter.value) : undefined,
    };
    await downloadPaymentsReportPdf(filters);
  };

  return (
    <div className="p-6">
      {/* --- EN-TÊTE --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Wallet className="text-emerald-600 dark:text-emerald-400" /> Registre de Caisse Laboratoire
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Consultez et filtrez l'historique complet des versements et encaissements des examens de laboratoire
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2"
            title="Exporter la liste en Excel / CSV"
          >
            <FileSpreadsheet size={16} />
            <span>Export Excel (CSV)</span>
          </button>

          <button
            onClick={handleDirectExportPDF}
            disabled={actionLoading}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            title="Générer directement le PDF des encaissements affichés"
          >
            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            <span>Imprimer PDF</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2"
            title="Ouvrir la modale d'exportation PDF avec filtres avancés"
          >
            <FileDown size={16} />
            <span>Rapport PDF Personnalisé</span>
          </button>
        </div>
      </div>

      {/* --- BARRE DE FILTRES MULTI-CRITÈRES --- */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6 transition-colors space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          
          {/* Recherche globale : Patient / N° Facture / Code */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Recherche (Patient / N° Facture / Code)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nom, code patient, FAC-12..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Filtre par Date */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Calendar size={12} /> Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
          </div>

          {/* Heure Début */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Clock size={12} /> Heure Début
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
          </div>

          {/* Heure Fin */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Clock size={12} /> Heure Fin
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
          </div>

          {/* Boutons Filtrer & Réinitialiser */}
          <div className="lg:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1"
            >
              <Filter size={14} /> Filtrer
            </button>
            <button
              type="button"
              onClick={handleResetSearch}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
              title="Réinitialiser tous les filtres"
            >
              Réinit.
            </button>
          </div>

        </form>

        {isAdmin && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
            <div className="w-full max-w-xs">
              <Select
                options={centerOptions}
                value={selectedCenter}
                onChange={(val) => {
                  setSelectedCenter(val);
                  setPage(1);
                }}
                placeholder="Filtrer par centre de l'hôpital..."
                isClearable
                className="text-xs text-slate-800 dark:text-slate-200"
                classNamePrefix="react-select"
              />
            </div>
            <button
              onClick={() => setAutoRefreshPage(!autoRefreshPage)}
              className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors flex items-center gap-1 text-xs"
              title="Rafraîchir la liste"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-emerald-600" : ""} />
              <span>Actualiser</span>
            </button>
          </div>
        )}
      </div>

      {/* --- TABLEAU DES PAIEMENTS --- */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reçu / Date</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Facture</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mode & Ref.</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Encaissé par</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Montant Versé</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
                    Chargement du registre de caisse...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    Aucun encaissement trouvé.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const caissierName = p.reception?.user
                    ? `${p.reception.user.first_name} ${p.reception.user.last_name || ""}`
                    : "Caisse Laboratoire";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                          REC-{p.id.toString().padStart(5, "0")}
                        </div>
                        <div className="text-xs text-slate-500">
                          {p.created_at ? new Date(p.created_at).toLocaleString("fr-FR") : "-"}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                          FAC-{p.invoice_id}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {p.invoice?.patient?.first_name} {p.invoice?.patient?.last_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {p.invoice?.patient?.patient_code}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase">
                          <CreditCard className="w-3 h-3" />
                          {p.payment_method}
                        </span>
                        {p.reference_number && (
                          <div className="text-xs text-slate-400 mt-0.5 font-mono">
                            Ref: {p.reference_number}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{caissierName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                          +{formatCurrency(Number(p.amount))}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => setSelectedPayment(p)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                title="Modifier l'encaissement"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(p.id)}
                                disabled={actionLoading}
                                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                title="Annuler le paiement"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
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
        {pagination && pagination.lastPage > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span>
                Affichage de{" "}
                <span className="font-semibold text-slate-800 dark:text-white">
                  {pagination.total > 0 ? (pagination.currentPage - 1) * perPage + 1 : 0}
                </span>{" "}
                à{" "}
                <span className="font-semibold text-slate-800 dark:text-white">
                  {Math.min(pagination.currentPage * perPage, pagination.total)}
                </span>{" "}
                sur <span className="font-semibold text-slate-800 dark:text-white">{pagination.total}</span> paiements
              </span>

              <div className="flex items-center gap-2">
                <span className="text-xs">Éléments par page:</span>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none dark:text-white"
                >
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={pagination.currentPage <= 1 || loading}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                title="Page précédente"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.lastPage }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      pNum === pagination.currentPage
                        ? "bg-emerald-600 text-white"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {pNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage(page + 1)}
                disabled={pagination.currentPage >= pagination.lastPage || loading}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                title="Page suivante"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALE DE MODIFICATION --- */}
      {selectedPayment && (
        <UpdatePaymentModal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          payment={selectedPayment}
          onSuccess={fetchPayments}
        />
      )}

      {/* --- MODALE D'EXPORTATION DU POINT DE CAISSE (PDF) --- */}
      {isExportModalOpen && (
        <ExportPaymentsModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
};

export default LabPayments;
