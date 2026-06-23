import { useState, useMemo } from "react";
import Swal from "sweetalert2";
import {
  Search,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  Layers,
  Package,
  User,
  AlertCircle,
} from "lucide-react";

// --- TYPES ---
interface MovementRecord {
  id: string;
  date: string;
  productName: string;
  batchNumber: string;
  type:
    | "STOCK_IN"
    | "STOCK_OUT"
    | "ADJUSTMENT_POS"
    | "ADJUSTMENT_NEG"
    | "EXPIRED";
  quantity: number;
  operatorName: string;
  reason: string;
}

// --- DONNÉES STATIQUES DE TEST ---
const MOCK_MOVEMENTS: MovementRecord[] = [
  {
    id: "MVMT-001",
    date: "2026-06-23 14:10",
    productName: "Paracétamol Efferalgan 500mg",
    batchNumber: "LOT-2603A",
    type: "STOCK_IN",
    quantity: 100,
    operatorName: "Fotié Martial",
    reason: "Réception commande fournisseur #A-2026",
  },
  {
    id: "MVMT-002",
    date: "2026-06-23 11:30",
    productName: "Amoxicilline Sandoz 1g",
    batchNumber: "LOT-2511B",
    type: "STOCK_OUT",
    quantity: 2,
    operatorName: "M. Amadou",
    reason: "Vente Facture #FAC-260623-02",
  },
  {
    id: "MVMT-003",
    date: "2026-06-22 15:00",
    productName: "Vitamine C Upresa 1000mg",
    batchNumber: "LOT-2401X",
    type: "EXPIRED",
    quantity: 15,
    operatorName: "Mme. Bella",
    reason: "Retrait du rayon : produits périmés",
  },
  {
    id: "MVMT-004",
    date: "2026-06-21 09:45",
    productName: "Ibuprofène Biogaran 400mg",
    batchNumber: "LOT-2601C",
    type: "ADJUSTMENT_POS",
    quantity: 5,
    operatorName: "Fotié Martial",
    reason: "Ajustement après inventaire tournant (surplus)",
  },
  {
    id: "MVMT-005",
    date: "2026-06-20 17:20",
    productName: "Sirop Humex Toux Sèche",
    batchNumber: "LOT-2502H",
    type: "ADJUSTMENT_NEG",
    quantity: 1,
    operatorName: "Mme. Bella",
    reason: "Ajustement : Flacon brisé en rayon",
  },
];

