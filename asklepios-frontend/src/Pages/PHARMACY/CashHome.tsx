import { useState, useMemo } from "react";
import {
  Plus,
  DollarSign,
  Clock,
  LayoutGrid,
  Search,
  Layers,
  AlertCircle,
  Loader2,
} from "lucide-react";
import SaleModal from "../../components/modals/Pharmacy/Pharmacien/CreateSaleModal";
import { useMyActiveSession } from "../../hooks/pharmacy/useCashRegisterSession";
import { useBranchArticlesAll } from "../../hooks/pharmacy/useBrancheArticle";

export default function CashHome() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Récupérer la session de caisse active du pharmacien
  const {
    data: myActiveSession,
    isLoading: isLoadingSession,
    refetch,
  } = useMyActiveSession();

  // Récupérer les articles configurés pour cette succursale
  const currentBranchId = myActiveSession?.register?.branch_id;
  const { data: branchArticles, isLoading: isLoadingArticles } =
    useBranchArticlesAll(currentBranchId || null);

  const currency =
    myActiveSession?.register?.branch?.country?.currency || "XAF";

  // Formater les articles configurés au format produit simple pour la recherche
  const products = useMemo(() => {
    if (!branchArticles) return [];
    const list: any[] = [];

    branchArticles.forEach((article: any) => {
      if (!article.is_active) return;

      const locationStr = article.default_storage_location
        ? `${article.default_storage_location.row}-${article.default_storage_location.shelf}`
        : "N/A";

      if (
        article.track_batches &&
        article.batches &&
        article.batches.length > 0
      ) {
        article.batches.forEach((batch: any) => {
          list.push({
            id: `${article.id}-${batch.id}`,
            articleId: article.id,
            batchId: batch.id,
            batchNumber: batch.batch_number,
            name: `${article.name} [Lot: ${batch.batch_number}]`,
            code: article.barcode || `ART-${article.id}`,
            price: article.selling_price,
            stock: batch.qty,
            requiresPrescription: article.is_prescripted,
            expiryDate: batch.expire_date || "Sans date",
            location: locationStr,
          });
        });
      } else {
        list.push({
          id: article.id.toString(),
          articleId: article.id,
          name: article.name,
          code: article.barcode || `ART-${article.id}`,
          price: article.selling_price,
          stock: article.stock_qty,
          requiresPrescription: article.is_prescripted,
          expiryDate: "N/A",
          location: locationStr,
        });
      }
    });

    return list;
  }, [branchArticles]);

  // Filtrer les produits pour la vérification rapide
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query),
      )
      .slice(0, 5);
  }, [searchQuery, products]);

  const cashierName = myActiveSession?.user
    ? `${myActiveSession.user.first_name} ${myActiveSession.user.last_name || ""}`
    : "Caissier";

  const loginTime = myActiveSession?.opened_at
    ? new Date(myActiveSession.opened_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  return (
    <div className="p-6 bg-slate-50 dark:bg-gray-900 min-h-screen text-slate-900 dark:text-white transition-colors duration-200 animate-in fade-in duration-300">
      {/* Header du Dashboard (Statique - Chargé Immédiatement) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Tableau de Bord Ventes
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Gestion et contrôle des encaissements de la session
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isLoadingSession || !myActiveSession}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl shadow-xs flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Nouvelle Vente
        </button>
      </div>

      {/* Si le chargement de la session est fini, mais qu'aucune n'existe */}
      {!isLoadingSession && !myActiveSession ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-slate-200 dark:border-gray-700 max-w-xl mx-auto text-center shadow-xs space-y-4 mb-8">
          <AlertCircle className="w-14 h-14 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            Aucune session active
          </h2>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Vous devez ouvrir une session de caisse avant de pouvoir effectuer
            des ventes ou utiliser le tableau de bord.
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer mx-auto block"
          >
            Actualiser l'état
          </button>
        </div>
      ) : (
        <>
          {/* Grille des KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* KPI Solde de Caisse */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-gray-700 flex items-center gap-4 hover:border-slate-300 dark:hover:border-gray-600 transition-colors">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">
                  Solde Actuel en Caisse
                </p>
                {isLoadingSession ? (
                  <div className="h-7 w-28 bg-slate-200 dark:bg-gray-700 animate-pulse rounded-md mt-1" />
                ) : (
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                    {(myActiveSession?.current_balance || 0).toLocaleString()}{" "}
                    {currency}
                  </h3>
                )}
              </div>
            </div>

            {/* KPI Info Vendeur */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-gray-700 flex items-center gap-4 hover:border-slate-300 dark:hover:border-gray-600 transition-colors">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">
                  Caissier & Terminal
                </p>
                {isLoadingSession ? (
                  <div className="space-y-1.5 mt-1">
                    <div className="h-5 w-32 bg-slate-200 dark:bg-gray-700 animate-pulse rounded-md" />
                    <div className="h-3.5 w-20 bg-slate-200 dark:bg-gray-700 animate-pulse rounded-md" />
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {cashierName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                      {myActiveSession?.register?.name || "N/A"}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* KPI Connexion */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-gray-700 flex items-center gap-4 hover:border-slate-300 dark:hover:border-gray-600 transition-colors">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-600 dark:text-amber-400">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">
                  Début de Session
                </p>
                {isLoadingSession ? (
                  <div className="space-y-1.5 mt-1">
                    <div className="h-5 w-36 bg-slate-200 dark:bg-gray-700 animate-pulse rounded-md" />
                    <div className="h-3.5 w-24 bg-slate-200 dark:bg-gray-700 animate-pulse rounded-md" />
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      Démarré à {loginTime}
                    </h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full"></span>{" "}
                      Session active
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Détails des ventes du jour */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Répartition des encaissements */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-gray-700">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 mb-4">
                Répartition des encaissements de la session
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {isLoadingSession ? (
                  [1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="bg-slate-50 dark:bg-gray-900/30 p-4 rounded-xl border border-slate-100 dark:border-gray-750 space-y-2"
                    >
                      <div className="h-3 w-16 bg-slate-200 dark:bg-gray-700 animate-pulse rounded-md" />
                      <div className="h-6 w-24 bg-slate-200 dark:bg-gray-700 animate-pulse rounded-md" />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="bg-slate-50 dark:bg-gray-900/40 p-4 rounded-xl border border-slate-100 dark:border-gray-700/50">
                      <span className="text-xs text-slate-500 dark:text-gray-400 font-bold block mb-1">
                        Espèces
                      </span>
                      <span className="text-lg font-black text-slate-800 dark:text-white font-mono">
                        {(
                          myActiveSession?.sales_totals?.cash || 0
                        ).toLocaleString()}{" "}
                        {currency}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-gray-900/40 p-4 rounded-xl border border-slate-100 dark:border-gray-700/50">
                      <span className="text-xs text-slate-500 dark:text-gray-400 font-bold block mb-1">
                        Mobile Money
                      </span>
                      <span className="text-lg font-black text-slate-800 dark:text-white font-mono">
                        {(
                          myActiveSession?.sales_totals?.mobile_money || 0
                        ).toLocaleString()}{" "}
                        {currency}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-gray-900/40 p-4 rounded-xl border border-slate-100 dark:border-gray-700/50">
                      <span className="text-xs text-slate-500 dark:text-gray-400 font-bold block mb-1">
                        Carte Bancaire
                      </span>
                      <span className="text-lg font-black text-slate-800 dark:text-white font-mono">
                        {(
                          myActiveSession?.sales_totals?.card || 0
                        ).toLocaleString()}{" "}
                        {currency}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Infos Caisse & Succursale */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-gray-700 flex flex-col justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 mb-4">
                  Informations du terminal
                </h2>
                <div className="space-y-3">
                  {isLoadingSession ? (
                    [1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-gray-700/50 last:border-b-0"
                      >
                        <div className="h-3.5 w-16 bg-slate-200 dark:bg-gray-700 animate-pulse rounded-md" />
                        <div className="h-3.5 w-24 bg-slate-200 dark:bg-gray-700 animate-pulse rounded-md" />
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex justify-between text-xs border-b border-slate-100 dark:border-gray-700 pb-2">
                        <span className="text-slate-500 dark:text-gray-400 font-medium">
                          Terminal :
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          {myActiveSession?.register?.name}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs border-b border-slate-100 dark:border-gray-700 pb-2">
                        <span className="text-slate-500 dark:text-gray-400 font-medium">
                          Fonds de départ :
                        </span>
                        <span className="font-mono font-bold text-slate-800 dark:text-white">
                          {(
                            myActiveSession?.opening_balance || 0
                          ).toLocaleString()}{" "}
                          {currency}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 dark:text-gray-400 font-medium">
                          Succursale :
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          {myActiveSession?.register?.branch?.name}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {!isLoadingSession && (
                <div className="text-[10px] text-slate-400 dark:text-gray-500 mt-4 pt-2 border-t border-slate-100 dark:border-gray-700 flex justify-between items-center italic">
                  <span>Session ID: #{myActiveSession?.id}</span>
                  <span>Succursale ID: #{currentBranchId}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Moteur de Recherche Rapide (Prix / Stock) - Toujours affiché immédiatement */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-gray-700">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 mb-4 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-slate-500 dark:text-gray-400" />{" "}
          Vérification rapide de produit (Prix / Stock)
        </h2>
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Taper pour vérifier le prix ou le stock d'un médicament..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 dark:focus:ring-teal-500 focus:bg-white dark:focus:bg-gray-800 text-slate-900 dark:text-white transition-all"
          />
        </div>

        {/* Résultats de recherche rapide */}
        {searchQuery.trim() !== "" && (
          <div className="mt-4 border border-slate-100 dark:border-gray-700 rounded-xl overflow-hidden shadow-xs bg-white dark:bg-gray-800 animate-in slide-in-from-top-2 duration-200">
            {isLoadingArticles ? (
              <div className="divide-y divide-slate-100 dark:divide-gray-700">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse"
                  >
                    <div className="space-y-2">
                      <div className="h-4 w-48 bg-slate-200 dark:bg-gray-700 rounded-md" />
                      <div className="h-3.5 w-72 bg-slate-150 dark:bg-gray-750 rounded-md" />
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="space-y-1 text-right">
                        <div className="h-3 w-14 bg-slate-200 dark:bg-gray-700 rounded-md ml-auto" />
                        <div className="h-4 w-20 bg-slate-200 dark:bg-gray-700 rounded-md" />
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="h-3 w-12 bg-slate-200 dark:bg-gray-700 rounded-md ml-auto" />
                        <div className="h-6 w-14 bg-slate-200 dark:bg-gray-700 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-gray-700">
                {filteredProducts.map((p) => {
                  let stockColor =
                    "text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/30";
                  if (p.stock === 0)
                    stockColor =
                      "text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-950/20 dark:border-rose-900/30";
                  else if (p.stock < 10)
                    stockColor =
                      "text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/30";

                  return (
                    <div
                      key={p.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-gray-750/30 border-b border-slate-100 dark:border-gray-700 last:border-b-0 transition-colors"
                    >
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                          {p.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500 dark:text-gray-400 font-medium">
                          <span>
                            Code :{" "}
                            <span className="text-slate-700 dark:text-slate-300">
                              {p.code}
                            </span>
                          </span>
                          {p.batchNumber && (
                            <span>
                              Lot :{" "}
                              <span className="text-slate-700 dark:text-slate-300">
                                {p.batchNumber}
                              </span>
                            </span>
                          )}
                          <span>
                            Emplacement :{" "}
                            <span className="text-indigo-600 dark:text-teal-400 font-bold">
                              {p.location}
                            </span>
                          </span>
                          {p.expiryDate && p.expiryDate !== "N/A" && (
                            <span>
                              Exp :{" "}
                              <span className="text-slate-700 dark:text-slate-300">
                                {p.expiryDate}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-slate-100 dark:border-gray-700 pt-2 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <span className="text-[9px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider block">
                            Prix Unitaire
                          </span>
                          <span className="font-bold text-slate-800 dark:text-white text-sm">
                            {p.price.toLocaleString()} {currency}
                          </span>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-[9px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider block">
                            Stock Libre
                          </span>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${stockColor}`}
                          >
                            {p.stock} U
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 dark:text-gray-400 text-xs">
                Aucun produit ne correspond à "{searchQuery}".
              </div>
            )}
          </div>
        )}
      </div>

      {/* Injection de la Modale de Vente */}
      <SaleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaleSuccess={() => refetch()}
      />
    </div>
  );
}
