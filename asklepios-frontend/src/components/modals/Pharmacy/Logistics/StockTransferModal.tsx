import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Truck,
  MapPin,
  Search,
  PackageCheck,
  Package,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from "lucide-react";
import toast from "react-hot-toast";
import Select from "react-select";

// Stores
import useStockTransferStore from "../../../../functions/pharmacy/useStockTransferStore";
import usePharmacyStore from "../../../../functions/pharmacy/usePharmacyStore";
import useDriverStore from "../../../../functions/pharmacy/useDriverStore";
import useVehiculeStore from "../../../../functions/pharmacy/useVehiculeStore";
import useStockStore from "../../../../functions/pharmacy/useStockStore";

// Types
import type { StockTransferPayload } from "../../../../types/transferTypes";
import type { StockDto } from "../../../../types/StockTypes";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ==========================================
// HELPER : Styles React-Select adaptatifs au thème
// ==========================================
const buildSelectStyles = (isDark: boolean) => ({
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: isDark ? "#1f2937" : "#ffffff",
    color: isDark ? "#f9fafb" : "#111827",
    borderColor: state.isFocused ? "#6366f1" : isDark ? "#374151" : "#d1d5db",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    minHeight: "38px",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(99,102,241,0.25)" : "none",
    "&:hover": { borderColor: "#6366f1" },
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: isDark ? "#1f2937" : "#ffffff",
    color: isDark ? "#f9fafb" : "#111827",
    zIndex: 9999,
    borderRadius: "0.5rem",
    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
    boxShadow: "0 10px 25px -3px rgba(0,0,0,0.3)",
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#6366f1"
      : state.isFocused
        ? isDark
          ? "#374151"
          : "#e0e7ff"
        : "transparent",
    color: state.isSelected ? "#ffffff" : isDark ? "#f9fafb" : "#111827",
    fontSize: "0.875rem",
    cursor: "pointer",
    "&:active": { backgroundColor: "#4f46e5" },
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: isDark ? "#f9fafb" : "#111827",
  }),
  input: (provided: any) => ({
    ...provided,
    color: isDark ? "#f9fafb" : "#111827",
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: isDark ? "#6b7280" : "#9ca3af",
    fontSize: "0.875rem",
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (provided: any) => ({
    ...provided,
    color: isDark ? "#6b7280" : "#9ca3af",
  }),
  clearIndicator: (provided: any) => ({
    ...provided,
    color: isDark ? "#6b7280" : "#9ca3af",
  }),
});

