import React, { useState } from "react";
import {
  Syringe,
  CheckCircle2,
  FileText,
  User,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  useLabRequests,
  useMarkAsSampled,
} from "../../../hooks/laboratory/useLabRequest";
import type { LabRequestDto } from "../../../types/types";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

const LabSampling = () => {
  // Only fetch requests that have been paid and are waiting for sampling
  const { data: requests = [], isLoading, isFetching } = useLabRequests("PAID");

  const markSampledMutation = useMarkAsSampled();

  const [selectedRequest, setSelectedRequest] = useState<LabRequestDto | null>(
    null,
  );

  const handleSelectRequest = (request: LabRequestDto) => {
    setSelectedRequest(request);
  };

  const handleConfirmSampling = async () => {
    if (!selectedRequest) return;

    const result = await Swal.fire({
      title: "Confirmer le prélèvement ?",
      text: "Avez-vous prélevé tous les tubes requis pour ce patient ?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#00a896",
      cancelButtonText: "Annuler",
      confirmButtonText: "Oui, confirmer",
    });

    if (result.isConfirmed) {
      markSampledMutation.mutate(selectedRequest.id, {
        onSuccess: (data) => {
          toast.success("Prélèvement enregistré avec succès");
          // Optionally, show a summary of generated barcodes
          const barcodes = data.samples.map((s) => s.barcode).join(", ");
          Swal.fire({
            title: "Tubes générés !",
            text: `Codes-barres générés : ${barcodes}`,
            icon: "success",
            confirmButtonColor: "#00a896",
          });
          setSelectedRequest(null);
        },
        onError: () => {
          toast.error("Erreur lors de l'enregistrement du prélèvement");
        },
      });
    }
  };

  // Calculate required tubes based on the lines
  const getRequiredTubes = (request: LabRequestDto) => {
    if (!request.lines) return [];
    const tubes = new Set<string>();
    request.lines.forEach((line) => {
      if (line.test?.sample_type_required) {
        tubes.add(line.test.sample_type_required);
      }
    });
    return Array.from(tubes);
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
          <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
            <Syringe size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Salle de Prélèvement
            </h1>
            <p className="text-sm text-gray-500">
              Patients en attente de prélèvement d'échantillons
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side: List of pending requests */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <Clock size={18} className="text-orange-500" />
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
                Aucun prélèvement en attente
              </h3>
              <p className="text-gray-500 mt-1">
                Tous les patients ont été traités.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => handleSelectRequest(request)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                    selectedRequest?.id === request.id
                      ? "bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800"
                      : "bg-white border-gray-100 hover:border-rose-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-rose-700"
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
                      <div className="flex gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <FileText size={14} /> REQ-{request.id}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />{" "}
                          {new Date(
                            request.created_at || "",
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {request.priority === "URGENT" && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1">
                        <AlertCircle size={14} /> URGENT
                      </span>
                    )}
                    <div className="text-right">
                      <div className="font-semibold text-slate-700 dark:text-gray-300">
                        {request.lines?.length} examens
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right side: Selected request details & Action */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-6">
            {selectedRequest ? (
              <div className="p-6">
                <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                    Détails du prélèvement
                  </h3>
                  <p className="text-sm text-gray-500">
                    Patient :{" "}
                    <span className="font-semibold text-slate-700 dark:text-gray-300">
                      {selectedRequest.patient?.first_name}{" "}
                      {selectedRequest.patient?.last_name}
                    </span>
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Syringe size={16} className="text-rose-500" />
                    Tubes à préparer
                  </h4>
                  <ul className="space-y-2">
                    {getRequiredTubes(selectedRequest).map((tube, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700"
                      >
                        <div className="w-2 h-8 bg-rose-500 rounded-full"></div>
                        <span className="font-medium text-slate-800 dark:text-gray-200">
                          {tube}
                        </span>
                      </li>
                    ))}
                    {getRequiredTubes(selectedRequest).length === 0 && (
                      <li className="text-sm text-gray-500 italic">
                        Aucun type de tube spécifique requis.
                      </li>
                    )}
                  </ul>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                    Examens prescrits
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto border border-gray-100 dark:border-gray-700">
                    <ul className="space-y-2 text-sm">
                      {selectedRequest.lines?.map((line) => (
                        <li
                          key={line.id}
                          className="flex justify-between border-b border-gray-100 dark:border-gray-800 last:border-0 pb-1 last:pb-0"
                        >
                          <span className="text-slate-700 dark:text-gray-300">
                            {line.test?.name}
                          </span>
                          <span className="text-gray-500 font-mono text-xs">
                            {line.test?.code}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={handleConfirmSampling}
                  disabled={markSampledMutation.isPending}
                  className="w-full bg-[#00a896] hover:bg-[#008f7e] text-white py-3 rounded-lg font-bold shadow-md shadow-teal-500/30 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {markSampledMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle2 size={20} />
                  )}
                  Confirmer le prélèvement
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Syringe
                  size={48}
                  className="mx-auto mb-4 text-gray-300 dark:text-gray-600"
                />
                <p>
                  Sélectionnez un patient dans la liste pour voir les détails et
                  effectuer le prélèvement.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabSampling;
