import React, { useEffect, useState } from "react";
import {
  Truck,
  Plus,
  RefreshCw,
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  Package,
  Eye,
  FileDown,
} from "lucide-react";
import Swal from "sweetalert2";

// Store & Types
import useStockTransferStore from "../../functions/pharmacy/useStockTransferStore";
import type { StockTransferDto } from "../../types/transferTypes";

// Context
import { useAuth } from "../../contexts/AuthContext";

// Composants
import { StockTransferModal } from "../../components/modals/Pharmacy/Logistics/StockTransferModal";

const StockTransfers = () => {
  // --- STORES ---
  const {
    transfers,
    pagination,
    loading,
    actionLoading,
    getTransfers,
    receiveTransfer,
    cancelTransfer,
    exportPdf,
    downloadWaybillPdf,
  } = useStockTransferStore();

  // RÉCUPÉRATION DU BRANCH_ID DE L'UTILISATEUR CONNECTÉ
  const { profile } = useAuth();
  const currentBranchId = profile?.profile_pharm?.branch_id;

  // --- ÉTATS & FILTRES ---
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>(""); // INITIATED, TERMINATED, CANCELLED
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Gestion de l'affichage des détails (Expandable Row)
  const [expandedTransferId, setExpandedTransferId] = useState<number | null>(
    null,
  );

  // Modale de création
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      getTransfers(
        {
          page,
          status: statusFilter || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
        "pharmacy",
      );
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [getTransfers, page, statusFilter, startDate, endDate]);

  const handleRefresh = () => {
    getTransfers(
      {
        page,
        status: statusFilter,
        start_date: startDate,
        end_date: endDate,
      },
      "pharmacy",
    );
  };

  // --- ACTIONS LOGISTIQUES ---

  // 1. Réceptionner (Destinataire uniquement)
  const handleReceive = async (id: number, sourceName: string) => {
    const result = await Swal.fire({
      title: "Réceptionner le transfert ?",
      text: `Confirmez-vous la réception physique des articles en provenance de "${sourceName}" ? Les stocks de votre pharmacie seront immédiatement augmentés.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981", // Emerald
      cancelButtonText: "Attendre",
      confirmButtonText: "Oui, réceptionner",
      customClass: { popup: "rounded-2xl dark:bg-gray-800 dark:text-gray-200" },
    });

    if (result.isConfirmed) {
      const success = await receiveTransfer(id);
      if (success) handleRefresh();
    }
  };

  // 2. Annuler (Expéditeur uniquement)
  const handleCancel = async (id: number) => {
    const result = await Swal.fire({
      title: "Annuler l'expédition ?",
      text: `Voulez-vous vraiment annuler ce transfert ? Les articles seront immédiatement restitués dans le stock de votre pharmacie.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444", // Red
      cancelButtonText: "Fermer",
      confirmButtonText: "Oui, annuler le transfert",
      customClass: { popup: "rounded-2xl dark:bg-gray-800 dark:text-gray-200" },
    });

    if (result.isConfirmed) {
      const success = await cancelTransfer(id);
      if (success) handleRefresh();
    }
  };

  // --- UTILITAIRES D'AFFICHAGE ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "INITIATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Truck size={14} /> En Transit
          </span>
        );
      case "TERMINATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 size={14} /> Réceptionné
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <XCircle size={14} /> Annulé
          </span>
        );
      default:
        return <span className="text-gray-500">{status}</span>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "---";
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-6">
      {/* EN-TÊTE DE LA PAGE */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg shadow-sm">
            <Truck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Transferts de Stock
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gérez les expéditions et réceptions inter-pharmacies.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() =>
              exportPdf(
                {
                  status: statusFilter,
                  start_date: startDate,
                  end_date: endDate,
                },
                "pharmacy",
              )
            }
            disabled={actionLoading}
            className="flex items-center gap-2 p-2.5 bg-white hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-900/20 text-red-600 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 text-sm font-semibold"
            title="Télécharger le rapport PDF"
          >
            <FileText size={16} /> <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading || actionLoading}
            className="p-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 ml-2"
            title="Rafraîchir"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm text-sm"
          >
            <Plus size={18} />
            Initier un transfert
          </button>
        </div>
      </div>

      {/* BARRE DE FILTRES */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:w-48">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
            Statut
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:text-white"
          >
            <option value="">Tous les statuts</option>
            <option value="INITIATED">En Transit</option>
            <option value="TERMINATED">Réceptionnés</option>
            <option value="CANCELLED">Annulés</option>
          </select>
        </div>

        <div className="w-full md:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Du (Date de création)
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-2.5 text-gray-400"
                size={16}
              />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-indigo-500 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Au (Date de création)
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-2.5 text-gray-400"
                size={16}
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-indigo-500 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TABLEAU DES TRANSFERTS */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase w-10"></th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">
                  Trajet (Source ➔ Dest.)
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">
                  Logistique
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">
                  Dates
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">
                  Statut
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {loading && transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Loader2
                      size={32}
                      className="animate-spin text-indigo-500 mx-auto mb-2"
                    />
                    <p className="text-gray-500">
                      Chargement des transferts...
                    </p>
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    Aucun transfert trouvé pour ces critères.
                  </td>
                </tr>
              ) : (
                transfers.map((transfer: StockTransferDto) => (
                  <React.Fragment key={transfer.id}>
                    {/* LIGNE PRINCIPALE */}
                    <tr
                      className={`hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors ${expandedTransferId === transfer.id ? "bg-slate-50 dark:bg-gray-800/50" : ""}`}
                    >
                      <td
                        className="p-4 text-center cursor-pointer"
                        onClick={() =>
                          setExpandedTransferId(
                            expandedTransferId === transfer.id
                              ? null
                              : transfer.id,
                          )
                        }
                      >
                        <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                          {expandedTransferId === transfer.id ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-slate-800 dark:text-gray-200 font-semibold">
                            <MapPin size={14} className="text-red-500" />
                            {transfer.sourcePharmacy?.name ||
                              `Pharmacie #${transfer.source_pharmacy_id}`}
                          </div>
                          <div className="flex items-center gap-2 text-slate-800 dark:text-gray-200 font-semibold">
                            <MapPin size={14} className="text-emerald-500" />
                            {transfer.destinationPharmacy?.name ||
                              `Pharmacie #${transfer.destination_pharmacy_id}`}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-600 dark:text-gray-400 flex flex-col gap-1">
                          <span className="flex items-center gap-1.5">
                            <Truck size={14} />{" "}
                            {transfer.driver?.fullname || "N/A"}
                          </span>
                          <span className="text-xs opacity-75">
                            {transfer.vehicule?.licence_plate || "Véhicule N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-gray-400">
                        <div className="flex flex-col gap-1 text-xs">
                          <span>
                            <strong className="text-slate-800 dark:text-gray-200">
                              Exp:
                            </strong>{" "}
                            {formatDate(transfer.shipped_at)}
                          </span>
                          <span>
                            <strong className="text-slate-800 dark:text-gray-200">
                              Réc:
                            </strong>{" "}
                            {formatDate(transfer.received_at)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {getStatusBadge(transfer.status)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {/* BOUTON TÉLÉCHARGER LE BORDEREAU DE ROUTE (Toujours visible) */}
                          <button
                            onClick={() =>
                              downloadWaybillPdf(transfer.id, "admin")
                            }
                            disabled={actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/40 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                            title="Télécharger le bordereau de route (PDF)"
                          >
                            <FileDown size={14} /> Bordereau
                          </button>

                          {/* 1. BOUTON PRÉVISUALISER (Toujours visible) */}
                          <button
                            onClick={() =>
                              setExpandedTransferId(
                                expandedTransferId === transfer.id
                                  ? null
                                  : transfer.id,
                              )
                            }
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40 rounded-lg text-xs font-bold transition-colors"
                            title="Prévisualiser les articles transférés"
                          >
                            <Eye size={14} />{" "}
                            {expandedTransferId === transfer.id
                              ? "Masquer"
                              : "Voir"}
                          </button>

                          {/* 2. BOUTON RECEVOIR (Condition: En transit + Je suis le destinataire) */}
                          {transfer.status === "INITIATED" &&
                            transfer.destination_pharmacy_id ===
                              currentBranchId && (
                              <button
                                onClick={() =>
                                  handleReceive(
                                    transfer.id,
                                    transfer.sourcePharmacy?.name || "",
                                  )
                                }
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 rounded-lg text-xs font-bold transition-colors"
                                title="Réceptionner dans mon stock"
                              >
                                <CheckCircle2 size={14} /> Recevoir
                              </button>
                            )}

                          {/* 3. BOUTON ANNULER (Condition: En transit + Je suis l'expéditeur) */}
                          {transfer.status === "INITIATED" &&
                            transfer.source_pharmacy_id === currentBranchId && (
                              <button
                                onClick={() => handleCancel(transfer.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg text-xs font-bold transition-colors"
                                title="Annuler et restituer mon stock"
                              >
                                <XCircle size={14} /> Annuler
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>

                    {/* LIGNE EXTENSIBLE : Détails des articles */}
                    {expandedTransferId === transfer.id && (
                      <tr className="bg-indigo-50/50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                        <td colSpan={6} className="p-0">
                          <div className="p-6">
                            <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Package size={16} /> Contenu de l'expédition (
                              {transfer.lines?.length || 0} références)
                            </h4>

                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                              <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                  <tr>
                                    <th className="px-4 py-2 font-semibold">
                                      Article
                                    </th>
                                    <th className="px-4 py-2 font-semibold">
                                      N° Lot
                                    </th>
                                    <th className="px-4 py-2 font-semibold text-right">
                                      Qté Expédiée
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                  {transfer.lines?.map((line, index) => (
                                    <tr
                                      key={index}
                                      className="hover:bg-slate-50 dark:hover:bg-gray-700/20"
                                    >
                                      <td className="px-4 py-2 font-medium text-slate-800 dark:text-gray-200">
                                        {line.batch?.article?.name ||
                                          "Article Inconnu"}
                                      </td>
                                      <td className="px-4 py-2">
                                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                                          {line.batch?.batch_number ||
                                            `Lot #${line.batch_id}`}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                        {line.qty_shipped}
                                      </td>
                                    </tr>
                                  ))}
                                  {!transfer.lines ||
                                    (transfer.lines.length === 0 && (
                                      <tr>
                                        <td
                                          colSpan={3}
                                          className="px-4 py-3 text-center text-gray-500"
                                        >
                                          Aucun détail disponible.
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {pagination && pagination.last_page > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Page {pagination.current_page} sur {pagination.last_page} (
              {pagination.total} transferts)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 disabled:opacity-50 text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Précédent
              </button>
              <button
                disabled={page === pagination.last_page}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 disabled:opacity-50 text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODALE D'INITIATION DE TRANSFERT */}
      <StockTransferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default StockTransfers;
