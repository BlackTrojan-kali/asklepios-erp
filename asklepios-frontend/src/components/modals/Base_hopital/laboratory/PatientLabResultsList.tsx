import React, { useEffect, useState, useCallback } from "react";
import {
  TestTube,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  Filter,
  Stethoscope,
  Building2
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../../api/api";

const formatFileUrl = (path: string | null) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('storage/') ? path.replace(/^storage\//, '') : path;
  const baseUrl = (api.defaults.baseURL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');
  return `${baseUrl}/storage/${cleanPath}`;
};

interface PatientLabResultsListProps {
  patientId: number;
  patientVisitId?: number;
  consultationExams?: any[];
  defaultScope?: 'THIS_CONSULTATION' | 'EXTERNAL' | 'ALL';
  onPreviewImage?: (imageUrl: string) => void;
}

export const PatientLabResultsList: React.FC<PatientLabResultsListProps> = ({
  patientId,
  patientVisitId,
  consultationExams = [],
  defaultScope = 'THIS_CONSULTATION',
  onPreviewImage,
}) => {
  const [labRequests, setLabRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedReqId, setExpandedReqId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [scopeFilter, setScopeFilter] = useState<'THIS_CONSULTATION' | 'EXTERNAL' | 'ALL'>(defaultScope);

  const fetchPatientLabRequests = useCallback(async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      const res = await api.get("/laboratory/requests", {
        params: { patient_id: patientId },
      });
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setLabRequests(data);
      if (data.length > 0) {
        setExpandedReqId(data[0].id); // Déplier la plus récente par défaut
      }
    } catch (error) {
      console.error("Erreur chargement résultats labo :", error);
      toast.error("Impossible de charger les résultats de laboratoire.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatientLabRequests();
  }, [fetchPatientLabRequests]);

  // Noms d'examens prescrits dans cette consultation
  const prescribedExamNames = React.useMemo(() => {
    const names = new Set<string>();
    consultationExams.forEach((exam: any) => {
      if (exam.exam_name) names.add(exam.exam_name.toLowerCase());
      if (exam.exam_request_lines) {
        exam.exam_request_lines.forEach((l: any) => {
          if (l.exam_name) names.add(l.exam_name.toLowerCase());
        });
      }
    });
    return names;
  }, [consultationExams]);

  // Déterminer si une requête appartient à cette consultation
  const isFromThisConsultation = useCallback((req: any) => {
    if (patientVisitId && req.patient_visit_id && Number(req.patient_visit_id) === Number(patientVisitId)) {
      return true;
    }
    if (prescribedExamNames.size > 0 && req.lines) {
      return req.lines.some((l: any) => 
        l.test?.name && prescribedExamNames.has(l.test.name.toLowerCase())
      );
    }
    return false;
  }, [patientVisitId, prescribedExamNames]);

  // Déterminer si une requête est externe
  const isExternalRequest = useCallback((req: any) => {
    return Boolean(req.external_prescriber_name && req.external_prescriber_name.trim() !== "");
  }, []);

  const handleDownloadPdf = async (reqId: number) => {
    try {
      toast.loading("Génération du bulletin PDF...", { id: "pdf-gen" });
      const response = await api.get(`/laboratory/requests/${reqId}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Bulletin_Analyses_REQ-${reqId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Bulletin PDF téléchargé !", { id: "pdf-gen" });
    } catch (err) {
      toast.error("Erreur lors de l'impression du bulletin.", {
        id: "pdf-gen",
      });
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedReqId(expandedReqId === id ? null : id);
  };

  // Filtrage combiné (Portée + Statut + Recherche)
  const filteredRequests = labRequests.filter((req) => {
    // 1. Filtrage par portée (Cette consultation, Externe, Tous)
    let matchesScope = true;
    if (scopeFilter === 'THIS_CONSULTATION') {
      matchesScope = isFromThisConsultation(req);
    } else if (scopeFilter === 'EXTERNAL') {
      matchesScope = isExternalRequest(req);
    }

    // 2. Filtrage par statut
    const matchesStatus = statusFilter === "ALL" || req.status === statusFilter;

    // 3. Recherche texte
    const matchesSearch =
      !searchTerm ||
      req.lines?.some(
        (l: any) =>
          l.test?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.test?.code?.toLowerCase().includes(searchTerm.toLowerCase()),
      ) ||
      String(req.id).includes(searchTerm) ||
      (req.external_prescriber_name && req.external_prescriber_name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesScope && matchesStatus && matchesSearch;
  });

  // Calcul du nombre d'examens par catégorie
  const countThisConsult = labRequests.filter(isFromThisConsultation).length;
  const countExternal = labRequests.filter(isExternalRequest).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VALIDATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 size={13} /> Validé par Biologiste
          </span>
        );
      case "SAMPLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <Clock size={13} /> Prélèvements Effectués
          </span>
        );
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <Clock size={13} /> En Attente de Prélèvement
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock size={13} /> {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* BARRE DE SÉLECTION DE LA PORTÉE (FILTRE PRINCIPAL) */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-gray-800/90 p-1.5 rounded-xl border border-slate-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setScopeFilter('THIS_CONSULTATION')}
          className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            scopeFilter === 'THIS_CONSULTATION'
              ? 'bg-[#00a896] text-white shadow-sm'
              : 'text-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700'
          }`}
        >
          <Stethoscope size={14} /> Cette Consultation ({countThisConsult})
        </button>

        <button
          type="button"
          onClick={() => setScopeFilter('EXTERNAL')}
          className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            scopeFilter === 'EXTERNAL'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700'
          }`}
        >
          <Building2 size={14} /> Prescriptions Externes ({countExternal})
        </button>

        <button
          type="button"
          onClick={() => setScopeFilter('ALL')}
          className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            scopeFilter === 'ALL'
              ? 'bg-[#003366] text-white dark:bg-blue-600 shadow-sm'
              : 'text-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700'
          }`}
        >
          <Filter size={14} /> Tout l'Historique ({labRequests.length})
        </button>
      </div>

      {/* HEADER & FILTRES SECONDAIRES */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 dark:bg-gray-800/60 p-3 rounded-xl border border-slate-200 dark:border-gray-700">
        <div className="relative w-full sm:w-64">
          <Search
            className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500"
            size={16}
          />
          <input
            type="text"
            placeholder="Rechercher par nom d'examen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#00a896] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === "ALL"
                ? "bg-slate-700 text-white dark:bg-gray-600"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Tous statuts
          </button>
          <button
            onClick={() => setStatusFilter("VALIDATED")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === "VALIDATED"
                ? "bg-emerald-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Validés uniquement
          </button>
          <button
            onClick={fetchPatientLabRequests}
            title="Rafraîchir"
            className="p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors ml-auto"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* LISTE DES DEMANDES D'EXAMENS */}
      {loading ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-xs">
          Chargement des résultats de laboratoire...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
          <TestTube
            className="mx-auto text-gray-400 dark:text-gray-600"
            size={36}
          />
          <div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {scopeFilter === 'THIS_CONSULTATION'
                ? "Aucun résultat d'analyse trouvé spécifiquement pour cette consultation."
                : scopeFilter === 'EXTERNAL'
                ? "Aucun examen prescrit hors de l'hôpital n'a été enregistré."
                : "Aucun résultat de laboratoire disponible."}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Si l'examen a été prescrit sous une autre séance ou hors de l'hôpital, basculez vers "Tout l'Historique".
            </p>
          </div>
          {scopeFilter !== 'ALL' && (
            <button
              onClick={() => setScopeFilter('ALL')}
              className="px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <Filter size={13} /> Afficher tout l'historique des examens du patient
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const isExpanded = expandedReqId === req.id;
            const isMale = req.patient?.gender?.toLowerCase().includes("m");
            const isThisConsult = isFromThisConsultation(req);
            const isExternal = isExternalRequest(req);

            return (
              <div
                key={req.id}
                className={`bg-white dark:bg-gray-800/90 rounded-xl border shadow-sm overflow-hidden transition-all duration-200 ${
                  isThisConsult 
                    ? 'border-teal-300 dark:border-teal-800/80 ring-1 ring-teal-400/30' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* En-tête de carte résumé */}
                <div
                  onClick={() => toggleExpand(req.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isThisConsult 
                        ? 'bg-teal-100 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300' 
                        : isExternal 
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      <TestTube size={20} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                          Demande N° REQ-{String(req.id).padStart(5, "0")}
                        </h4>
                        {getStatusBadge(req.status)}
                        
                        {/* Badges de provenance */}
                        {isThisConsult && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-teal-500 text-white shadow-xs">
                            🎯 Cette Consultation
                          </span>
                        )}
                        {isExternal && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500 text-white shadow-xs">
                            🩺 Externe : {req.external_prescriber_name}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Prélèvement le {new Date(req.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {req.profile_doctor?.user &&
                          ` • Prescrit par Dr. ${req.profile_doctor.user.last_name || ""} ${req.profile_doctor.user.first_name}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {req.status === "VALIDATED" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPdf(req.id);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-lg text-xs font-bold transition-colors border border-teal-200 dark:border-teal-800"
                      >
                        <Download size={14} /> Bulletin PDF
                      </button>
                    )}
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      {isExpanded ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Détails dépliables de l'examen */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700/80 p-4 bg-slate-50/50 dark:bg-gray-850/50 space-y-4">
                    {req.lines?.map((line: any) => {
                      const test = line.test;
                      const numericParams =
                        test?.parameters?.filter(
                          (p: any) =>
                            p.value_type !== "text" && p.value_type !== "file",
                        ) || [];
                      const textParams =
                        test?.parameters?.filter(
                          (p: any) => p.value_type === "text",
                        ) || [];
                      const fileParams =
                        test?.parameters?.filter(
                          (p: any) => p.value_type === "file",
                        ) || [];

                      return (
                        <div
                          key={line.id}
                          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3"
                        >
                          {/* Examen Name */}
                          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                            <h5 className="font-bold text-xs uppercase tracking-wider text-[#003366] dark:text-blue-400 flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-[#00a896]"></span>
                              {test?.name || "Examen sans nom"}
                              {test?.code && (
                                <span className="text-gray-400 font-mono text-[10px]">
                                  [{test.code}]
                                </span>
                              )}
                            </h5>
                            {test?.category && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                {test.category.name}
                              </span>
                            )}
                          </div>

                          {/* Parameters Table */}
                          {numericParams.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border-b dark:border-gray-700">
                                    <th className="p-2 font-bold">Paramètre</th>
                                    <th className="p-2 font-bold">Résultat</th>
                                    <th className="p-2 font-bold">Unité</th>
                                    <th className="p-2 font-bold">
                                      Valeurs Référence
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                                  {numericParams.map((param: any) => {
                                    const res = line.results?.find(
                                      (r: any) =>
                                        r.lab_parameter_id === param.id,
                                    );
                                    const min = isMale
                                      ? param.reference_min_male
                                      : param.reference_min_female;
                                    const max = isMale
                                      ? param.reference_max_male
                                      : param.reference_max_female;
                                    const val = res
                                      ? (res.value_numeric ??
                                        res.value_string ??
                                        "-")
                                      : "-";
                                    const isAbnormal = res?.is_abnormal;

                                    return (
                                      <tr
                                        key={param.id}
                                        className="hover:bg-slate-50 dark:hover:bg-gray-750"
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
                                          {isAbnormal && (
                                            <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800">
                                              <AlertTriangle size={10} />{" "}
                                              ANOMALIE
                                            </span>
                                          )}
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

                          {/* Text Reports */}
                          {textParams.map((param: any) => {
                            const res = line.results?.find(
                              (r: any) => r.lab_parameter_id === param.id,
                            );
                            return (
                              <div
                                key={param.id}
                                className="p-3 bg-slate-50 dark:bg-gray-900/60 rounded-lg border border-slate-200 dark:border-gray-700"
                              >
                                <span className="text-xs font-bold text-[#003366] dark:text-blue-400 block mb-1">
                                  • {param.name} (Compte Rendu) :
                                </span>
                                <p className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed font-mono">
                                  {res?.value_text ||
                                    "Aucune observation saisie."}
                                </p>
                              </div>
                            );
                          })}

                          {/* File Attachments */}
                          {fileParams.map((param: any) => {
                            const res = line.results?.find(
                              (r: any) => r.lab_parameter_id === param.id,
                            );
                            return (
                              <div
                                key={param.id}
                                className="flex items-center justify-between p-2.5 bg-teal-50/50 dark:bg-teal-950/20 rounded-lg border border-teal-100 dark:border-teal-900/50 text-xs"
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
                                    <ImageIcon size={12} /> Prévisualiser le
                                    Cliché
                                  </button>
                                ) : (
                                  <span className="text-gray-400 italic">
                                    Aucun fichier joint
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
