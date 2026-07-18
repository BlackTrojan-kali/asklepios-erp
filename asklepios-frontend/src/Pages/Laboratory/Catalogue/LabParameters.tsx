import React, { useState, useMemo } from "react";
import { Database, Plus, Edit3, Trash2, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";
import Select from "react-select";
import {
  useLabParameters,
  useCreateLabParameter,
  useUpdateLabParameter,
  useDeleteLabParameter,
} from "../../../hooks/laboratory/useLabParameter";
import { useLabTests } from "../../../hooks/laboratory/useLabTest";
import type { LabParameterDto } from "../../../types/types";
import toast from "react-hot-toast";
import LabParameterForm from "../../../components/modals/Laboratory/LabParameterForm";

const LabParameters = () => {
  // UI State
  const [selectedTestOption, setSelectedTestOption] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParam, setSelectedParam] = useState<LabParameterDto | null>(
    null,
  );

  // Tanstack Hooks
  const { data: tests = [], isLoading: isLoadingTests } = useLabTests();
  const {
    data: parameters = [],
    isLoading: isLoadingParams,
    refetch,
    isFetching,
  } = useLabParameters(selectedTestOption?.value);

  const deleteMutation = useDeleteLabParameter();

  const testOptions = useMemo(
    () => tests.map((t) => ({ value: t.id, label: `${t.code} - ${t.name}` })),
    [tests],
  );

  const handleFilterChange = (option: any) => {
    setSelectedTestOption(option);
  };

  const handleOpenCreate = () => {
    setSelectedParam(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (param: LabParameterDto) => {
    setSelectedParam(param);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Supprimer ce paramètre ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonText: "Annuler",
      confirmButtonText: "Oui, supprimer",
    });

    if (result.isConfirmed) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success("Paramètre supprimé avec succès"),
        onError: () => toast.error("Erreur lors de la suppression"),
      });
    }
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
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused
        ? document.documentElement.classList.contains("dark")
          ? "#374151"
          : "#f1f5f9"
        : "transparent",
      color: document.documentElement.classList.contains("dark")
        ? "white"
        : "black",
    }),
  };

  // Skeleton loader component
  const TableSkeleton = () => (
    <div className="animate-pulse">
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className="flex border-t border-gray-100 dark:border-gray-700 p-4 items-center"
        >
          <div className="w-1/4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-1"></div>
          </div>
          <div className="w-1/5">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-16"></div>
          </div>
          <div className="w-1/12">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-10"></div>
          </div>
          <div className="w-1/12 text-center">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto"></div>
          </div>
          <div className="w-1/12 text-center">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto"></div>
          </div>
          <div className="w-1/12 text-center">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto"></div>
          </div>
          <div className="w-1/12 text-center">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto"></div>
          </div>
          <div className="flex-1 flex justify-end gap-2">
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
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Database size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Paramètres d'Examens
            </h1>
            <p className="text-sm text-gray-500">
              Configurez les constantes mesurées (ex: Globules rouges,
              Hémoglobine...)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg"
          >
            <RefreshCw
              size={18}
              className={
                isFetching ? "animate-spin text-gray-500" : "text-gray-500"
              }
            />
          </button>

          <button
            onClick={handleOpenCreate}
            disabled={isLoadingTests}
            className="flex items-center gap-2 bg-[#00a896] hover:bg-[#008f7e] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus size={18} />
            Nouveau Paramètre
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="max-w-md">
          <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
            Filtrer par Examen
          </label>
          {isLoadingTests ? (
            <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
          ) : (
            <Select
              options={testOptions}
              value={selectedTestOption}
              onChange={handleFilterChange}
              placeholder="Tous les examens"
              isClearable
              styles={selectStyles}
            />
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {isLoadingParams ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">
                    Paramètre
                  </th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">
                    Examen
                  </th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">
                    Unité
                  </th>
                  <th
                    className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-center"
                    colSpan={2}
                  >
                    Réf. Homme
                  </th>
                  <th
                    className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-center"
                    colSpan={2}
                  >
                    Réf. Femme
                  </th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">
                    Actions
                  </th>
                </tr>
                <tr className="text-xs text-gray-400 bg-gray-50/50 dark:bg-gray-900/20">
                  <th colSpan={3}></th>
                  <th className="p-2 text-center border-t border-gray-100 dark:border-gray-700">
                    Min
                  </th>
                  <th className="p-2 text-center border-t border-gray-100 dark:border-gray-700">
                    Max
                  </th>
                  <th className="p-2 text-center border-t border-gray-100 dark:border-gray-700">
                    Min
                  </th>
                  <th className="p-2 text-center border-t border-gray-100 dark:border-gray-700">
                    Max
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {parameters.map((param) => (
                  <tr
                    key={param.id}
                    className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-4 text-gray-800 dark:text-gray-200 font-medium">
                      {param.name}
                    </td>
                    <td className="p-4 text-gray-500">
                      {param.test?.code} - {param.test?.name}
                    </td>
                    <td className="p-4 text-gray-500 font-mono text-sm">
                      {param.unit}
                    </td>
                    <td className="p-4 text-center text-gray-600 dark:text-gray-300">
                      {param.reference_min_male ?? "-"}
                    </td>
                    <td className="p-4 text-center text-gray-600 dark:text-gray-300">
                      {param.reference_max_male ?? "-"}
                    </td>
                    <td className="p-4 text-center text-gray-600 dark:text-gray-300">
                      {param.reference_min_female ?? "-"}
                    </td>
                    <td className="p-4 text-center text-gray-600 dark:text-gray-300">
                      {param.reference_max_female ?? "-"}
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(param)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(param.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {parameters.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      Aucun paramètre trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LabParameterForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedParam={selectedParam}
      />
    </div>
  );
};

export default LabParameters;
