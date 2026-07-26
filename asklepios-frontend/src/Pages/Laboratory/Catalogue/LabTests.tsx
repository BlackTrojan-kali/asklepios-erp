import React, { useState, useMemo } from "react";
import {
  TestTubes,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sliders,
} from "lucide-react";
import Swal from "sweetalert2";
import Select from "react-select";
import {
  useLabTests,
  useCreateLabTest,
  useUpdateLabTest,
  useDeleteLabTest,
} from "../../../hooks/laboratory/useLabTest";
import { useLabCategories } from "../../../hooks/laboratory/useLabCategory";
import {
  useUpdateLabParameter,
  useDeleteLabParameter,
} from "../../../hooks/laboratory/useLabParameter";
import type { LabTestDto, LabParameterDto } from "../../../types/types";
import toast from "react-hot-toast";
import LabTestForm from "../../../components/modals/Laboratory/LabTestForm";
import LabParameterForm from "../../../components/modals/Laboratory/LabParameterForm";
import { Pagination } from "../../../components/common/Pagination";
import { Button } from "../../../components/common/Button";

const LabTests = () => {
  // UI State
  const [selectedCategoryOption, setSelectedCategoryOption] =
    useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTestDto | null>(null);

  // Parameter modal state
  const [isParamModalOpen, setIsParamModalOpen] = useState(false);
  const [selectedParam, setSelectedParam] = useState<LabParameterDto | null>(
    null,
  );
  const [presetTestId, setPresetTestId] = useState<number>(0);

  // Accordion state
  const [expandedTestIds, setExpandedTestIds] = useState<number[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Tanstack Hooks
  const { data: categories = [], isLoading: isLoadingCategories } =
    useLabCategories();
  const {
    data: tests = [],
    isLoading: isLoadingTests,
    refetch,
    isFetching,
  } = useLabTests(selectedCategoryOption?.value);

  const createMutation = useCreateLabTest();
  const updateMutation = useUpdateLabTest();
  const deleteMutation = useDeleteLabTest();
  const updateParamMutation = useUpdateLabParameter();
  const deleteParamMutation = useDeleteLabParameter();

  // Inline editing state for Test
  const [editingTestId, setEditingTestId] = useState<number | null>(null);
  const [editingTestField, setEditingTestField] = useState<"name" | "code" | "price" | null>(null);
  const [editingTestValue, setEditingTestValue] = useState<string | number>("");

  // Inline editing state for Parameter
  const [editingParamId, setEditingParamId] = useState<number | null>(null);
  const [editingParamField, setEditingParamField] = useState<"name" | "unit" | null>(null);
  const [editingParamValue, setEditingParamValue] = useState<string>("");

  // Expanded options state for parameters with > 7 choices
  const [expandedOptionParamIds, setExpandedOptionParamIds] = useState<number[]>([]);

  const toggleExpandOptions = (paramId: number) => {
    setExpandedOptionParamIds((prev) =>
      prev.includes(paramId)
        ? prev.filter((id) => id !== paramId)
        : [...prev, paramId],
    );
  };

  const handleStartTestInlineEdit = (
    test: LabTestDto,
    field: "name" | "code" | "price",
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setEditingTestId(test.id);
    setEditingTestField(field);
    setEditingTestValue(test[field]);
  };

  const handleSaveTestInlineEdit = (test: LabTestDto) => {
    if (!editingTestField) return;
    const rawVal = editingTestValue;
    const currentField = editingTestField;
    setEditingTestId(null);
    setEditingTestField(null);

    if (currentField === "price" && (rawVal === "" || isNaN(Number(rawVal)))) return;
    const finalVal = currentField === "price" ? Number(rawVal) : String(rawVal).trim();
    if (!finalVal || finalVal === test[currentField]) return;

    const payload = {
      lab_category_id: test.lab_category_id,
      code: currentField === "code" ? String(finalVal) : test.code,
      name: currentField === "name" ? String(finalVal) : test.name,
      sample_type_required: test.sample_type_required,
      price: currentField === "price" ? Number(finalVal) : test.price,
      is_active: test.is_active,
    };

    updateMutation.mutate(
      { id: test.id, payload },
      {
        onSuccess: () => toast.success("Examen mis à jour"),
        onError: () => toast.error("Erreur lors de la mise à jour"),
      },
    );
  };

  const handleStartParamInlineEdit = (
    param: LabParameterDto,
    field: "name" | "unit",
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setEditingParamId(param.id);
    setEditingParamField(field);
    setEditingParamValue(param[field] || "");
  };

  const handleSaveParamInlineEdit = (param: LabParameterDto) => {
    if (!editingParamField) return;
    const value = editingParamValue.trim();
    const currentField = editingParamField;
    setEditingParamId(null);
    setEditingParamField(null);

    if (value === (param[currentField] || "")) return;

    const payload = {
      lab_test_id: param.lab_test_id,
      name: currentField === "name" ? value : param.name,
      unit: currentField === "unit" ? value : param.unit,
      value_type: param.value_type,
      options: param.options,
      reference_min_male: param.reference_min_male,
      reference_max_male: param.reference_max_male,
      reference_min_female: param.reference_min_female,
      reference_max_female: param.reference_max_female,
      reference_text: param.reference_text,
    };

    updateParamMutation.mutate(
      { id: param.id, payload },
      {
        onSuccess: () => toast.success("Paramètre mis à jour"),
        onError: () => toast.error("Erreur lors de la mise à jour"),
      },
    );
  };

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories],
  );

  const handleFilterChange = (option: any) => {
    setSelectedCategoryOption(option);
    setCurrentPage(1);
  };

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: "transparent",
      borderColor: "inherit",
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: document.documentElement.classList.contains("dark")
        ? "#1f2937"
        : "white",
      zIndex: 9999,
    }),
    singleValue: (base: any) => ({
      ...base,
      color: document.documentElement.classList.contains("dark")
        ? "white"
        : "black",
    }),
    input: (base: any) => ({
      ...base,
      color: document.documentElement.classList.contains("dark")
        ? "white"
        : "black",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: document.documentElement.classList.contains("dark")
        ? "#9ca3af"
        : "#6b7280",
    }),
  };

  const toggleExpandTest = (id: number) => {
    setExpandedTestIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredTests = useMemo(() => {
    const term = normalize(searchTerm);
    return tests
      .filter((t) => {
        if (!term) return true;
        const matchTest =
          normalize(t.name).includes(term) ||
          normalize(t.code).includes(term);
        const matchParam = t.parameters?.some((p) =>
          normalize(p.name).includes(term),
        );
        return matchTest || matchParam;
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name, "fr", { sensitivity: "base" }),
      );
  }, [tests, searchTerm]);

  const paginatedTests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTests.slice(start, start + itemsPerPage);
  }, [filteredTests, currentPage, itemsPerPage]);

  const handleOpenCreateTest = () => {
    setSelectedTest(null);
    setIsModalOpen(true);
  };

  const handleOpenEditTest = (test: LabTestDto) => {
    setSelectedTest(test);
    setIsModalOpen(true);
  };

  const handleDeleteTest = async (id: number) => {
    const result = await Swal.fire({
      title: "Supprimer cet examen ?",
      text: "Tous les paramètres associés seront également supprimés !",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonText: "Annuler",
      confirmButtonText: "Oui, supprimer",
    });

    if (result.isConfirmed) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success("Examen supprimé avec succès"),
        onError: () => toast.error("Erreur lors de la suppression"),
      });
    }
  };

  // Parameter Action Handlers
  const handleOpenCreateParam = (testId: number) => {
    setSelectedParam(null);
    setPresetTestId(testId);
    setIsParamModalOpen(true);
  };

  const handleOpenEditParam = (param: LabParameterDto) => {
    setSelectedParam(param);
    setPresetTestId(param.lab_test_id);
    setIsParamModalOpen(true);
  };

  const handleDeleteParam = async (id: number) => {
    const result = await Swal.fire({
      title: "Supprimer ce paramètre ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonText: "Annuler",
      confirmButtonText: "Oui, supprimer",
    });

    if (result.isConfirmed) {
      deleteParamMutation.mutate(id, {
        onSuccess: () => {
          toast.success("Paramètre supprimé avec succès");
          refetch();
        },
        onError: () => toast.error("Erreur lors de la suppression"),
      });
    }
  };

  const formatRefNum = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return "";
    return Number.isInteger(val) ? val.toString() : val.toFixed(2);
  };

  const renderReferenceSummary = (param: LabParameterDto) => {
    if (param.value_type === "numeric") {
      const hasMale =
        param.reference_min_male !== null || param.reference_max_male !== null;
      const hasFemale =
        param.reference_min_female !== null ||
        param.reference_max_female !== null;

      if (hasMale || hasFemale) {
        return (
          <div className="flex flex-wrap gap-1 text-[11px]">
            {hasMale && (
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded font-mono">
                H: {formatRefNum(param.reference_min_male) || "0"} -{" "}
                {formatRefNum(param.reference_max_male) || "∞"}
              </span>
            )}
            {hasFemale && (
              <span className="px-1.5 py-0.5 bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 rounded font-mono">
                F: {formatRefNum(param.reference_min_female) || "0"} -{" "}
                {formatRefNum(param.reference_max_female) || "∞"}
              </span>
            )}
          </div>
        );
      }
    }

    if (param.value_type === "options" && param.options?.length) {
      const isExpanded = expandedOptionParamIds.includes(param.id);
      const threshold = 7;
      const shouldCollapse = param.options.length > threshold && !isExpanded;

      const displayOptions = shouldCollapse ? param.options.slice(0, 3) : param.options;
      const remainingCount = param.options.length - 3;

      return (
        <div className="flex flex-wrap items-center gap-1">
          {displayOptions.map((opt, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
            >
              {opt}
            </span>
          ))}
          {shouldCollapse && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpandOptions(param.id);
              }}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-[#00a896] hover:bg-teal-100 dark:bg-teal-900/40 dark:text-teal-300 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer"
              title="Cliquer pour afficher toutes les valeurs"
            >
              +{remainingCount}
            </button>
          )}
          {isExpanded && param.options.length > threshold && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpandOptions(param.id);
              }}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700"
              title="Masquer les valeurs supplémentaires"
            >
              <ChevronUp size={11} />
              <span>Voir moins</span>
            </button>
          )}
        </div>
      );
    }

    if (param.reference_text) {
      return (
        <span className="text-[11px] text-gray-600 dark:text-gray-400">
          {param.reference_text}
        </span>
      );
    }

    return (
      <span className="text-gray-400 text-[11px] italic">Non définie</span>
    );
  };

  // Skeleton loader component
  const TableSkeleton = () => (
    <div className="animate-pulse">
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className="flex border-t border-gray-100 dark:border-gray-700 p-4 items-center"
        >
          <div className="w-1/6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
          </div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-1"></div>
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4"></div>
          </div>
          <div className="w-1/6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
          <div className="w-1/6">
            <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
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
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <TestTubes size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Catalogue des Examens & Paramètres
            </h1>
            <p className="text-sm text-gray-500">
              Gérez vos examens de laboratoire et leurs paramètres associés
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            tooltip="Actualiser la liste des examens"
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
            onClick={handleOpenCreateTest}
            disabled={isLoadingCategories}
            tooltip="Créer un nouvel examen de laboratoire"
            tooltipPosition="left"
            icon={<Plus size={18} />}
          >
            Nouvel Examen
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
            Recherche par Examen ou Paramètre
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Ex: NFS, Glycémie, Leucocytes, HE001..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-[#00a896] text-sm text-slate-800 dark:text-white transition-colors"
            />
          </div>
        </div>

        <div className="w-full md:w-72">
          <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
            Filtrer par catégorie
          </label>
          {isLoadingCategories ? (
            <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
          ) : (
            <Select
              options={categoryOptions}
              value={selectedCategoryOption}
              onChange={handleFilterChange}
              placeholder="Toutes les catégories"
              isClearable
              styles={selectStyles}
            />
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {isLoadingTests ? (
          <div className="p-6">
            <TableSkeleton />
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="p-4 w-10"></th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1.5" title="Double-cliquer sur une cellule pour modifier">
                        <span>Code</span>
                        <Edit3 size={13} className="text-[#00a896]" />
                      </div>
                    </th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1.5" title="Double-cliquer sur une cellule pour modifier">
                        <span>Examen</span>
                        <Edit3 size={13} className="text-[#00a896]" />
                      </div>
                    </th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">
                      Catégorie
                    </th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">
                      Paramètres
                    </th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1.5" title="Double-cliquer sur une cellule pour modifier">
                        <span>Prix</span>
                        <Edit3 size={13} className="text-[#00a896]" />
                      </div>
                    </th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">
                      Statut
                    </th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {paginatedTests.map((test, index) => {
                    const isExpanded =
                      expandedTestIds.includes(test.id) ||
                      (!!searchTerm &&
                        test.parameters?.some((p) =>
                          p.name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()),
                        ));
                    const paramCount = test.parameters?.length || 0;

                    return (
                      <React.Fragment key={test.id}>
                        <tr
                          onClick={() => toggleExpandTest(test.id)}
                          className={`transition-colors cursor-pointer hover:bg-teal-50/50 dark:hover:bg-teal-900/30 ${
                            isExpanded
                              ? "bg-teal-50/70 dark:bg-teal-900/25 border-l-4 border-l-[#00a896]"
                              : index % 2 === 0
                              ? "bg-white dark:bg-gray-800"
                              : "bg-slate-50/70 dark:bg-gray-800/40"
                          }`}
                        >
                          <td className="p-4 text-gray-400">
                            {isExpanded ? (
                              <ChevronDown
                                size={18}
                                className="text-[#00a896]"
                              />
                            ) : (
                              <ChevronRight size={18} />
                            )}
                          </td>
                          <td className="p-4 text-gray-800 dark:text-gray-200 font-mono text-sm font-semibold">
                            {editingTestId === test.id && editingTestField === "code" ? (
                              <input
                                type="text"
                                autoFocus
                                value={editingTestValue}
                                onChange={(e) => setEditingTestValue(e.target.value)}
                                onBlur={() => handleSaveTestInlineEdit(test)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveTestInlineEdit(test);
                                  if (e.key === "Escape") {
                                    setEditingTestId(null);
                                    setEditingTestField(null);
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-24 px-2 py-1 bg-white dark:bg-gray-900 border border-[#00a896] rounded outline-none text-sm font-mono shadow-sm"
                              />
                            ) : (
                              <span
                                onDoubleClick={(e) => handleStartTestInlineEdit(test, "code", e)}
                                className="cursor-pointer hover:text-[#00a896] dark:hover:text-teal-400 hover:underline transition-colors select-none"
                                title="Double-cliquer pour modifier le code"
                              >
                                {test.code}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-gray-800 dark:text-gray-200 font-medium">
                            {editingTestId === test.id && editingTestField === "name" ? (
                              <input
                                type="text"
                                autoFocus
                                value={editingTestValue}
                                onChange={(e) => setEditingTestValue(e.target.value)}
                                onBlur={() => handleSaveTestInlineEdit(test)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveTestInlineEdit(test);
                                  if (e.key === "Escape") {
                                    setEditingTestId(null);
                                    setEditingTestField(null);
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-xs px-2 py-1 bg-white dark:bg-gray-900 border border-[#00a896] rounded outline-none text-sm font-medium shadow-sm"
                              />
                            ) : (
                              <div
                                onDoubleClick={(e) => handleStartTestInlineEdit(test, "name", e)}
                                className="cursor-pointer hover:text-[#00a896] dark:hover:text-teal-400 hover:underline transition-colors select-none"
                                title="Double-cliquer pour modifier le nom"
                              >
                                {test.name}
                              </div>
                            )}
                            <div className="text-xs text-gray-400 font-normal">
                              Prélèvement: {test.sample_type_required}
                            </div>
                          </td>
                          <td className="p-4 text-gray-500">
                            {test.category?.name}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 text-xs rounded-full font-medium inline-flex items-center gap-1 ${
                                paramCount > 0
                                  ? "bg-teal-100 text-[#008f7e] dark:bg-teal-900/40 dark:text-teal-300"
                                  : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                              }`}
                            >
                              <Sliders size={12} />
                              {paramCount} paramètre{paramCount > 1 ? "s" : ""}
                            </span>
                          </td>
                          <td className="p-4 text-gray-800 dark:text-gray-200 font-semibold">
                            {editingTestId === test.id && editingTestField === "price" ? (
                              <input
                                type="number"
                                autoFocus
                                value={editingTestValue}
                                onChange={(e) => setEditingTestValue(e.target.value)}
                                onBlur={() => handleSaveTestInlineEdit(test)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveTestInlineEdit(test);
                                  if (e.key === "Escape") {
                                    setEditingTestId(null);
                                    setEditingTestField(null);
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-28 px-2 py-1 bg-white dark:bg-gray-900 border border-[#00a896] rounded outline-none text-sm font-semibold shadow-sm"
                              />
                            ) : (
                              <span
                                onDoubleClick={(e) => handleStartTestInlineEdit(test, "price", e)}
                                className="cursor-pointer hover:text-[#00a896] dark:hover:text-teal-400 hover:underline transition-colors select-none"
                                title="Double-cliquer pour modifier le prix"
                              >
                                {test.price.toLocaleString()} FCFA
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 text-xs rounded-full font-medium ${
                                test.is_active
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {test.is_active ? "Actif" : "Inactif"}
                            </span>
                          </td>
                          <td
                            className="p-4 flex justify-end gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenCreateParam(test.id)}
                              tooltip="Ajouter un paramètre à cet examen"
                              tooltipPosition="top"
                              className="text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30"
                              icon={<Plus size={18} />}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditTest(test)}
                              tooltip="Modifier la configuration de cet examen"
                              tooltipPosition="top"
                              className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              icon={<Edit3 size={18} />}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTest(test.id)}
                              disabled={deleteMutation.isPending}
                              tooltip="Supprimer cet examen et ses paramètres"
                              tooltipPosition="top"
                              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                              icon={<Trash2 size={18} />}
                            />
                          </td>
                        </tr>

                        {/* ACCORDION EXPANDED PARAMETERS SUB-TABLE */}
                        {isExpanded && (
                          <tr className="bg-slate-50/70 dark:bg-gray-900/60">
                            <td colSpan={8} className="p-4 pl-12">
                              <div className="border border-gray-200 dark:border-gray-700/80 rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300">
                                      Paramètres de l'examen ({paramCount})
                                    </span>
                                  </div>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleOpenCreateParam(test.id)}
                                    tooltip="Nouveau paramètre de mesure"
                                    tooltipPosition="left"
                                    icon={<Plus size={14} />}
                                  >
                                    Ajouter un paramètre
                                  </Button>
                                </div>

                                {!test.parameters ||
                                test.parameters.length === 0 ? (
                                  <div className="text-center py-6 text-xs text-gray-400 italic">
                                    Aucun paramètre configuré pour cet examen.
                                    Cliquez sur "+ Ajouter un paramètre"
                                    ci-dessus pour en créer un.
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                      <thead className="bg-gray-50/80 dark:bg-gray-900/40 text-gray-500 font-semibold border-b border-gray-100 dark:border-gray-700">
                                        <tr>
                                          <th className="p-2.5">
                                            <div className="flex items-center gap-1" title="Double-cliquer sur une cellule pour modifier">
                                              <span>Paramètre</span>
                                              <Edit3 size={12} className="text-[#00a896]" />
                                            </div>
                                          </th>
                                          <th className="p-2.5">Type</th>
                                          <th className="p-2.5">
                                            <div className="flex items-center gap-1" title="Double-cliquer sur une cellule pour modifier">
                                              <span>Unité</span>
                                              <Edit3 size={12} className="text-[#00a896]" />
                                            </div>
                                          </th>
                                          <th className="p-2.5">
                                            Valeurs de Référence
                                          </th>
                                          <th className="p-2.5 text-right">
                                            Actions
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                        {[...(test.parameters || [])]
                                           .sort((a, b) =>
                                             a.name.localeCompare(b.name, "fr", {
                                               sensitivity: "base",
                                             }),
                                           )
                                           .map((param, pIndex) => (
                                          <tr
                                            key={param.id}
                                            className={`transition-colors hover:bg-teal-50/40 dark:hover:bg-teal-900/20 ${
                                              pIndex % 2 === 0
                                                ? "bg-white dark:bg-gray-800/80"
                                                : "bg-slate-50/80 dark:bg-gray-900/40"
                                            }`}
                                          >
                                            <td className="p-2.5 font-medium text-slate-800 dark:text-gray-200">
                                              {editingParamId === param.id && editingParamField === "name" ? (
                                                <input
                                                  type="text"
                                                  autoFocus
                                                  value={editingParamValue}
                                                  onChange={(e) => setEditingParamValue(e.target.value)}
                                                  onBlur={() => handleSaveParamInlineEdit(param)}
                                                  onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleSaveParamInlineEdit(param);
                                                    if (e.key === "Escape") {
                                                      setEditingParamId(null);
                                                      setEditingParamField(null);
                                                    }
                                                  }}
                                                  className="w-full max-w-xs px-2 py-0.5 bg-white dark:bg-gray-900 border border-[#00a896] rounded outline-none text-xs font-medium shadow-sm"
                                                />
                                              ) : (
                                                <span
                                                  onDoubleClick={(e) => handleStartParamInlineEdit(param, "name", e)}
                                                  className="cursor-pointer hover:text-[#00a896] dark:hover:text-teal-400 hover:underline transition-colors select-none"
                                                  title="Double-cliquer pour modifier le nom"
                                                >
                                                  {param.name}
                                                </span>
                                              )}
                                            </td>
                                            <td className="p-2.5">
                                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                                {param.value_type ===
                                                  "numeric" && "Numérique"}
                                                {param.value_type ===
                                                  "string" && "Texte court"}
                                                {param.value_type === "text" &&
                                                  "Compte Rendu"}
                                                {param.value_type ===
                                                  "options" &&
                                                  "Choix multiples"}
                                                {param.value_type === "file" &&
                                                  "Fichier"}
                                              </span>
                                            </td>
                                            <td className="p-2.5 text-gray-500 font-mono">
                                              {editingParamId === param.id && editingParamField === "unit" ? (
                                                <input
                                                  type="text"
                                                  autoFocus
                                                  value={editingParamValue}
                                                  onChange={(e) => setEditingParamValue(e.target.value)}
                                                  onBlur={() => handleSaveParamInlineEdit(param)}
                                                  onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleSaveParamInlineEdit(param);
                                                    if (e.key === "Escape") {
                                                      setEditingParamId(null);
                                                      setEditingParamField(null);
                                                    }
                                                  }}
                                                  className="w-20 px-2 py-0.5 bg-white dark:bg-gray-900 border border-[#00a896] rounded outline-none text-xs font-mono shadow-sm"
                                                />
                                              ) : (
                                                <span
                                                  onDoubleClick={(e) => handleStartParamInlineEdit(param, "unit", e)}
                                                  className="cursor-pointer hover:text-[#00a896] dark:hover:text-teal-400 hover:underline transition-colors select-none"
                                                  title="Double-cliquer pour modifier l'unité"
                                                >
                                                  {param.unit || "-"}
                                                </span>
                                              )}
                                            </td>
                                            <td className="p-2.5">
                                              {renderReferenceSummary(param)}
                                            </td>
                                            <td className="p-2.5 flex justify-end gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenEditParam(param)}
                                                tooltip="Modifier les normes & détails du paramètre"
                                                tooltipPosition="top"
                                                className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1"
                                                icon={<Edit3 size={14} />}
                                              />
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteParam(param.id)}
                                                disabled={deleteParamMutation.isPending}
                                                tooltip="Supprimer ce paramètre"
                                                tooltipPosition="top"
                                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-1"
                                                icon={<Trash2 size={14} />}
                                              />
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {filteredTests.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        Aucun examen trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredTests.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
              onItemsPerPageChange={(limit) => setItemsPerPage(limit)}
            />
          </div>
        )}
      </div>

      {/* Modal Examen */}
      <LabTestForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          refetch();
        }}
        selectedTest={selectedTest}
        selectedCategoryOption={selectedCategoryOption}
      />

      {/* Modal Paramètre */}
      <LabParameterForm
        isOpen={isParamModalOpen}
        onClose={() => {
          setIsParamModalOpen(false);
          refetch();
        }}
        selectedParam={selectedParam}
        presetTestId={presetTestId}
      />
    </div>
  );
};

export default LabTests;
