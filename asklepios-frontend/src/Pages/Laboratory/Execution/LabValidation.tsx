import React, { useState, useMemo } from "react";
import {
  FileCheck,
  CheckCircle2,
  User,
  Calendar,
  AlertTriangle,
  Download,
  Stethoscope,
  Search,
  Eye,
  FileText,
  Image as ImageIcon,
  Beaker,
  Clock,
  CheckSquare,
} from "lucide-react";
import {
  useLabRequests,
  useValidateLabResults,
  useDownloadLabResultsPdf,
} from "../../../hooks/laboratory/useLabRequest";
import type { LabRequestDto } from "../../../types/types";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { Button } from "../../../components/common/Button";
import { ImagePreviewModal } from "../../../components/modals/Base_hopital/laboratory/ImagePreviewModal";

const LabValidation = () => {
  // Fetch requests that are COMPLETED or VALIDATED
  const { data: requests = [], isLoading } = useLabRequests();
  const validateMutation = useValidateLabResults();
  const downloadMutation = useDownloadLabResultsPdf();

  const [selectedRequest, setSelectedRequest] = useState<LabRequestDto | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "VALIDATED">("PENDING");

  // Modale Lightbox pour zoom sur cliché/image
  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");

  // Demandes prêtes pour validation ou validées
  const validationRequests = useMemo(() => {
    return requests.filter((r) => {
      if (r.status !== "COMPLETED" && r.status !== "VALIDATED") return false;

      // Filtre statut
      if (statusFilter === "PENDING" && r.status !== "COMPLETED") return false;
      if (statusFilter === "VALIDATED" && r.status !== "VALIDATED") return false;

      // Filtre recherche
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const patientName = `${r.patient?.first_name || ""} ${r.patient?.last_name || ""}`.toLowerCase();
      const patientCode = (r.patient?.patient_code || "").toLowerCase();
      const reqId = `req-${r.id}`.toLowerCase();
      const testNames = (r.lines || []).map(l => l.test?.name || "").join(" ").toLowerCase();

      return patientName.includes(q) || patientCode.includes(q) || reqId.includes(q) || testNames.includes(q);
    });
  }, [requests, statusFilter, searchQuery]);

  const handleSelectRequest = (request: LabRequestDto) => {
    setSelectedRequest(request);
  };

  const handleOpenImageZoom = (imageSrc: string, title: string) => {
    setPreviewImageSrc(imageSrc);
    setPreviewTitle(title);
    setIsPreviewModalOpen(true);
  };

  const handleValidate = async () => {
    if (!selectedRequest) return;

    const confirmResult = await Swal.fire({
      title: "Valider le dossier d'analyse ?",
      text: "En validant ce dossier, vous authentifiez officiellement les résultats d'analyse. Le bulletin officiel sera disponible au téléchargement.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Oui, valider officiellement",
      cancelButtonText: "Annuler",
    });

    if (!confirmResult.isConfirmed) return;

    validateMutation.mutate(selectedRequest.id, {
      onSuccess: () => {
        toast.success("Dossier d'analyse validé avec succès !");
        setSelectedRequest((prev) =>
          prev ? { ...prev, status: "VALIDATED" } : null
        );
      },
      onError: () => {
        toast.error("Erreur lors de la validation du dossier.");
      },
    });
  };

  const handleDownloadPdf = () => {
    if (!selectedRequest) return;
    downloadMutation.mutate(selectedRequest.id, {
      onSuccess: () => {
        toast.success("Téléchargement du bulletin d'analyses en cours...");
      },
      onError: () => {
        toast.error("Erreur lors de la génération du PDF.");
      },
    });
  };

  const TableSkeleton = () => (
    <div className="animate-pulse space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-100 dark:bg-slate-800 rounded-xl" />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* --- EN-TÊTE PRINCIPAL --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl">
            <FileCheck size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              Validation Biologiste
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Contrôle qualité et signature médicale des bulletins d'analyses
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <Stethoscope size={14} /> {validationRequests.length} dossier{validationRequests.length > 1 ? "s" : ""} affiché{validationRequests.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* --- BODY DIVISÉ EN 2 COLONNES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================================================= */}
        {/* COLONNE GAUCHE (4/12) : LISTE ET FILTRES DE VALIDATION */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
            
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Stethoscope size={16} className="text-emerald-500" />
                Dossiers à contrôler ({validationRequests.length})
              </h2>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher patient, code ou analyse..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>

            {/* Filtres par statut */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl gap-1">
              {[
                { id: "PENDING", label: "À Valider ⏳" },
                { id: "VALIDATED", label: "Validés ✅" },
                { id: "ALL", label: "Tous" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                    statusFilter === tab.id
                      ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

          </div>

          {/* Liste déroulante */}
          {isLoading ? (
            <TableSkeleton />
          ) : validationRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm text-center border border-slate-100 dark:border-slate-700 space-y-2">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Aucun dossier dans ce filtre
              </h3>
              <p className="text-xs text-slate-400">
                Aucun résultat ne correspond aux critères de sélection.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
              {validationRequests.map((request) => {
                const isSelected = selectedRequest?.id === request.id;
                const isValidated = request.status === "VALIDATED";

                return (
                  <div
                    key={request.id}
                    onClick={() => handleSelectRequest(request)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 shadow-sm border-l-4 border-l-emerald-600"
                        : "bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 shrink-0 font-bold">
                          <User size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                            {request.patient?.first_name} {request.patient?.last_name}
                            {isValidated && (
                              <CheckCircle2 size={15} className="text-emerald-500" />
                            )}
                          </h3>
                          <p className="text-xs text-slate-400">
                            {request.patient?.gender === "MALE" ? "Homme" : "Femme"} • Code: <span className="font-semibold text-slate-600 dark:text-slate-300">{request.patient?.patient_code}</span>
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          isValidated
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 animate-pulse"
                        }`}
                      >
                        {isValidated ? "Validé" : "À Valider"}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap gap-1">
                      {request.lines?.map((line) => (
                        <span
                          key={line.id}
                          className="text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-md text-slate-600 dark:text-slate-300 font-medium"
                        >
                          {line.test?.name}
                        </span>
                      ))}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>REQ #{request.id}</span>
                      <span>{new Date(request.created_at || "").toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* COLONNE DROITE (8/12) : DÉTAILS ET VALIDATION PAR LE BIOLOGISTE */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full min-h-[80vh] overflow-hidden">
            
            {selectedRequest ? (
              <div className="flex flex-col h-full overflow-hidden">
                
                {/* En-tête du dossier */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        Demande REQ #{selectedRequest.id}
                      </span>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                        {selectedRequest.patient?.first_name} {selectedRequest.patient?.last_name}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
                      <span>Code: <strong className="text-slate-700 dark:text-slate-200">{selectedRequest.patient?.patient_code}</strong></span>
                      <span>Sexe: <strong className="text-slate-700 dark:text-slate-200">{selectedRequest.patient?.gender === "MALE" ? "Homme" : "Femme"}</strong></span>
                      {selectedRequest.patient?.bith_date && (
                        <span>Âge: <strong className="text-slate-700 dark:text-slate-200">{new Date().getFullYear() - new Date(selectedRequest.patient.bith_date).getFullYear()} ans</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {selectedRequest.status === "VALIDATED" ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleDownloadPdf}
                        isLoading={downloadMutation.isPending}
                        className="bg-[#003366] hover:bg-[#002244] text-white shadow-sm"
                        icon={<Download size={16} />}
                      >
                        Télécharger Bulletin PDF
                      </Button>
                    ) : (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={handleValidate}
                        isLoading={validateMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold"
                        icon={<CheckCircle2 size={16} />}
                      >
                        Valider & Signer Dossier
                      </Button>
                    )}
                  </div>
                </div>

                {/* Détails des examens et résultats */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/30 dark:bg-slate-950/40">
                  {selectedRequest.lines?.map((line) => (
                    <div
                      key={line.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm space-y-4 p-5"
                    >
                      {/* Titre de l'examen */}
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h4 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                          <Beaker size={18} className="text-emerald-500" />
                          {line.test?.name}
                        </h4>
                        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                          {line.test?.code}
                        </span>
                      </div>

                      {/* Résultats et paramètres */}
                      <div className="space-y-4">
                        {line.test?.parameters?.map((param) => {
                          const result = line.results?.find((r) => r.lab_parameter_id === param.id);
                          const isAbnormal = result?.is_abnormal;
                          const isMale = selectedRequest.patient?.gender === "MALE";
                          const min = isMale ? param.reference_min_male : param.reference_min_female;
                          const max = isMale ? param.reference_max_male : param.reference_max_female;

                          // 1. Paramètre de type texte / compte rendu
                          if (param.value_type === "text") {
                            return (
                              <div key={param.id} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                  <FileText size={15} className="text-emerald-500" />
                                  {param.name} (Compte Rendu)
                                </span>
                                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                                  {result?.value_text || <span className="italic text-slate-400">Aucune observation saisie</span>}
                                </div>
                              </div>
                            );
                          }

                          // 2. Paramètre de type fichier / image
                          if (param.value_type === "file") {
                            const fileUrl = result?.file_path ? `http://localhost:8000/storage/${result.file_path}` : null;
                            return (
                              <div key={param.id} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                  <ImageIcon size={15} className="text-emerald-500" />
                                  {param.name} (Cliché d'examen)
                                </span>
                                {fileUrl ? (
                                  <div className="flex items-center gap-3">
                                    <div 
                                      onClick={() => handleOpenImageZoom(fileUrl, `${line.test?.name} - ${param.name}`)}
                                      className="relative group w-28 h-28 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md cursor-pointer bg-black/10 shrink-0"
                                    >
                                      <img src={fileUrl} alt="Cliché" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Eye size={20} className="text-white" />
                                      </div>
                                    </div>
                                    <span className="text-xs text-slate-500">Cliquez sur la miniature pour agrandir en plein écran</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">Aucun fichier joint</span>
                                )}
                              </div>
                            );
                          }

                          // 3. Paramètres numériques / options / chaines courtes
                          const val = result ? (result.value_numeric ?? result.value_string ?? result.value_text) : "-";

                          return (
                            <div key={param.id} className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                              <table className="w-full text-xs text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                                  <tr>
                                    <th className="px-4 py-2.5">Paramètre</th>
                                    <th className="px-4 py-2.5">Résultat Saisi</th>
                                    <th className="px-4 py-2.5">Unité</th>
                                    <th className="px-4 py-2.5">Plage de Référence</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className={`transition-colors ${isAbnormal ? "bg-red-50 dark:bg-red-950/30" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/40"}`}>
                                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{param.name}</td>
                                    <td className="px-4 py-3 font-bold">
                                      <div className="flex items-center gap-2">
                                        <span className={isAbnormal ? "text-red-600 dark:text-red-400 font-mono text-sm" : "text-slate-800 dark:text-white font-mono text-sm"}>
                                          {val}
                                        </span>
                                        {isAbnormal ? (
                                          <span className="inline-flex items-center gap-1 text-[10px] bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-bold px-2 py-0.5 rounded-md">
                                            <AlertTriangle size={13} /> ANOMALIE
                                          </span>
                                        ) : (
                                          <CheckCircle2 size={16} className="text-emerald-500" />
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-500">{param.unit || "-"}</td>
                                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                                      {min !== null && max !== null ? (
                                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                          [{min} - {max}]
                                        </span>
                                      ) : param.reference_text ? (
                                        <span>{param.reference_text}</span>
                                      ) : (
                                        <span className="italic text-slate-400">N/A</span>
                                      )}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer d'action */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0 flex justify-end gap-3">
                  {selectedRequest.status === "COMPLETED" ? (
                    <Button
                      variant="success"
                      size="lg"
                      onClick={handleValidate}
                      isLoading={validateMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md min-w-[240px]"
                      icon={<CheckCircle2 size={18} />}
                    >
                      Valider & Signer le Dossier
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleDownloadPdf}
                      isLoading={downloadMutation.isPending}
                      className="bg-[#003366] hover:bg-[#002244] text-white font-bold shadow-md min-w-[240px]"
                      icon={<Download size={18} />}
                    >
                      Télécharger le Bulletin PDF
                    </Button>
                  )}
                </div>

              </div>
            ) : (
              <div className="p-12 h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-full text-emerald-500">
                  <FileCheck size={48} />
                </div>
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
                  Aucun dossier sélectionné
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Sélectionnez un dossier à vérifier dans la liste à gauche pour contrôler et valider les résultats d'analyses.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* --- MODALE LIGHTBOX POUR PRÉVISUALISATION D'IMAGE GRANDE TAILLE --- */}
      <ImagePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        imageSrc={previewImageSrc}
        title={previewTitle}
      />

    </div>
  );
};

export default LabValidation;
