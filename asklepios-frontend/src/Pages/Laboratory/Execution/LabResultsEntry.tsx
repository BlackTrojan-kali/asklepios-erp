import React, { useState, useMemo } from "react";
import {
  Microscope,
  CheckCircle2,
  FileText,
  User,
  Calendar,
  AlertCircle,
  Save,
  Beaker,
  Search,
  Upload,
  Eye,
  Trash2,
  Filter,
  Image as ImageIcon,
  CheckSquare,
} from "lucide-react";
import {
  useLabRequests,
  useSaveLabResults,
} from "../../../hooks/laboratory/useLabRequest";
import type { LabRequestDto } from "../../../types/types";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { Button } from "../../../components/common/Button";
import { ImagePreviewModal } from "../../../components/modals/Base_hopital/laboratory/ImagePreviewModal";

const LabResultsEntry = () => {
  // 1. Données des requêtes prélevées
  const { data: requests = [], isLoading } = useLabRequests("SAMPLED");
  const saveResultsMutation = useSaveLabResults();

  // 2. États locaux
  const [selectedRequest, setSelectedRequest] = useState<LabRequestDto | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | "URGENT" | "ROUTINE">("ALL");

  // Stockage des valeurs saisies : { [param_id]: string | number | File | null }
  const [resultsData, setResultsData] = useState<Record<number, string | number | File | null>>({});
  
  // Stockage des URLs temporaires pour l'aperçu des fichiers images : { [param_id]: objectUrl }
  const [filePreviews, setFilePreviews] = useState<Record<number, string>>({});

  // Modale Lightbox d'agrandissement d'image
  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");

  // 3. Filtrage de la file d'attente à gauche
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Filtre de priorité
      if (priorityFilter === "URGENT" && req.priority !== "URGENT") return false;
      if (priorityFilter === "ROUTINE" && req.priority === "URGENT") return false;

      // Filtre de recherche
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const patientName = `${req.patient?.first_name || ""} ${req.patient?.last_name || ""}`.toLowerCase();
      const patientCode = (req.patient?.patient_code || "").toLowerCase();
      const reqId = `req-${req.id}`.toLowerCase();
      const testNames = (req.lines || []).map(l => l.test?.name || "").join(" ").toLowerCase();

      return patientName.includes(q) || patientCode.includes(q) || reqId.includes(q) || testNames.includes(q);
    });
  }, [requests, searchQuery, priorityFilter]);

  const handleSelectRequest = (request: LabRequestDto) => {
    setSelectedRequest(request);
    setResultsData({});
    setFilePreviews({});
  };

  const handleInputChange = (
    parameterId: number,
    value: string | number | File | null
  ) => {
    setResultsData((prev) => ({
      ...prev,
      [parameterId]: value,
    }));

    // Si c'est un fichier image, générer une URL temporaire d'aperçu
    if (value instanceof File && value.type.startsWith("image/")) {
      const url = URL.createObjectURL(value);
      setFilePreviews((prev) => ({
        ...prev,
        [parameterId]: url,
      }));
    } else if (value === null) {
      setFilePreviews((prev) => {
        const copy = { ...prev };
        delete copy[parameterId];
        return copy;
      });
    }
  };

  // Ouverture de la modale de zoom pour une image
  const handleOpenImageZoom = (imageSrc: string, title: string) => {
    setPreviewImageSrc(imageSrc);
    setPreviewTitle(title);
    setIsPreviewModalOpen(true);
  };

  // Vérification de la valeur anormale par rapport à la plage min/max
  const checkIsAbnormal = (
    val: string | number,
    min?: number,
    max?: number
  ) => {
    if (!val || val === "") return false;
    const numVal = Number(val);
    if (isNaN(numVal)) return false;
    if (min !== undefined && min !== null && numVal < min) return true;
    if (max !== undefined && max !== null && numVal > max) return true;
    return false;
  };

  // Enregistrement des résultats
  const handleSaveResults = async () => {
    if (!selectedRequest) return;

    const formDataPayload = new FormData();
    let hasData = false;
    let resultIndex = 0;

    selectedRequest.lines?.forEach((line) => {
      line.test?.parameters?.forEach((param) => {
        const val = resultsData[param.id];
        if (val !== undefined && val !== "" && val !== null) {
          hasData = true;
          const baseKey = `results[${resultIndex}]`;

          formDataPayload.append(
            `${baseKey}[lab_request_line_id]`,
            line.id.toString()
          );
          formDataPayload.append(
            `${baseKey}[lab_parameter_id]`,
            param.id.toString()
          );

          if (param.value_type === "file" && val instanceof File) {
            formDataPayload.append(`${baseKey}[file]`, val);
          } else if (param.value_type === "text") {
            formDataPayload.append(`${baseKey}[value_text]`, String(val));
          } else if (
            param.value_type === "options" ||
            param.value_type === "string"
          ) {
            formDataPayload.append(`${baseKey}[value_string]`, String(val));
          } else {
            if (!isNaN(Number(val))) {
              formDataPayload.append(`${baseKey}[value_numeric]`, String(val));
            }
          }
          resultIndex++;
        }
      });
    });

    if (!hasData) {
      toast.error("Veuillez saisir au moins un résultat d'analyse.");
      return;
    }

    const confirmResult = await Swal.fire({
      title: "Enregistrer les résultats ?",
      text: "Attention : cette opération est irréversible. Les résultats enregistrés seront transmis pour validation.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#003366",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Oui, enregistrer",
      cancelButtonText: "Annuler",
    });

    if (!confirmResult.isConfirmed) return;

    saveResultsMutation.mutate(
      { id: selectedRequest.id, data: formDataPayload as any },
      {
        onSuccess: () => {
          toast.success("Résultats d'analyses enregistrés avec succès !");
          setSelectedRequest(null);
          setResultsData({});
          setFilePreviews({});
        },
        onError: () => {
          toast.error("Erreur lors de l'enregistrement des résultats.");
        },
      }
    );
  };

  const TableSkeleton = () => (
    <div className="animate-pulse space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* --- EN-TÊTE PRINCIPAL --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-xl">
            <Microscope size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              Poste de Saisie des Résultats
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Saisie structurée des analyses, comptes rendus et clichés d'imagerie/fichiers
            </p>
          </div>
        </div>

        {/* Badge récapitulatif des analyses en attente */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <Beaker size={14} /> {requests.length} patient{requests.length > 1 ? "s" : ""} prélevé{requests.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* --- BODY DIVISÉ EN 2 COLONNES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================================================= */}
        {/* COLONNE GAUCHE (4/12) : FILE D'ATTENTE & RECHERCHE PATIENTS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
            
            {/* Titre & Compteur */}
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Beaker size={16} className="text-purple-500" />
                Patients à traiter ({filteredRequests.length})
              </h2>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher patient, code ou examen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
              />
            </div>

            {/* Filtres par urgence */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl gap-1">
              {[
                { id: "ALL", label: "Tous" },
                { id: "URGENT", label: "Urgents ⚡" },
                { id: "ROUTINE", label: "Routines" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPriorityFilter(tab.id as any)}
                  className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                    priorityFilter === tab.id
                      ? "bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

          </div>

          {/* Liste déroulante des demandes */}
          {isLoading ? (
            <TableSkeleton />
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm text-center border border-slate-100 dark:border-slate-700 space-y-2">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Aucun patient en attente de résultat
              </h3>
              <p className="text-xs text-slate-400">
                Toutes les analyses prélevées ont été saisies ou validées.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
              {filteredRequests.map((request) => {
                const isSelected = selectedRequest?.id === request.id;
                const isUrgent = request.priority === "URGENT";

                return (
                  <div
                    key={request.id}
                    onClick={() => handleSelectRequest(request)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-purple-50/90 dark:bg-purple-950/40 border-purple-500 shadow-sm border-l-4 border-l-purple-600"
                        : "bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 shrink-0 font-bold">
                          <User size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                            {request.patient?.first_name} {request.patient?.last_name}
                          </h3>
                          <p className="text-xs text-slate-400">
                            {request.patient?.gender === "MALE" ? "Homme" : "Femme"} • Code: <span className="font-semibold text-slate-600 dark:text-slate-300">{request.patient?.patient_code}</span>
                          </p>
                        </div>
                      </div>

                      {isUrgent && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse">
                          URGENT
                        </span>
                      )}
                    </div>

                    {/* Liste des examens prescrits */}
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
        {/* COLONNE DROITE (8/12) : ZONE DE SAISIE ADAPTATIVE */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full min-h-[80vh] overflow-hidden">
            
            {selectedRequest ? (
              <div className="flex flex-col h-full overflow-hidden">
                
                {/* En-tête Patient sélectionné */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2.5 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800">
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

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveResults}
                    isLoading={saveResultsMutation.isPending}
                    className="bg-[#003366] hover:bg-[#002244] text-white shadow-sm"
                    icon={<Save size={16} />}
                  >
                    Enregistrer les résultats
                  </Button>
                </div>

                {/* Zone de saisie par Examen */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/30 dark:bg-slate-950/40">
                  {selectedRequest.lines?.map((line) => {
                    const params = line.test?.parameters || [];
                    
                    // Séparation des paramètres par type
                    const numericAndOptionParams = params.filter(p => p.value_type !== "text" && p.value_type !== "file");
                    const textReportParams = params.filter(p => p.value_type === "text");
                    const fileMediaParams = params.filter(p => p.value_type === "file");

                    return (
                      <div
                        key={line.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm"
                      >
                        {/* En-tête de l'Examen */}
                        <div className="bg-slate-100/70 dark:bg-slate-800 px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                          <h4 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                            <Beaker size={18} className="text-purple-600 dark:text-purple-400" />
                            {line.test?.name}
                          </h4>
                          {line.test?.category && (
                            <span className="text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2.5 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800">
                              {line.test.category.name}
                            </span>
                          )}
                        </div>

                        <div className="p-5 space-y-6">
                          
                          {/* ========================================================================= */}
                          {/* SECTION A : PARAMÈTRES STRUCTURÉS (Numériques, Choix, Chaines courtes) */}
                          {/* ========================================================================= */}
                          {numericAndOptionParams.length > 0 && (
                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                              <table className="w-full text-xs text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                                  <tr>
                                    <th className="px-4 py-3">Paramètre</th>
                                    <th className="px-4 py-3 w-52">Résultat</th>
                                    <th className="px-4 py-3">Unité</th>
                                    <th className="px-4 py-3">Valeurs de Référence</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {numericAndOptionParams.map((param) => {
                                    const isMale = selectedRequest.patient?.gender === "MALE";
                                    const min = isMale ? param.reference_min_male : param.reference_min_female;
                                    const max = isMale ? param.reference_max_male : param.reference_max_female;
                                    const val = resultsData[param.id] || "";
                                    const abnormal = (param.value_type === "numeric" || !param.value_type)
                                      ? checkIsAbnormal(val as string | number, min, max)
                                      : false;

                                    let inputElement;

                                    if (param.value_type === "options" && param.options) {
                                      inputElement = (
                                        <select
                                          value={(val as string) || ""}
                                          onChange={(e) => handleInputChange(param.id, e.target.value)}
                                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                                        >
                                          <option value="">Sélectionnez...</option>
                                          {param.options.map((opt) => (
                                            <option key={opt} value={opt}>
                                              {opt}
                                            </option>
                                          ))}
                                        </select>
                                      );
                                    } else {
                                      inputElement = (
                                        <div className="relative">
                                          <input
                                            type={param.value_type === "numeric" ? "number" : "text"}
                                            step={param.value_type === "numeric" ? "any" : undefined}
                                            value={(val as string) || ""}
                                            onChange={(e) => handleInputChange(param.id, e.target.value)}
                                            placeholder="Valeur..."
                                            className={`w-full px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${
                                              abnormal
                                                ? "border-red-400 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300 font-bold"
                                                : "border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500"
                                            }`}
                                          />
                                          {abnormal && (
                                            <AlertCircle className="absolute right-2.5 top-2.5 text-red-500" size={14} />
                                          )}
                                        </div>
                                      );
                                    }

                                    return (
                                      <tr key={param.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                        <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                                          {param.name}
                                        </td>
                                        <td className="px-4 py-3">{inputElement}</td>
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
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* ========================================================================= */}
                          {/* SECTION B : COMPTES RENDUS & INTERPRÉTATIONS (Pleine Largeur Extensible) */}
                          {/* ========================================================================= */}
                          {textReportParams.map((param) => {
                            const val = (resultsData[param.id] as string) || "";
                            return (
                              <div key={param.id} className="bg-slate-50/60 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                    <FileText size={15} className="text-purple-600" />
                                    {param.name} (Compte Rendu / Observation)
                                  </label>
                                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Zone de texte étendue</span>
                                </div>
                                <textarea
                                  value={val}
                                  onChange={(e) => handleInputChange(param.id, e.target.value)}
                                  rows={5}
                                  placeholder="Rédigez l'observation clinique, le compte rendu détaillé ou l'interprétation de l'analyse..."
                                  className="w-full p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 dark:text-white leading-relaxed shadow-inner"
                                />
                              </div>
                            );
                          })}

                          {/* ========================================================================= */}
                          {/* SECTION C : CAPTURES D'IMAGES & FICHIERS JOINTS (Zone Multimédia + Zoom) */}
                          {/* ========================================================================= */}
                          {fileMediaParams.map((param) => {
                            const fileObj = resultsData[param.id] as File | null;
                            const previewUrl = filePreviews[param.id];

                            return (
                              <div key={param.id} className="bg-slate-50/60 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                  <ImageIcon size={15} className="text-purple-600" />
                                  {param.name} (Capture / Cliché d'Examen)
                                </label>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                  {/* Zone Uploader */}
                                  <label className="flex-1 w-full flex items-center justify-center gap-2 p-4 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 rounded-xl cursor-pointer transition-colors text-xs font-medium text-slate-600 dark:text-slate-300">
                                    <Upload size={18} className="text-purple-500" />
                                    <span>{fileObj ? fileObj.name : "Cliquez ou glissez un cliché (PNG, JPEG, PDF)..."}</span>
                                    <input
                                      type="file"
                                      accept="image/*,.pdf"
                                      onChange={(e) => handleInputChange(param.id, e.target.files?.[0] || null)}
                                      className="hidden"
                                    />
                                  </label>

                                  {/* Miniature avec Bouton Zoom */}
                                  {previewUrl && (
                                    <div className="relative group w-24 h-24 rounded-xl overflow-hidden border-2 border-purple-500 shadow-md shrink-0 bg-black/10">
                                      <img
                                        src={previewUrl}
                                        alt="Aperçu cliché"
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenImageZoom(previewUrl, `${line.test?.name} - ${param.name}`)}
                                          className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors"
                                          title="Agrandir en grand format"
                                        >
                                          <Eye size={16} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleInputChange(param.id, null)}
                                          className="p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors"
                                          title="Supprimer ce cliché"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Fallback si aucun paramètre */}
                          {params.length === 0 && (
                            <div className="p-6 text-center text-xs text-slate-400 italic">
                              Aucun paramètre configuré pour cet examen.
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Fixe de Sauvegarde */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0 flex justify-end">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSaveResults}
                    isLoading={saveResultsMutation.isPending}
                    className="bg-[#003366] hover:bg-[#002244] text-white shadow-md min-w-[220px]"
                    icon={<Save size={18} />}
                  >
                    Enregistrer les résultats
                  </Button>
                </div>

              </div>
            ) : (
              <div className="p-12 h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
                <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-full text-purple-500">
                  <Microscope size={48} />
                </div>
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
                  Aucun patient sélectionné
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Veuillez sélectionner un patient dans la file d'attente à gauche pour commencer la saisie de ses analyses.
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

export default LabResultsEntry;
