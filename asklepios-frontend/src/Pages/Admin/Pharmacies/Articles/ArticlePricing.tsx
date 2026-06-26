import { useState } from "react";
import {
  Store,
  ChevronDown,
  ChevronUp,
  Package,
  Search,
  Tag,
  AlertCircle,
  MapPin,
  Edit3,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  useBranches,
  useBranchArticles,
  useUpdateBranchArticlePrice,
  useExportBranchArticlesExcel,
} from "../../../../hooks/pharmacy/useBranchArticle";

function BranchesSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-150 dark:border-gray-700 shadow-sm overflow-hidden"
        >
          <div className="flex justify-between items-center p-5">
            <div className="flex items-center gap-4 w-full">
              {/* Icon placeholder */}
              <div className="p-3 bg-slate-200 dark:bg-gray-700 rounded-xl h-12 w-12 flex-shrink-0" />
              <div className="space-y-2 w-full max-w-md">
                {/* Title and badge placeholder */}
                <div className="flex items-center gap-2">
                  <div className="h-5 bg-slate-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-4 bg-slate-100 dark:bg-gray-750 rounded w-20" />
                </div>
                {/* Address placeholder */}
                <div className="h-3 bg-slate-100 dark:bg-gray-750 rounded w-1/2" />
              </div>
            </div>
            {/* Chevron placeholder */}
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-gray-700 flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BranchArticlesSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-slate-50 dark:bg-gray-850">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Article
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Prix de Vente
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Prix par Défaut
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td className="px-4 py-4">
                  <div className="h-4 bg-slate-200 dark:bg-gray-750 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-slate-100 dark:bg-gray-800 rounded w-1/3" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 bg-slate-200 dark:bg-gray-750 rounded w-8" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-6 bg-slate-200 dark:bg-gray-750 rounded w-20 ml-auto" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 bg-slate-200 dark:bg-gray-750 rounded w-16 ml-auto" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-5 bg-slate-200 dark:bg-gray-750 rounded-full w-12 mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination placeholder */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="h-3 bg-slate-200 dark:bg-gray-750 rounded w-48" />
        <div className="flex gap-2">
          <div className="h-7 w-7 bg-slate-200 dark:bg-gray-750 rounded" />
          <div className="h-7 w-7 bg-slate-200 dark:bg-gray-750 rounded" />
        </div>
      </div>
    </div>
  );
}

interface BranchArticlesListProps {
  branchId: number;
  currency: string;
}

