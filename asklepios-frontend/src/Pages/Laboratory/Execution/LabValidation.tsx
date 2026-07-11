import React, { useState } from "react";
import {
  FileCheck,
  CheckCircle2,
  User,
  Calendar,
  AlertTriangle,
  Download,
  Stethoscope,
} from "lucide-react";
import {
  useLabRequests,
  useValidateLabResults,
  useDownloadLabResultsPdf,
} from "../../../hooks/laboratory/useLabRequest";
import type { LabRequestDto } from "../../../types/types";
import toast from "react-hot-toast";

const LabValidation = () => {
  // Fetch requests that are COMPLETED (ready for validation) or VALIDATED (already validated, to print PDF)
  const { data: requests = [], isLoading } = useLabRequests();
  const validateMutation = useValidateLabResults();
  const downloadMutation = useDownloadLabResultsPdf();

  const [selectedRequest, setSelectedRequest] = useState<LabRequestDto | null>(
    null,
  );

  // Filter requests: we want COMPLETED and VALIDATED
  const validationRequests = requests.filter(
    (r) => r.status === "COMPLETED" || r.status === "VALIDATED",
  );

  const handleSelectRequest = (request: LabRequestDto) => {
    setSelectedRequest(request);
  };

  const handleValidate = () => {
    if (!selectedRequest) return;

    validateMutation.mutate(selectedRequest.id, {
      onSuccess: () => {
        toast.success("Dossier validé avec succès");
        setSelectedRequest((prev) =>
          prev ? { ...prev, status: "VALIDATED" } : null,
        );
      },
      onError: () => {
        toast.error("Erreur lors de la validation du dossier");
      },
    });
  };

  const handleDownloadPdf = () => {
    if (!selectedRequest) return;
    downloadMutation.mutate(selectedRequest.id, {
      onSuccess: () => {
        toast.success("Téléchargement du PDF en cours...");
      },
      onError: () => {
        toast.error("Erreur lors de la génération du PDF");
      },
    });
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
          <div className="p-2 bg-green-100 text-green-600 rounded-lg">
            <FileCheck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Validation Biologiste
            </h1>
            <p className="text-sm text-gray-500">
              Vérification et validation des résultats d'analyses saisis
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left side: List of requests */}
        <div className="xl:col-span-1 space-y-4">
          <h2 className="font-semibold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <Stethoscope size={18} className="text-green-500" />
            Dossiers à vérifier ({validationRequests.length})
          </h2>

          {isLoading ? (
            <TableSkeleton />
          ) : validationRequests.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm text-center border border-gray-100 dark:border-gray-700">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500 mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Aucun dossier en attente
              </h3>
              <p className="text-gray-500 mt-1">
                Tous les résultats ont été validés.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-2">
              {validationRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => handleSelectRequest(request)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 ${
                    selectedRequest?.id === request.id
                      ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                      : "bg-white border-gray-100 hover:border-green-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-green-700"
                  }`}
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {request.patient?.first_name}{" "}
                        {request.patient?.last_name}
                        {request.status === "VALIDATED" && (
                          <CheckCircle2 size={16} className="text-green-500" />
                        )}
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
                    <span
                      className={`font-semibold px-2 py-1 rounded text-xs ${
                        request.status === "VALIDATED"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {request.status === "VALIDATED" ? "Validé" : "À Valider"}
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
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <User size={24} className="text-green-500" />
                      {selectedRequest.patient?.first_name}{" "}
                      {selectedRequest.patient?.last_name}
                    </h3>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>
                        Code : {selectedRequest.patient?.patient_code}
                      </span>
                      <span>
                        Sexe :{" "}
                        {selectedRequest.patient?.gender === "MALE"
                          ? "Homme"
                          : "Femme"}
                      </span>
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
                  {selectedRequest.status === "VALIDATED" && (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold flex items-center gap-2">
                      <CheckCircle2 size={18} />
                      Dossier Validé
                    </span>
                  )}
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
                              <th className="px-4 py-3">Résultat</th>
                              <th className="px-4 py-3">Unité</th>
                              <th className="px-4 py-3">
                                Valeurs de référence
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {line.test?.parameters?.map((param) => {
                              const result = line.results?.find(
                                (r) => r.lab_parameter_id === param.id,
                              );
                              const val = result
                                ? (result.value_numeric ?? result.value_string)
                                : "-";
                              const isAbnormal = result?.is_abnormal;

                              const isMale =
                                selectedRequest.patient?.gender === "MALE";
                              const min = isMale
                                ? param.reference_min_male
                                : param.reference_min_female;
                              const max = isMale
                                ? param.reference_max_male
                                : param.reference_max_female;

                              return (
                                <tr
                                  key={param.id}
                                  className={`transition-colors ${isAbnormal ? "bg-red-50/50 dark:bg-red-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}
                                >
                                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-gray-300">
                                    {param.name}
                                  </td>
                                  <td className="px-4 py-3 font-semibold">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={
                                          isAbnormal
                                            ? "text-red-600 dark:text-red-400"
                                            : "text-slate-800 dark:text-white"
                                        }
                                      >
                                        {val}
                                      </span>
                                      {isAbnormal ? (
                                        <AlertTriangle
                                          size={16}
                                          className="text-red-500"
                                        />
                                      ) : (
                                        <CheckCircle2
                                          size={16}
                                          className="text-green-500"
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
                                  Aucun paramètre configuré.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-4">
                  {selectedRequest.status === "COMPLETED" ? (
                    <button
                      onClick={handleValidate}
                      disabled={validateMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      {validateMutation.isPending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <CheckCircle2 size={20} />
                      )}
                      Valider le Dossier
                    </button>
                  ) : (
                    <button
                      onClick={handleDownloadPdf}
                      disabled={downloadMutation.isPending}
                      className="w-full bg-[#003366] hover:bg-[#002244] text-white py-3 rounded-lg font-bold shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      {downloadMutation.isPending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Download size={20} />
                      )}
                      Télécharger le Compte-Rendu PDF
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 h-full flex flex-col items-center justify-center text-gray-400">
                <FileCheck
                  size={64}
                  className="mb-4 text-gray-200 dark:text-gray-700"
                />
                <p className="text-lg">Sélectionnez un dossier à vérifier.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabValidation;
