import React, { useState } from "react";
import {
  TestTube,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  Image as ImageIcon,
  Building2,
  ExternalLink,
  FileText,
} from "lucide-react";

import api from "../../../../api/api";

const formatFileUrl = (path: string | null) => {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  const cleanPath = path.startsWith("storage/")
    ? path.replace(/^storage\//, "")
    : path;
  const baseUrl = (api.defaults.baseURL || "http://localhost:8000/api").replace(
    /\/api\/?$/,
    "",
  );
  return `${baseUrl}/storage/${cleanPath}`;
};

interface PrescribedExamAccordionItemProps {
  examName: string;
  examLine?: any;
  labRequests: any[];
  patientGender?: string;
  onPreviewImage?: (imageUrl: string) => void;
  onDownloadPdf?: (reqId: number) => void;
}

export const PrescribedExamAccordionItem: React.FC<
  PrescribedExamAccordionItemProps
> = ({
  examName,
  examLine,
  labRequests,
  patientGender,
  onPreviewImage,
  onDownloadPdf,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Chercher si cet examen correspond à une requête de laboratoire interne
  const matchingReqLine = React.useMemo(() => {
    for (const req of labRequests) {
      if (req.lines) {
        for (const line of req.lines) {
          if (
            line.test?.name &&
            line.test.name.toLowerCase().trim() ===
              examName.toLowerCase().trim()
          ) {
            return { req, line };
          }
        }
      }
    }
    return null;
  }, [labRequests, examName]);

  const req = matchingReqLine?.req;
  const line = matchingReqLine?.line;
  const isMale = patientGender?.toLowerCase().includes("m");

  // Déterminer la provenance et le statut
  const isExternal = Boolean(
    (req &&
      req.external_prescriber_name &&
      req.external_prescriber_name.trim() !== "") ||
    (examLine &&
      (examLine.document_url ||
        (examLine.result_notes && examLine.result_notes.includes("externe")))),
  );

  const isValidated = req?.status === "VALIDATED";
  const isSampled = req?.status === "SAMPLED";

  const getBadge = () => {
    if (isValidated) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <CheckCircle2 size={12} /> 🟢 Résultat Validé
        </span>
      );
    }
    if (isSampled) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/90 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
          <Clock size={12} /> 🔵 Prélèvement Effectué
        </span>
      );
    }
    if (isExternal) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <Building2 size={12} /> 🟠 Examen Externe / Autre Labo
        </span>
      );
    }
    if (req) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/90 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
          <Clock size={12} /> En Cours au Laboratoire
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-gray-300 border border-slate-200 dark:border-gray-700">
        ⚪ Prescrit (Non encore facturé / Externe)
      </span>
    );
  };

  const test = line?.test;
  const numericParams =
    test?.parameters?.filter(
      (p: any) => p.value_type !== "text" && p.value_type !== "file",
    ) || [];
  const textParams =
    test?.parameters?.filter((p: any) => p.value_type === "text") || [];
  const fileParams =
    test?.parameters?.filter((p: any) => p.value_type === "file") || [];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-purple-100 dark:border-gray-800 shadow-xs overflow-hidden transition-all">
      {/* Header cliquable */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-purple-50/50 dark:hover:bg-gray-800/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
              isValidated
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : isExternal
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
            }`}
          >
            <TestTube size={18} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                {examName}
              </h4>
              {getBadge()}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {examLine?.result_notes
                ? `Note : ${examLine.result_notes}`
                : isValidated
                  ? `Résultats validés par le biologiste • Cliquez pour dérouler`
                  : `Cliquez pour voir les détails d'analyse`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isValidated && req?.id && onDownloadPdf && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownloadPdf(req.id);
              }}
              className="px-2.5 py-1 text-xs font-bold bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-lg transition-colors border border-teal-200 dark:border-teal-800 flex items-center gap-1"
            >
              <Download size={13} /> PDF
            </button>
          )}
          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Contenu Déroulé des Résultats */}
      {isOpen && (
        <div className="border-t border-purple-100 dark:border-gray-800 p-4 bg-slate-50/60 dark:bg-gray-950/70 space-y-3 animate-fadeIn">
          {/* CAS 1 : Résultats de laboratoire interne enregistrés */}
          {line && (
            <>
              {/* Paramètres Numériques / Choix */}
              {numericParams.length > 0 && (
                <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-2">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-b dark:border-gray-700">
                        <th className="p-2 font-bold">Paramètre</th>
                        <th className="p-2 font-bold">Résultat Mesuré</th>
                        <th className="p-2 font-bold">Unité</th>
                        <th className="p-2 font-bold">Bornes de Référence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {numericParams.map((param: any) => {
                        const res = line.results?.find(
                          (r: any) => r.lab_parameter_id === param.id,
                        );
                        const min = isMale
                          ? param.reference_min_male
                          : param.reference_min_female;
                        const max = isMale
                          ? param.reference_max_male
                          : param.reference_max_female;
                        const val = res
                          ? (res.value_numeric ?? res.value_string ?? "-")
                          : "-";
                        const isAbnormal =
                          res?.is_abnormal === 1 ||
                          res?.is_abnormal === true ||
                          res?.is_abnormal === "1";

                        return (
                          <tr
                            key={param.id}
                            className="hover:bg-slate-50 dark:hover:bg-gray-800/80"
                          >
                            <td className="p-2 font-medium text-gray-800 dark:text-gray-200">
                              {param.name}
                            </td>
                            <td className="p-2">
                              <span
                                className={`font-mono font-bold ${isAbnormal ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"}`}
                              >
                                {val}
                              </span>
                              {isAbnormal ? (
                                <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800">
                                  <AlertTriangle size={10} /> ANOMALIE
                                </span>
                              ) : null}
                            </td>
                            <td className="p-2 text-gray-500 dark:text-gray-400">
                              {param.unit || "-"}
                            </td>
                            <td className="p-2 text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                              {min !== null && max !== null
                                ? `[${min} - ${max}]`
                                : param.reference_text || "N/A"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Comptes Rendus Textuels */}
              {textParams.map((param: any) => {
                const res = line.results?.find(
                  (r: any) => r.lab_parameter_id === param.id,
                );
                return (
                  <div
                    key={param.id}
                    className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
                  >
                    <span className="text-xs font-bold text-[#003366] dark:text-teal-400 block mb-1">
                      • {param.name} (Compte Rendu / Observation) :
                    </span>
                    <p className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed font-mono">
                      {res?.value_text ||
                        "Aucune observation saisie par le laboratoire."}
                    </p>
                  </div>
                );
              })}

              {/* Pièces jointes / Clichés */}
              {fileParams.map((param: any) => {
                const res = line.results?.find(
                  (r: any) => r.lab_parameter_id === param.id,
                );
                return (
                  <div
                    key={param.id}
                    className="flex items-center justify-between p-2.5 bg-teal-50/50 dark:bg-teal-950/40 rounded-lg border border-teal-100 dark:border-teal-900/60 text-xs"
                  >
                    <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <ImageIcon
                        size={14}
                        className="text-teal-600 dark:text-teal-400"
                      />
                      {param.name}
                    </span>
                    {res?.file_path ? (
                      <button
                        onClick={() =>
                          onPreviewImage &&
                          onPreviewImage(formatFileUrl(res.file_path))
                        }
                        className="flex items-center gap-1 px-2.5 py-1 bg-[#00a896] hover:bg-[#008f80] text-white rounded text-[11px] font-bold transition-colors shadow-sm"
                      >
                        <ImageIcon size={12} /> Prévisualiser le Cliché
                      </button>
                    ) : (
                      <span className="text-gray-400 italic">
                        Aucun fichier joint
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* CAS 2 & 3 : Notes ou documents externes */}
          {(!line ||
            isExternal ||
            (examLine && (examLine.result_notes || examLine.document_url))) && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-amber-200 dark:border-amber-900/60 p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                <FileText size={14} /> Observations & Documents d'Examens
                (Saisie Externe) :
              </div>
              {examLine?.result_notes && (
                <p className="text-gray-700 dark:text-gray-300 bg-amber-50/50 dark:bg-amber-950/40 p-2.5 rounded border border-amber-100 dark:border-amber-900/40 font-mono">
                  {examLine.result_notes}
                </p>
              )}
              {examLine?.document_url && (
                <a
                  href={examLine.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  <ExternalLink size={13} /> Ouvrir le document joint scanné
                </a>
              )}
              {!line && !examLine?.result_notes && !examLine?.document_url && (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  Aucun résultat biologique n'a été transmis par le laboratoire
                  interne pour cet examen.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