export default function MovementsHistory() {
  // --- ÉTATS DES FILTRES ---
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // --- RÉINITIALISATION DES FILTRES ---
  const handleResetFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setTypeFilter("");
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Filtres réinitialisés",
      showConfirmButton: false,
      timer: 1500,
    });
  };

  // --- VISUALISATION DU MOTIF ---
  const handleViewReason = (movement: MovementRecord) => {
    Swal.fire({
      title: "Justificatif du mouvement",
      html: `
        <div class="text-left text-sm space-y-2">
          <p><strong>Produit :</strong> ${movement.productName}</p>
          <p><strong>Lot :</strong> ${movement.batchNumber}</p>
          <p><strong>Auteur :</strong> ${movement.operatorName}</p>
          <div class="p-3 bg-slate-50 border rounded-lg mt-2 text-slate-600 italic">
            "${movement.reason}"
          </div>
        </div>
      `,
      icon: "info",
      confirmButtonColor: "#0f172a",
    });
  };

  // --- LOGIQUE DE FILTRAGE ---
  const filteredMovements = useMemo(() => {
    return MOCK_MOVEMENTS.filter((mvmt) => {
      const matchesSearch =
        mvmt.productName.toLowerCase().includes(search.toLowerCase()) ||
        mvmt.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
        mvmt.operatorName.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter ? mvmt.type === typeFilter : true;

      const mvmtDateOnly = mvmt.date.split(" ")[0];
      const matchesStartDate = startDate ? mvmtDateOnly >= startDate : true;
      const matchesEndDate = endDate ? mvmtDateOnly <= endDate : true;

      return matchesSearch && matchesType && matchesStartDate && matchesEndDate;
    });
  }, [search, startDate, endDate, typeFilter]);

  // --- CONFIGURATION MAQUETTE TYPE MOUVEMENT ---
  const getMovementBadge = (type: string) => {
    switch (type) {
      case "STOCK_IN":
        return {
          label: "Entrée",
          className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
          icon: <ArrowUpRight className="w-3.5 h-3.5" />,
        };
      case "STOCK_OUT":
        return {
          label: "Sortie",
          className: "bg-blue-50 text-blue-700 border border-blue-200",
          icon: <ArrowDownLeft className="w-3.5 h-3.5" />,
        };
      case "ADJUSTMENT_POS":
        return {
          label: "Ajustement (+)",
          className: "bg-teal-50 text-teal-700 border border-teal-200",
          icon: <ArrowUpRight className="w-3.5 h-3.5 text-teal-500" />,
        };
      case "ADJUSTMENT_NEG":
        return {
          label: "Ajustement (-)",
          className: "bg-amber-50 text-amber-700 border border-amber-200",
          icon: <ArrowDownLeft className="w-3.5 h-3.5 text-amber-500" />,
        };
      case "EXPIRED":
        return {
          label: "Périmé",
          className: "bg-rose-50 text-rose-700 border border-rose-200",
          icon: <AlertCircle className="w-3.5 h-3.5" />,
        };
      default:
        return {
          label: type,
          className: "bg-slate-100 text-slate-800",
          icon: null,
        };
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Mouvements de Stock
          </h1>
          <p className="text-sm text-slate-500">
            Traçabilité complète des entrées, sorties et ajustements de produits
          </p>
        </div>

        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs text-sm">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="font-bold font-mono">
            {filteredMovements.length}
          </span>{" "}
          flux tracés
        </div>
      </div>

      {/* ================= FILTRES ================= */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 mb-6">
        <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold text-sm uppercase tracking-wide">
          <Filter className="w-4 h-4 text-slate-900" /> Filtrer le flux
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Recherche Produit / Lot */}
          <div className="md:col-span-4 relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Rechercher un produit
            </label>
            <Search className="absolute left-3 top-8 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Nom du produit, N° de lot, auteur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-colors"
            />
          </div>

          {/* Date Début */}
          <div className="md:col-span-2 relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Depuis le
            </label>
            <Calendar className="absolute left-3 top-8 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-colors"
            />
          </div>

          {/* Date Fin */}
          <div className="md:col-span-2 relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Jusqu'au
            </label>
            <Calendar className="absolute left-3 top-8 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-colors"
            />
          </div>

          {/* Type de mouvement */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Nature du mouvement
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="">Tous les mouvements</option>
              <option value="STOCK_IN">
                Entrées de stock (Approvisionnement)
              </option>
              <option value="STOCK_OUT">Sorties de stock (Ventes)</option>
              <option value="ADJUSTMENT_POS">Ajustements Positifs (+)</option>
              <option value="ADJUSTMENT_NEG">Ajustements Négatifs (-)</option>
              <option value="EXPIRED">Périmés / Rebuts</option>
            </select>
          </div>

          {/* Bouton Reset */}
          <div className="md:col-span-1 flex justify-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs cursor-pointer shadow-xs"
              title="Vider les filtres"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* ================= TABLEAU ================= */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 p-3 font-semibold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="p-4">Date & Heure</th>
                <th className="p-4">Désignation Produit</th>
                <th className="p-4">N° de Lot</th>
                <th className="p-4 text-center">Type de Flux</th>
                <th className="p-4 text-right">Qté Mouvementée</th>
                <th className="p-4">Opérateur</th>
                <th className="p-4 text-center">Justificatif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Aucun mouvement de stock répertorié pour ces critères.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mvmt) => {
                  const badge = getMovementBadge(mvmt.type);
                  const isPositive = ["STOCK_IN", "ADJUSTMENT_POS"].includes(
                    mvmt.type,
                  );

                  return (
                    <tr
                      key={mvmt.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4 text-slate-600 font-medium">
                        {mvmt.date}
                      </td>

                      <td className="p-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400 shrink-0" />
                          {mvmt.productName}
                        </div>
                      </td>

                      <td className="p-4 font-mono text-slate-500 text-xs">
                        {mvmt.batchNumber}
                      </td>

                      {/* Badge Type */}
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md font-semibold ${badge.className}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>

                      {/* Quantité avec couleur dynamique */}
                      <td
                        className={`p-4 text-right font-mono font-black text-base ${isPositive ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {isPositive ? "+" : "-"}
                        {mvmt.quantity}
                      </td>

                      <td className="p-4 text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {mvmt.operatorName}
                        </div>
                      </td>

                      {/* Bouton Motif */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleViewReason(mvmt)}
                          className="p-1 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Voir le motif"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
