import React, { useState, useMemo } from "react";
import { Database, Plus, Edit3, Trash2, RefreshCw, Search } from "lucide-react";
import Swal from "sweetalert2";
import {
  useLabCategories,
  useCreateLabCategory,
  useUpdateLabCategory,
  useDeleteLabCategory,
} from "../../../hooks/laboratory/useLabCategory";
import type { LabCategoryDto } from "../../../types/types";
import toast from "react-hot-toast";
import { useAuth } from "../../../contexts/AuthContext";
import LabCategoryForm from "../../../components/modals/Laboratory/LabCategoryForm";
import { Pagination } from "../../../components/common/Pagination";
import { Button } from "../../../components/common/Button";

const LabCategories = () => {
  // Tanstack Hooks
  const { profile } = useAuth();
  const hospitalId =
    profile?.profile_admin?.hospital_id || profile?.hospital_id;

  const {
    data: categories = [],
    isLoading,
    refetch,
    isFetching,
  } = useLabCategories(hospitalId ? { hospital_id: hospitalId } : undefined);
  const createMutation = useCreateLabCategory();
  const updateMutation = useUpdateLabCategory();
  const deleteMutation = useDeleteLabCategory();

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<LabCategoryDto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Inline editing state
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null,
  );
  const [editingName, setEditingName] = useState("");

  const handleStartInlineEdit = (
    category: LabCategoryDto,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setEditingCategoryId(category.id);
    setEditingName(category.name);
  };

  const handleSaveInlineEdit = (category: LabCategoryDto) => {
    const trimmed = editingName.trim();
    setEditingCategoryId(null);
    if (!trimmed || trimmed === category.name) {
      return;
    }
    updateMutation.mutate(
      { id: category.id, payload: { name: trimmed } },
      {
        onSuccess: () => toast.success("Catégorie mise à jour"),
        onError: () => toast.error("Erreur lors de la mise à jour"),
      },
    );
  };

  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredCategories = useMemo(() => {
    const term = normalize(searchTerm);
    return categories
      .filter((c) => normalize(c.name).includes(term))
      .sort((a, b) =>
        a.name.localeCompare(b.name, "fr", { sensitivity: "base" }),
      );
  }, [categories, searchTerm]);

  const paginatedCategories = useMemo(() => {
    return filteredCategories.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }, [filteredCategories, currentPage, itemsPerPage]);

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: LabCategoryDto) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Êtes-vous sûr ?",
      text: "Cette action est irréversible !",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonText: "Annuler",
      confirmButtonText: "Oui, supprimer",
    });

    if (result.isConfirmed) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success("Catégorie supprimée avec succès"),
        onError: () => toast.error("Erreur lors de la suppression"),
      });
    }
  };

  // Skeleton loader component
  const TableSkeleton = () => (
    <div className="animate-pulse">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="flex border-t border-gray-100 dark:border-gray-700 p-4"
        >
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
            <Database size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Catégories d'examens
            </h1>
            <p className="text-sm text-gray-500">
              Gérez les grandes familles (ex: Hématologie, Biochimie...)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            tooltip="Actualiser la liste des catégories"
            tooltipPosition="bottom"
            icon={
              <RefreshCw
                size={18}
                className={isFetching ? "animate-spin text-gray-500" : "text-gray-500"}
              />
            }
          />

          <Button
            variant="primary"
            onClick={handleOpenCreate}
            tooltip="Créer et ajouter une nouvelle famille d'examens"
            tooltipPosition="left"
            icon={<Plus size={18} />}
          >
            Nouvelle Catégorie
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="max-w-md relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Rechercher une catégorie par son nom..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-[#00a896] text-sm text-slate-800 dark:text-white transition-colors"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton />
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">
                      <div
                        className="flex items-center gap-1.5"
                        title="Double-cliquer sur une cellule pour modifier"
                      >
                        <span>Nom de la Catégorie</span>
                        <Edit3 size={13} className="text-[#00a896]" />
                      </div>
                    </th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">
                      Examens liés
                    </th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {paginatedCategories.map((category, index) => (
                    <tr
                      key={category.id}
                      className={`transition-colors hover:bg-teal-50/40 dark:hover:bg-teal-900/20 ${
                        index % 2 === 0
                          ? "bg-white dark:bg-gray-800"
                          : "bg-slate-50/70 dark:bg-gray-800/40"
                      }`}
                    >
                      <td className="p-4 text-gray-800 dark:text-gray-200 font-medium">
                        {editingCategoryId === category.id ? (
                          <input
                            type="text"
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => handleSaveInlineEdit(category)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSaveInlineEdit(category);
                              } else if (e.key === "Escape") {
                                setEditingCategoryId(null);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm px-2 py-1 bg-white dark:bg-gray-900 border border-[#00a896] rounded outline-none text-sm focus:ring-2 focus:ring-[#00a896] text-slate-800 dark:text-white shadow-sm"
                          />
                        ) : (
                          <span
                            onDoubleClick={(e) =>
                              handleStartInlineEdit(category, e)
                            }
                            className="cursor-pointer hover:text-[#00a896] dark:hover:text-teal-400 hover:underline transition-colors select-none"
                            title="Double-cliquer pour modifier le nom"
                          >
                            {category.name}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-500">
                        {category.tests?.length || 0} examen(s)
                      </td>
                      <td className="p-4 flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(category)}
                          tooltip="Modifier le nom de la catégorie"
                          tooltipPosition="top"
                          className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          icon={<Edit3 size={18} />}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
                          disabled={deleteMutation.isPending}
                          tooltip="Supprimer définitivement la catégorie"
                          tooltipPosition="top"
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                          icon={<Trash2 size={18} />}
                        />
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-500">
                        Aucune catégorie trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredCategories.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
              onItemsPerPageChange={(limit) => setItemsPerPage(limit)}
            />
          </div>
        )}
      </div>

      <LabCategoryForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedCategory={selectedCategory}
      />
    </div>
  );
};

export default LabCategories;