export const StockTransferModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // --- THEME DETECTION ---
  const isDark = document.documentElement.classList.contains("dark");
  const selectStyles = useMemo(() => buildSelectStyles(isDark), [isDark]);

  // --- STORES ---
  const { createTransfer, actionLoading } = useStockTransferStore();
  const { pharmacyBranches, getPharmacyBranches } = usePharmacyStore();
  const { drivers, getDrivers } = useDriverStore();
  const { vehicules, getVehicules } = useVehiculeStore();
  const { stocks, getMyBranchStocks, loading: stocksLoading } = useStockStore();

  // --- ÉTATS LOGISTIQUES ---
  const [destinationId, setDestinationId] = useState<number | "">("");
  const [driverId, setDriverId] = useState<number | "">("");
  const [vehiculeId, setVehiculeId] = useState<number | "">("");

  // --- ÉTATS SÉLECTION & QUANTITÉS ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatches, setSelectedBatches] = useState<StockDto[]>([]);
  const [isGlobalQtyMode, setIsGlobalQtyMode] = useState(false);
  const [globalQty, setGlobalQty] = useState<number | "">("");
  const [individualQuantities, setIndividualQuantities] = useState<
    Record<number, number>
  >({});

  // --- INITIALISATION ---
  useEffect(() => {
    if (isOpen) {
      getPharmacyBranches();
      getDrivers({ is_active: "true" });
      getVehicules({ is_active: "true" });
      // Charger tous les stocks locaux (per_page=1000 pour éviter la pagination)
      getMyBranchStocks({ per_page: 1000 });
    } else {
      // Reset au fermeture
      setDestinationId("");
      setDriverId("");
      setVehiculeId("");
      setSearchTerm("");
      setSelectedBatches([]);
      setIsGlobalQtyMode(false);
      setGlobalQty("");
      setIndividualQuantities({});
    }
  }, [
    isOpen,
    getPharmacyBranches,
    getDrivers,
    getVehicules,
    getMyBranchStocks,
  ]);

  // --- OPTIONS REACT-SELECT ---
  const pharmacyOptions = useMemo(
    () => pharmacyBranches.map((b) => ({ value: b.id, label: b.name })),
    [pharmacyBranches],
  );
  const driverOptions = useMemo(
    () => drivers.map((d) => ({ value: d.id, label: d.fullname })),
    [drivers],
  );
  const vehiculeOptions = useMemo(
    () =>
      vehicules.map((v) => ({
        value: v.id,
        label: `${v.model} (${v.licence_plate})`,
      })),
    [vehicules],
  );

  // --- FILTRAGE : inclure TOUS les stocks (qty > 0) ou les afficher avec état rupture ---
  const filteredStocks = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return stocks.filter((s) => {
      const articleName = s.batch?.article?.name?.toLowerCase() || "";
      const batchNumber = s.batch?.batch_number?.toLowerCase() || "";
      if (term && !articleName.includes(term) && !batchNumber.includes(term))
        return false;
      return true; // Afficher même qty=0 pour que l'utilisateur voie l'état réel
    });
  }, [stocks, searchTerm]);

  // Stocks disponibles (qty > 0) pour mise en évidence
  const availableStocks = useMemo(
    () => filteredStocks.filter((s) => s.qty > 0),
    [filteredStocks],
  );

  // --- GESTION DE LA SÉLECTION ---
  const toggleBatchSelection = (stockItem: StockDto) => {
    if (stockItem.qty <= 0) return; // Ne pas sélectionner les ruptures
    const isSelected = selectedBatches.some(
      (b) => b.batch_id === stockItem.batch_id,
    );
    if (isSelected) {
      setSelectedBatches((prev) =>
        prev.filter((b) => b.batch_id !== stockItem.batch_id),
      );
      const newQties = { ...individualQuantities };
      delete newQties[stockItem.batch_id];
      setIndividualQuantities(newQties);
    } else {
      setSelectedBatches((prev) => [...prev, stockItem]);
      setIndividualQuantities((prev) => ({ ...prev, [stockItem.batch_id]: 1 }));
    }
  };

  // --- TOUT SÉLECTIONNER / DÉSÉLECTIONNER ---
  const isAllAvailableSelected =
    availableStocks.length > 0 &&
    availableStocks.every((stock) =>
      selectedBatches.some((b) => b.batch_id === stock.batch_id),
    );

  const toggleSelectAll = () => {
    if (isAllAvailableSelected) {
      const filteredIds = availableStocks.map((s) => s.batch_id);
      setSelectedBatches((prev) =>
        prev.filter((b) => !filteredIds.includes(b.batch_id)),
      );
      const newQties = { ...individualQuantities };
      filteredIds.forEach((id) => delete newQties[id]);
      setIndividualQuantities(newQties);
    } else {
      const newSelected = [...selectedBatches];
      const newQties = { ...individualQuantities };
      availableStocks.forEach((stock) => {
        if (!newSelected.some((b) => b.batch_id === stock.batch_id)) {
          newSelected.push(stock);
          newQties[stock.batch_id] = 1;
        }
      });
      setSelectedBatches(newSelected);
      setIndividualQuantities(newQties);
    }
  };

  // --- SOUMISSION ---
  const handleSubmit = async () => {
    if (!destinationId || !driverId || !vehiculeId) {
      toast.error("Veuillez remplir toutes les informations logistiques.");
      return;
    }
    if (selectedBatches.length === 0) {
      toast.error("Sélectionnez au moins un article à transférer.");
      return;
    }

    const linesToSubmit: { batch_id: number; qty: number }[] = [];
    let hasError = false;

    for (const stock of selectedBatches) {
      const qtyToTransfer = isGlobalQtyMode
        ? Number(globalQty)
        : individualQuantities[stock.batch_id];
      if (!qtyToTransfer || qtyToTransfer <= 0) {
        toast.error(`Quantité invalide pour ${stock.batch?.article?.name}`);
        hasError = true;
        break;
      }
      if (qtyToTransfer > stock.qty) {
        toast.error(
          `Stock insuffisant pour ${stock.batch?.article?.name} (Max: ${stock.qty})`,
        );
        hasError = true;
        break;
      }
      linesToSubmit.push({ batch_id: stock.batch_id, qty: qtyToTransfer });
    }

    if (hasError) return;

    const payload: StockTransferPayload = {
      destination_pharmacy_id: Number(destinationId),
      driver_id: Number(driverId),
      vehicule_id: Number(vehiculeId),
      lines: linesToSubmit,
    };

    const success = await createTransfer(payload);
    if (success) {
      onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 dark:bg-black/85 flex items-center justify-center z-50 p-2 backdrop-blur-sm">
      {/* Modale plein-écran avec marges */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-[95vw] h-[95vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* ===== EN-TÊTE ===== */}
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-800 dark:to-indigo-900 shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Truck size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Initier un Transfert de Stock
              </h2>
              <p className="text-xs text-indigo-200 dark:text-indigo-300 mt-0.5">
                Expédiez des articles vers une autre succursale de l'hôpital
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ===== CORPS ===== */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-700">
          {/* ===== COLONNE GAUCHE : Stock ===== */}
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900">
            {/* Zone logistique */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-gray-800/60 shrink-0 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-bold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin size={14} className="text-indigo-500" />
                Informations d'expédition
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Destinataire <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={pharmacyOptions}
                    styles={selectStyles}
                    placeholder="Rechercher une succursale..."
                    value={
                      pharmacyOptions.find((o) => o.value === destinationId) ||
                      null
                    }
                    onChange={(selected: any) =>
                      setDestinationId(selected?.value || "")
                    }
                    menuPosition="absolute"
                    isClearable
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Chauffeur <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={driverOptions}
                    styles={selectStyles}
                    placeholder="Sélectionner un chauffeur..."
                    value={
                      driverOptions.find((o) => o.value === driverId) || null
                    }
                    onChange={(selected: any) =>
                      setDriverId(selected?.value || "")
                    }
                    menuPosition="absolute"
                    isClearable
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Véhicule <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={vehiculeOptions}
                    styles={selectStyles}
                    placeholder="Sélectionner un véhicule..."
                    value={
                      vehiculeOptions.find((o) => o.value === vehiculeId) ||
                      null
                    }
                    onChange={(selected: any) =>
                      setVehiculeId(selected?.value || "")
                    }
                    menuPosition="absolute"
                    isClearable
                  />
                </div>
              </div>
            </div>

            {/* Zone de la liste des stocks */}
            <div className="flex-1 flex flex-col px-6 py-4 min-h-0 overflow-hidden">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <h3 className="text-xs font-bold text-slate-700 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
                  <Package size={14} className="text-indigo-500" />
                  Mon Stock Local
                  {!stocksLoading && (
                    <span className="font-normal text-gray-400 dark:text-gray-500 normal-case tracking-normal">
                      — {availableStocks.length} article
                      {availableStocks.length !== 1 ? "s" : ""} disponible
                      {availableStocks.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </h3>
                {availableStocks.length > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                  >
                    {isAllAvailableSelected ? (
                      <>
                        <CheckSquare size={13} /> Tout désélectionner
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={13} /> Tout sélectionner
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Barre de recherche */}
              <div className="relative mb-3 shrink-0">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  size={15}
                />
                <input
                  type="text"
                  placeholder="Rechercher un article ou un N° de lot..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-indigo-400 dark:focus:border-indigo-500 text-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-colors"
                />
              </div>

              {/* Table de stock */}
              <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
                {stocksLoading ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-gray-400 dark:text-gray-600">
                    <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mb-3" />
                    <p className="text-sm">Chargement de votre stock...</p>
                  </div>
                ) : stocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-gray-400 dark:text-gray-500 text-center px-6">
                    <Package size={48} className="mb-3 opacity-20" />
                    <p className="text-sm font-semibold mb-1">
                      Aucun stock enregistré
                    </p>
                    <p className="text-xs opacity-70">
                      Aucun enregistrement de stock n'a été trouvé pour votre
                      succursale. Vérifiez que des commandes d'achat ont bien
                      été réceptionnées.
                    </p>
                  </div>
                ) : filteredStocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-gray-400 dark:text-gray-500 text-center px-6">
                    <Search size={36} className="mb-3 opacity-20" />
                    <p className="text-sm font-semibold">
                      Aucun résultat pour "{searchTerm}"
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-gray-800 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="p-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase w-10"></th>
                        <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Article
                        </th>
                        <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-center">
                          N° Lot
                        </th>
                        <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-center">
                          Péremption
                        </th>
                        <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">
                          Stock dispo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredStocks.map((stock) => {
                        const isSelected = selectedBatches.some(
                          (b) => b.batch_id === stock.batch_id,
                        );
                        const isOutOfStock = stock.qty <= 0;
                        const article = stock.batch?.article;
                        const expDate = stock.batch?.expire_date;

                        return (
                          <tr
                            key={stock.batch_id}
                            onClick={() =>
                              !isOutOfStock && toggleBatchSelection(stock)
                            }
                            className={`transition-colors ${
                              isOutOfStock
                                ? "opacity-40 cursor-not-allowed"
                                : isSelected
                                  ? "bg-indigo-50 dark:bg-indigo-900/20 cursor-pointer"
                                  : "hover:bg-slate-50 dark:hover:bg-gray-800/60 cursor-pointer"
                            }`}
                          >
                            <td className="p-3 text-center">
                              {isOutOfStock ? (
                                <Square
                                  size={16}
                                  className="text-gray-300 dark:text-gray-600 mx-auto"
                                />
                              ) : isSelected ? (
                                <CheckSquare
                                  size={16}
                                  className="text-indigo-600 dark:text-indigo-400 mx-auto"
                                />
                              ) : (
                                <Square
                                  size={16}
                                  className="text-gray-400 dark:text-gray-500 mx-auto"
                                />
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                  <Layers
                                    size={13}
                                    className="text-indigo-500 dark:text-indigo-400"
                                  />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-800 dark:text-gray-100 leading-tight">
                                    {article?.name || "Article inconnu"}
                                  </p>
                                  {article?.category?.name && (
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                      {article.category.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <span className="text-xs font-mono bg-slate-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded text-slate-600 dark:text-gray-300">
                                {stock.batch?.batch_number || "—"}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {expDate ? (
                                <span
                                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                    new Date(expDate) < new Date()
                                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  }`}
                                >
                                  {new Date(expDate).toLocaleDateString(
                                    "fr-FR",
                                  )}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <span
                                className={`text-sm font-bold ${
                                  isOutOfStock
                                    ? "text-red-500 dark:text-red-400"
                                    : stock.qty <= 10
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-slate-700 dark:text-gray-200"
                                }`}
                              >
                                {stock.qty}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* ===== COLONNE DROITE : Panier ===== */}
          <div className="w-full lg:w-[400px] bg-slate-50 dark:bg-gray-800/50 flex flex-col h-full shrink-0 overflow-hidden">
            {/* En-tête panier */}
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <PackageCheck size={16} className="text-indigo-500" />
                  Panier de Transfert
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    selectedBatches.length > 0
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {selectedBatches.length} article
                  {selectedBatches.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Toggle quantité globale */}
              {selectedBatches.length > 0 && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isGlobalQtyMode}
                        onChange={() => setIsGlobalQtyMode(!isGlobalQtyMode)}
                      />
                      <div
                        className={`block w-9 h-5 rounded-full transition-colors ${isGlobalQtyMode ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"}`}
                      />
                      <div
                        className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow ${isGlobalQtyMode ? "translate-x-4" : ""}`}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                      Même quantité pour tous
                    </span>
                  </label>
                  {isGlobalQtyMode && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        placeholder="Ex: 50"
                        value={globalQty}
                        onChange={(e) => setGlobalQty(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400 text-slate-800 dark:text-gray-100"
                      />
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        unités
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Liste des articles sélectionnés */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {selectedBatches.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 text-center py-12">
                  <PackageCheck size={44} className="mb-3 opacity-20" />
                  <p className="text-sm font-medium">
                    Aucun article sélectionné
                  </p>
                  <p className="text-xs mt-1 opacity-70 max-w-[200px]">
                    Cochez des articles dans la liste de gauche pour les ajouter
                    au transfert.
                  </p>
                </div>
              ) : (
                selectedBatches.map((stock) => {
                  const error =
                    (!isGlobalQtyMode &&
                      individualQuantities[stock.batch_id] > stock.qty) ||
                    (isGlobalQtyMode && Number(globalQty) > stock.qty);

                  return (
                    <div
                      key={stock.batch_id}
                      className={`p-3 rounded-xl border transition-colors relative group ${
                        error
                          ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/50"
                          : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                      } shadow-sm`}
                    >
                      {/* Bouton supprimer */}
                      <button
                        onClick={() => toggleBatchSelection(stock)}
                        className="absolute -top-1.5 -right-1.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X size={11} />
                      </button>

                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-xs font-bold text-slate-800 dark:text-gray-100 truncate">
                            {stock.batch?.article?.name}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                            Lot: {stock.batch?.batch_number} •{" "}
                            <span className="font-semibold text-indigo-500">
                              Stock: {stock.qty}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Saisie de quantité */}
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          max={stock.qty}
                          disabled={isGlobalQtyMode}
                          value={
                            isGlobalQtyMode
                              ? globalQty
                              : individualQuantities[stock.batch_id] || ""
                          }
                          onChange={(e) => {
                            let val = Number(e.target.value);
                            if (val > stock.qty) val = stock.qty;
                            setIndividualQuantities((prev) => ({
                              ...prev,
                              [stock.batch_id]: val,
                            }));
                          }}
                          className={`w-full text-right font-bold text-sm px-3 py-1.5 rounded-lg outline-none border transition-colors
                                                        ${
                                                          isGlobalQtyMode
                                                            ? "bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed border-gray-200 dark:border-gray-700"
                                                            : error
                                                              ? "bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-700 focus:border-red-500 text-red-700 dark:text-red-400"
                                                              : "bg-slate-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-indigo-400 text-slate-800 dark:text-gray-100"
                                                        }`}
                        />
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          unités
                        </span>
                      </div>
                      {error && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertTriangle
                            size={10}
                            className="text-red-500 shrink-0"
                          />
                          <p className="text-[10px] text-red-500 font-bold">
                            Dépasse le stock disponible !
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ===== PIED DE MODALE ===== */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-b-2xl shrink-0 flex justify-between items-center">
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {selectedBatches.length > 0 && (
              <span>
                {selectedBatches.length} article
                {selectedBatches.length !== 1 ? "s" : ""} sélectionné
                {selectedBatches.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                actionLoading ||
                selectedBatches.length === 0 ||
                !destinationId ||
                !driverId ||
                !vehiculeId
              }
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Truck size={15} />
              {actionLoading ? "Traitement..." : "Initier l'expédition"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
