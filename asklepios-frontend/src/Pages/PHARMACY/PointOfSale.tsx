import { useState } from "react";
import {
  Plus,
  DollarSign,
  Clock,
  LayoutGrid,
  Search,
  Layers,
} from "lucide-react";
import SaleModal from "../../components/modals/Pharmacy/Pharmacien/CreateSaleModal";

export default function PointOfSale() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Données factices pour ton Dashboard épuré
  const cashierInfo = {
    name: "M. Amadou",
    tillNumber: "Caisse #02",
    currentBalance: 145000,
    loginTime: "07:30",
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header du Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Tableau de Bord Ventes
          </h1>
          <p className="text-sm text-slate-500">
            Gestion et contrôle des encaissements journaliers
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl shadow-md flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Nouvelle Vente
        </button>
      </div>

      {/* Grille des KPIs Épurés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* KPI Solde de Caisse */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-emerald-50 rounded-xl text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Solde Actuel en Caisse
            </p>
            <h3 className="text-2xl font-black text-slate-900 font-mono mt-0.5">
              {cashierInfo.currentBalance.toLocaleString()} XAF
            </h3>
          </div>
        </div>

        {/* KPI Info Vendeur */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-blue-50 rounded-xl text-blue-600">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Caissier & Terminal
            </p>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              {cashierInfo.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {cashierInfo.tillNumber}
            </p>
          </div>
        </div>

        {/* KPI Connexion */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Début de Session
            </p>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Connecté à {cashierInfo.loginTime}
            </h3>
            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>{" "}
              Session active
            </p>
          </div>
        </div>
      </div>

      {/* Moteur de Recherche Rapide (Hors-Vente) */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-slate-500" /> Vérification rapide de
          produit (Prix / Stock)
        </h2>
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Taper pour vérifier la disponibilité d'un médicament..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Injection de la Modale de Vente */}
      <SaleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