// Composant enfant pour charger et afficher dynamiquement les articles d'une succursale avec pagination et recherche
function BranchArticlesList({ branchId, currency }: BranchArticlesListProps) {
  // États de recherche et de pagination locales
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");

  const {
    data: paginatedData,
    isLoading,
    error,
  } = useBranchArticles(branchId, page, search, 10);

  const updatePriceMutation = useUpdateBranchArticlePrice();

  // États pour gérer l'édition en ligne par double-clic
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInputValue);
    setPage(1); // Retour à la première page lors d'une nouvelle recherche
  };

  const handleClearSearch = () => {
    setSearchInputValue("");
    setSearch("");
    setPage(1);
  };

  const handleSavePrice = (articleId: number, originalValue: number | null) => {
    const trimmed = editValue.trim();
    // Si la valeur est vide, on envoie null pour réinitialiser le prix (retour au prix global)
    const finalPrice = trimmed === "" ? null : parseFloat(trimmed);

    if (finalPrice !== null && (isNaN(finalPrice) || finalPrice < 0)) {
      toast.error("Veuillez saisir un prix valide");
      return;
    }

    // Si la valeur n'a pas changé, on quitte le mode édition
    if (finalPrice === originalValue) {
      setEditingArticleId(null);
      return;
    }

    updatePriceMutation.mutate(
      {
        branch_id: branchId,
        article_id: articleId,
        special_selling_price: finalPrice,
      },
      {
        onSuccess: () => {
          setEditingArticleId(null);
          toast.success("Prix de vente mis à jour avec succès");
        },
        onError: () => {
          toast.error("Erreur lors de la mise à jour du prix");
        },
      },
    );
  };

  const articles = paginatedData?.data || [];
  const totalArticles = paginatedData?.total || 0;
  const lastPage = paginatedData?.last_page || 1;

  return (
    <div className="space-y-4">
      {/* Barre de recherche d'articles interne */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Filtrer les articles par nom ou code-barres..."
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent text-xs text-slate-800 dark:text-white transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
        >
          Rechercher
        </button>
        {search && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </form>

      {isLoading ? (
        <BranchArticlesSkeleton />
      ) : error ? (
        <div className="p-4 text-center bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>
            Erreur lors du chargement des articles de cette succursale.
          </span>
        </div>
      ) : articles.length === 0 ? (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
          <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>
            {search
              ? "Aucun article ne correspond à votre recherche."
              : "Aucun article n'est configuré dans cette succursale."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-slate-50 dark:bg-gray-850">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <span className="flex justify-end items-center gap-1">
                      Prix de Vente{" "}
                      <Edit3 className="w-3.5 h-3.5 text-gray-450" />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Prix par Défaut
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                {articles.map((article) => {
                  const hasSpecialPrice =
                    article.branch_config?.special_selling_price !== null;
                  const isEditing = editingArticleId === article.id;

                  return (
                    <tr
                      key={article.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-gray-750/10"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 dark:text-white">
                          {article.name}
                        </div>
                        {article.default_storage_location && (
                          <span className="text-[10px] text-gray-400 font-normal">
                            Emplacement :{" "}
                            {article.default_storage_location.code ||
                              `${article.default_storage_location.aisle} - ${article.default_storage_location.shelf}`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-gray-300 font-medium">
                        {article.stock_qty.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() =>
                              handleSavePrice(
                                article.id,
                                article.branch_config?.special_selling_price,
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSavePrice(
                                  article.id,
                                  article.branch_config?.special_selling_price,
                                );
                              } else if (e.key === "Escape") {
                                setEditingArticleId(null);
                              }
                            }}
                            disabled={updatePriceMutation.isPending}
                            className="w-28 px-2 py-1 text-right text-sm border border-teal-500 rounded outline-none focus:ring-1 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Prix global"
                          />
                        ) : (
                          <div
                            onDoubleClick={() => {
                              setEditingArticleId(article.id);
                              setEditValue(
                                article.branch_config?.special_selling_price?.toString() ??
                                  "",
                              );
                            }}
                            className="cursor-pointer select-none group inline-block text-right"
                            title="Double-cliquez pour modifier le prix"
                          >
                            {hasSpecialPrice ? (
                              <span className="text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded inline-flex items-center gap-1.5 hover:ring-1 hover:ring-teal-300 font-bold">
                                {article.selling_price.toLocaleString()}{" "}
                                {currency}
                                <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-teal-600 transition-opacity" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 hover:text-teal-500 font-medium">
                                {article.selling_price.toLocaleString()}{" "}
                                {currency}
                                <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-teal-400 transition-opacity" />
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                        {article.default_selling_price.toLocaleString()}{" "}
                        {currency}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            article.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {article.is_active ? "Actif" : "Inactif"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Page {page} sur {lastPage} ({totalArticles} articles au total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded border border-gray-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={page === lastPage}
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  className="p-1.5 rounded border border-gray-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ArticlePricing() {
  const { data: branches, isLoading, error } = useBranches();

  // ID de la pharmacie actuellement ouverte dans la vue déroulante/accordéon
  const [expandedBranchId, setExpandedBranchId] = useState<number | null>(null);

  // Barre de recherche pour filtrer les succursales
  const [searchQuery, setSearchQuery] = useState("");

  // États pour la modale d'exportation Excel
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<"all" | "single">("all");
  const [selectedExportBranchId, setSelectedExportBranchId] = useState<
    number | null
  >(null);

  const exportMutation = useExportBranchArticlesExcel();

  const toggleBranch = (branchId: number) => {
    setExpandedBranchId((prev) => (prev === branchId ? null : branchId));
  };

  // Filtrer les succursales sur la recherche
  const filteredBranches = branches?.filter(
    (branch) =>
      branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.adress.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleExportExcel = () => {
    let filename = "tarifs_toutes_succursales.xlsx";
    const branchId = exportTarget === "single" ? selectedExportBranchId : null;

    const pad = (n: number) => String(n).padStart(2, "0");
    const now = new Date();
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    if (branchId) {
      const branchName =
        branches?.find((b) => b.id === branchId)?.name || "succursale";
      const cleanBranchName = branchName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_");
      filename = `tarifs_${cleanBranchName}_${timestamp}.xlsx`;
    } else {
      filename = `tarifs_toutes_succursales_${timestamp}.xlsx`;
    }

    exportMutation.mutate(branchId, {
      onSuccess: (data) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        toast.success("Fichier Excel exporté avec succès !");
        setIsExportModalOpen(false);
      },
      onError: (err) => {
        console.error(err);
        toast.error("Échec de l'exportation des prix en Excel.");
      },
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <span className="p-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl">
              <Tag className="h-8 w-8" />
            </span>
            Tarification par Succursale
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Gérez et personnalisez les prix de vente et la disponibilité des
            articles pour chaque pharmacie de votre réseau.
          </p>
        </div>
        <button
          onClick={() => {
            setIsExportModalOpen(true);
            if (branches && branches.length > 0) {
              setSelectedExportBranchId(branches[0].id);
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm self-stretch md:self-auto justify-center"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Exporter les Prix (Excel)
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Rechercher une pharmacie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm text-slate-800 dark:text-white transition-all"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors w-full justify-center sm:w-auto">
            <SlidersHorizontal className="h-4 w-4" />
            Filtres
          </button>
        </div>
      </div>

      {/* États de chargement et d'erreur */}
      {isLoading && <BranchesSkeleton />}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
              Erreur de chargement
            </h3>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1">
              Impossible de récupérer la liste des succursales. Veuillez
              réessayer ultérieurement.
            </p>
          </div>
        </div>
      )}

      {/* Liste des succursales (Format accordéon/déroulant) */}
      {!isLoading && !error && filteredBranches && (
        <div className="space-y-4">
          {filteredBranches.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 text-center py-16 rounded-xl border border-gray-100 dark:border-gray-700">
              <Store className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Aucune pharmacie trouvée
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Aucune succursale ne correspond à votre recherche.
              </p>
            </div>
          ) : (
            filteredBranches.map((branch) => {
              const isExpanded = expandedBranchId === branch.id;

              return (
                <div
                  key={branch.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-150 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300"
                >
                  {/* L'en-tête de la succursale sur lequel on clique */}
                  <div
                    onClick={() => toggleBranch(branch.id)}
                    className="flex justify-between items-center p-5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-gray-750/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl transition-colors ${
                          branch.type === "central_warehouse"
                            ? "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400"
                            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                        }`}
                      >
                        <Store className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          {branch.name}
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              branch.type === "central_warehouse"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            }`}
                          >
                            {branch.type === "central_warehouse"
                              ? "Magasin Central"
                              : "Point de Vente"}
                          </span>
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {branch.adress}
                          {branch.country && ` • ${branch.country.name}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu Déroulant Accordéon contenant la liste des articles de la pharmacie */}
                  {isExpanded && (
                    <div className="border-t border-gray-150 dark:border-gray-750 bg-slate-50/50 dark:bg-gray-900/40 p-5 transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                          <Package className="h-4 w-4 text-teal-600" />
                          Catalogue d'Articles local
                        </h3>
                      </div>

                      {/* Composant dynamique pour afficher les articles */}
                      <BranchArticlesList
                        branchId={branch.id}
                        currency={branch.country?.currency || "FCFA"}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL D'EXPORT EXCEL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-150 dark:border-gray-700 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Exporter la Tarification
              </h3>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 transition-colors text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Générez une fiche tarifaire Excel propre et allégée (contenant
                uniquement le nom des articles et leurs prix finaux) prête à
                être imprimée ou affichée pour les clients.
              </p>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block">
                  Périmètre de l'exportation :
                </label>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="exportTarget"
                      checked={exportTarget === "all"}
                      onChange={() => setExportTarget("all")}
                      className="text-teal-600 focus:ring-teal-500 h-4 w-4"
                    />
                    Toutes les succursales de pharmacie
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="exportTarget"
                      checked={exportTarget === "single"}
                      onChange={() => setExportTarget("single")}
                      className="text-teal-600 focus:ring-teal-500 h-4 w-4"
                    />
                    Une succursale spécifique
                  </label>
                </div>
              </div>

              {exportTarget === "single" && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block">
                    Sélectionner la pharmacie :
                  </label>
                  <select
                    value={selectedExportBranchId || ""}
                    onChange={(e) =>
                      setSelectedExportBranchId(Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-sm text-slate-800 dark:text-white"
                  >
                    {branches?.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 bg-slate-50 dark:bg-gray-850 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 text-xs font-semibold rounded-lg transition-colors"
                disabled={exportMutation.isPending}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                disabled={
                  exportMutation.isPending ||
                  (exportTarget === "single" && !selectedExportBranchId)
                }
              >
                {exportMutation.isPending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Exporter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
