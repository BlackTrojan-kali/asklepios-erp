import React, { useState } from "react";
import {
  Microscope,
  CheckCircle2,
  FileText,
  User,
  Calendar,
  AlertCircle,
  Save,
  Beaker,
} from "lucide-react";
import {
  useLabRequests,
  useSaveLabResults,
} from "../../../hooks/laboratory/useLabRequest";
import type { LabRequestDto, LabResultDto } from "../../../types/types";
import toast from "react-hot-toast";

const LabResultsEntry = () => {
  // Fetch requests that have been sampled
  const { data: requests = [], isLoading } = useLabRequests("SAMPLED");
  const saveResultsMutation = useSaveLabResults();

  const [selectedRequest, setSelectedRequest] = useState<LabRequestDto | null>(
    null,
  );

  // State to hold the current input values: { [parameter_id]: value }
  const [resultsData, setResultsData] = useState<
    Record<number, string | number>
  >({});

  const handleSelectRequest = (request: LabRequestDto) => {
    setSelectedRequest(request);
    setResultsData({});
  };

  const handleInputChange = (parameterId: number, value: string) => {
    setResultsData((prev) => ({
      ...prev,
      [parameterId]: value,
    }));
  };

  const checkIsAbnormal = (
    val: string | number,
    min?: number,
    max?: number,
  ) => {
    if (!val || val === "") return false;
    const numVal = Number(val);
    if (isNaN(numVal)) return false;
    if (min !== undefined && min !== null && numVal < min) return true;
    if (max !== undefined && max !== null && numVal > max) return true;
    return false;
  };

  const handleSaveResults = () => {
    if (!selectedRequest) return;

    // Build the payload
    const payload: LabResultDto[] = [];

    selectedRequest.lines?.forEach((line) => {
      line.test?.parameters?.forEach((param) => {
        const val = resultsData[param.id];
        if (val !== undefined && val !== "") {
          payload.push({
            lab_request_line_id: line.id,
            lab_parameter_id: param.id,
            value_numeric: isNaN(Number(val)) ? undefined : Number(val),
            value_string: isNaN(Number(val)) ? String(val) : undefined,
          });
        }
      });
    });

    if (payload.length === 0) {
      toast.error("Veuillez saisir au moins un résultat");
      return;
    }

    saveResultsMutation.mutate(
      { id: selectedRequest.id, data: { results: payload } },
      {
        onSuccess: () => {
          toast.success("Résultats enregistrés avec succès");
          setSelectedRequest(null);
          setResultsData({});
        },
        onError: () => {
          toast.error("Erreur lors de l'enregistrement des résultats");
        },
      },
    );
  };

  const TableSkeleton = () => (
    <div className="animate-pulse space-y-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl"
        ></div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
            <Microscope size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Saisie des Résultats
            </h1>
            <p className="text-sm text-gray-500">
              Saisie des valeurs d'analyses pour les patients prélevés
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left side: List of pending requests */}
        <div className="xl:col-span-1 space-y-4">
          <h2 className="font-semibold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <Beaker size={18} className="text-purple-500" />
            En attente ({requests.length})
          </h2>

          {isLoading ? (
            <TableSkeleton />
          ) : requests.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm text-center border border-gray-100 dark:border-gray-700">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500 mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Aucune analyse en attente
              </h3>
              <p className="text-gray-500 mt-1">
                Tous les échantillons ont été analysés.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-2">
              {requests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => handleSelectRequest(request)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 ${
                    selectedRequest?.id === request.id
                      ? "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800"
                      : "bg-white border-gray-100 hover:border-purple-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-purple-700"
                  }`}
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white">
                        {request.patient?.first_name}{" "}
                        {request.patient?.last_name}
                      </h3>
                      <div className="text-xs text-gray-500 mt-1 flex gap-2">
                        <span>
                          {request.patient?.gender === "MALE"
                            ? "Homme"
                            : "Femme"}
                        </span>
                        <span>•</span>
                        <span>{request.patient?.patient_code}</span>
                        <span>•</span>
                        <span>REQ-{request.id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-gray-100 dark:border-gray-700 pt-2">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Calendar size={14} />{" "}
                      {new Date(request.created_at || "").toLocaleDateString()}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-gray-300">
                      {request.lines?.length} examens
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right side: Selected request details & Action */}
        <div className="xl:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-6">
            {selectedRequest ? (
              <div className="flex flex-col h-[85vh]">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <User size={24} className="text-purple-500" />
                    {selectedRequest.patient?.first_name}{" "}
                    {selectedRequest.patient?.last_name}
                  </h3>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>Code : {selectedRequest.patient?.patient_code}</span>
                    <span>Sexe : {selectedRequest.patient?.gender === "MALE" ? "Homme" : "Femme"}</span>
                    {selectedRequest.patient?.bith_date && (
                      <span>
                        Âge :{" "}
                        {new Date().getFullYear() -
                          new Date(
                            selectedRequest.patient.bith_date,
                          ).getFullYear()}{" "}
                        ans
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-gray-50/50 dark:bg-gray-900/50">
                  {selectedRequest.lines?.map((line) => (
                    <div
                      key={line.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm"
                    >
                      <div className="bg-gray-50 dark:bg-gray-800/80 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h4 className="font-bold text-slate-800 dark:text-white text-lg">
                          {line.test?.name}
                        </h4>
                        <span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                          {line.test?.code}
                        </span>
                      </div>

                      <div className="p-0">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase text-xs">
                            <tr>
                              <th className="px-4 py-3">Paramètre</th>
                              <th className="px-4 py-3 w-48">Résultat</th>
                              <th className="px-4 py-3">Unité</th>
                              <th className="px-4 py-3">
                                Valeurs de référence
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {line.test?.parameters?.map((param) => {
                              const isMale =
                                selectedRequest.patient?.gender === "MALE";
                              const min = isMale
                                ? param.reference_min_male
                                : param.reference_min_female;
                              const max = isMale
                                ? param.reference_max_male
                                : param.reference_max_female;
                              const val = resultsData[param.id] || "";
                              const abnormal = checkIsAbnormal(val, min, max);

                              return (
                                <tr
                                  key={param.id}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-gray-300">
                                    {param.name}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={val}
                                        onChange={(e) =>
                                          handleInputChange(
                                            param.id,
                                            e.target.value,
                                          )
                                        }
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                                          abnormal
                                            ? "border-red-300 bg-red-50 text-red-700 focus:ring-red-200 focus:border-red-400 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                                            : "border-gray-300 focus:ring-purple-100 focus:border-purple-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        }`}
                                        placeholder="Valeur..."
                                      />
                                      {abnormal && (
                                        <AlertCircle
                                          className="absolute right-3 top-2.5 text-red-500"
                                          size={16}
                                        />
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-gray-500">
                                    {param.unit}
                                  </td>
                                  <td className="px-4 py-3 text-gray-500 text-xs">
                                    {min !== null && max !== null ? (
                                      <span>
                                        [{min} - {max}]
                                      </span>
                                    ) : param.reference_text ? (
                                      <span>{param.reference_text}</span>
                                    ) : (
                                      <span className="italic">N/A</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            {(!line.test?.parameters ||
                              line.test.parameters.length === 0) && (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-4 py-6 text-center text-gray-500 italic"
                                >
                                  Aucun paramètre configuré pour cet examen.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <button
                    onClick={handleSaveResults}
                    disabled={saveResultsMutation.isPending}
                    className="w-full bg-[#003366] hover:bg-[#002244] text-white py-3 rounded-lg font-bold shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {saveResultsMutation.isPending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save size={20} />
                    )}
                    Enregistrer les résultats
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 h-full flex flex-col items-center justify-center text-gray-400">
                <Microscope
                  size={64}
                  className="mb-4 text-gray-200 dark:text-gray-700"
                />
                <p className="text-lg">
                  Sélectionnez un patient pour saisir ses résultats.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabResultsEntry;
