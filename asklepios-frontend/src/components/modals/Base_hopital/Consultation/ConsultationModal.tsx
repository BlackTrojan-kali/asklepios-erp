import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  User,
  Activity,
  Pill,
  Stethoscope,
  Download,
  Save,
  Loader2,
  Plus,
  TestTube,
  AlertTriangle,
  Edit,
  Syringe,
  Scissors,
  HeartPulse,
  History,
  Coffee,
} from "lucide-react";
import toast from "react-hot-toast";

// --- Types ---
import type { PatientVisitDto } from "../../../../types/PatientTypes";
import type {
  CreateConsultationPayload,
  PrescriptionLinePayload,
  PerformedMedicalActPayload,
} from "../../../../types/ConsultationTypes";

// --- Context & Stores ---
import { useAuth } from "../../../../contexts/AuthContext";
import useConsultationStore from "../../../../functions/base_hospital/useConsultationStore";
import useMedicalBgStore from "../../../../functions/base_hospital/useMedicalBgStore";
import useArticleStore from "../../../../functions/pharmacy/useArticleStore";
import useMedicalActStore from "../../../../functions/base_hospital/useMedicalActStore";
import useEquipmentStore from "../../../../functions/base_hospital/useEquipmentStore";

// --- Api pour rafraîchissement local ---
import api from "../../../../api/api";

// --- Modales Enfants ---
import { AddMedicationModal } from "./AddMedicationModal";
import { AddExamModal } from "./AddExamModal";
import { AddMedicalActModal } from "./AddMedicalActModal";
import { MedicalBackgroundModal } from "./MedicalBackgroundModal";
import { PatientLabResultsList } from "../laboratory/PatientLabResultsList";
import { ImagePreviewModal } from "../laboratory/ImagePreviewModal";
import { PrescribedExamAccordionItem } from "../laboratory/PrescribedExamAccordionItem";

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: (hasChanged?: boolean) => void;
  // 👉 "any" car l'objet peut être un PatientVisitDto (externe) ou un Admission (hospitalisation)
  visit: PatientVisitDto | any | null;
  isHospitalization?: boolean;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  visit,
  isHospitalization = false,
}) => {
  const { profile } = useAuth();
  const departmentId = profile?.profile_doctor?.department_id || 0;

  // Déclaration sécurisée au top niveau
  const patient = visit?.patient;
  const patientId = patient?.id;

  // --- STORES ---
  const {
    createConsultation,
    actionLoading: isConsultingLoading,
    getLabTests,
  } = useConsultationStore();
  const { downloadMedicalRecord } = useMedicalBgStore();

  // Chargement des catalogues
  const { getAllArticles, allArticles } = useArticleStore();
  const { getSharedMedicalActs, sharedMedicalActs } = useMedicalActStore();
  const { getSharedEquipment, sharedEquipment } = useEquipmentStore();

  // --- ÉTATS DU FORMULAIRE ---
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");

  const [prescriptions, setPrescriptions] = useState<PrescriptionLinePayload[]>(
    [],
  );
  const [exams, setExams] = useState<any[]>([]);
  const [performedActs, setPerformedActs] = useState<
    PerformedMedicalActPayload[]
  >([]);

  const [labTests, setLabTests] = useState<any[]>([]);
  const [successConsultationId, setSuccessConsultationId] = useState<
    number | null
  >(null);

  // État local du dossier médical et laboratoire
  const [localMedicalBg, setLocalMedicalBg] = useState<any>(null);
  const [modalLabRequests, setModalLabRequests] = useState<any[]>([]);
  const [leftTab, setLeftTab] = useState<"BG" | "LAB">("BG");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // --- ÉTATS DES MODALES ENFANTS ---
  const [isAddMedModalOpen, setIsAddMedModalOpen] = useState(false);
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false);
  const [isAddActModalOpen, setIsAddActModalOpen] = useState(false);
  const [isMedicalBgModalOpen, setIsMedicalBgModalOpen] = useState(false);

  const [autoRefreshPage, setAutoRefreshPage] = useState<boolean>(false);

  // Fonction de rafraîchissement sécurisée via useCallback
  const fetchLocalMedicalBg = useCallback(async () => {
    if (!patientId) return;
    try {
      const response = await api.get(
        `/shared/patients/${patientId}/medical-background`,
      );
      setLocalMedicalBg(response.data.data || response.data);
    } catch (error) {
      console.error("Impossible de rafraîchir le dossier médical", error);
    }
  }, [patientId]);

  useEffect(() => {
    if (isOpen && patientId) {
      api.get("/laboratory/requests", { params: { patient_id: patientId } })
        .then((res) => {
          const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
          setModalLabRequests(data);
        })
        .catch((err) => console.error("Erreur chargement labo :", err));
    }
  }, [isOpen, patientId]);

  // --- INITIALISATION ---
  useEffect(() => {
    if (isOpen && visit && patient) {
      setChiefComplaint("");
      setClinicalNotes("");
      setPrescriptions([]);
      setExams([]);
      setPerformedActs([]);
      setSuccessConsultationId(null);
      setLocalMedicalBg(patient.medical_background || null);

      getLabTests().then(setLabTests);
      getAllArticles();
      if (departmentId) {
        getSharedMedicalActs(departmentId);
        getSharedEquipment(departmentId);
      }
    }
  }, [
    isOpen,
    visit,
    patient,
    departmentId,
    getAllArticles,
    getSharedMedicalActs,
    getSharedEquipment,
    getLabTests,
  ]);

  // Écoute du trigger d'AutoRefresh
  useEffect(() => {
    if (isOpen && patientId) {
      fetchLocalMedicalBg();
    }
  }, [autoRefreshPage, fetchLocalMedicalBg, isOpen, patientId]);

  // Retour précoce si données manquantes
  if (!isOpen || !visit || !patient) return null;

  const handleAutoRefreshPage = () => {
    setAutoRefreshPage(!autoRefreshPage);
  };

  const handleDownloadRecord = async () => {
    toast.promise(downloadMedicalRecord(patient.id, "download"), {
      loading: "Génération du carnet médical...",
      success: "Téléchargement démarré !",
      error: "Erreur lors du téléchargement.",
    });
  };

  // =====================================================================
  // 👉 SOUMISSION DE LA CONSULTATION (Visite Externe ET Hospitalisation)
  // =====================================================================
  const handleSubmitConsultation = async () => {
    if (!chiefComplaint.trim()) {
      toast.error("Le motif de consultation est obligatoire.");
      return;
    }

    const payload: CreateConsultationPayload = {
      chief_complaint: chiefComplaint,
      clinical_data: { notes: clinicalNotes },
      prescriptions: prescriptions,
      exams: exams,
      medical_acts: performedActs,
    };

    // Assignation dynamique de la clé correcte selon le contexte
    if (isHospitalization) {
      payload.admission_id = visit.id;
    } else {
      payload.patient_visit_id = visit.id;
    }

    const res = await createConsultation(payload);

    // Si la création réussit, on affiche l'écran de succès de votre collègue
    if (res && res.id) {
      setSuccessConsultationId(res.id);
    } else if (res) {
      // Fallback au cas où l'API renvoie juste 'true' au lieu de l'objet
      onClose(true);
    }
  };

  // Fonction de téléchargement des PDF ajoutée par votre collègue
  const handleDownloadPdf = async (type: "prescription" | "exam-request") => {
    if (!successConsultationId) return;
    try {
      const toastId = toast.loading("Génération du document...");
      const response = await api.get(
        `/doctor/consultations/${successConsultationId}/${type}-pdf`,
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${type}_${successConsultationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss(toastId);
    } catch (e) {
      toast.error("Erreur lors du téléchargement");
    }
  };

  const removePrescription = (index: number) =>
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  const removeExam = (index: number) =>
    setExams((prev) => prev.filter((_, i) => i !== index));
  const removeAct = (index: number) =>
    setPerformedActs((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* On ajoute 'relative' au parent pour que l'overlay de succès puisse s'afficher par-dessus */}
      <div className="bg-[#faf8f1] dark:bg-gray-900 w-full max-w-[95vw] h-[95vh] rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800 overflow-hidden relative">
        {/* --- HEADER GLOBAL --- */}
        <div className="flex items-center justify-between p-4 bg-[#003366] text-white shrink-0">
          <div className="flex items-center gap-3">
            <Stethoscope size={24} className="text-[#00a896]" />
            <div>
              <h2 className="text-xl font-bold font-brand leading-tight">
                {isHospitalization
                  ? "Visite d'hospitalisation"
                  : "Consultation en cours"}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-blue-100 font-medium">
                  {patient.first_name} {patient.last_name}
                </p>
                <span className="text-[10px] bg-blue-900/50 text-blue-200 px-1.5 py-0.5 rounded font-mono border border-blue-800">
                  {patient.patient_code || `ID_${patient.id}`}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadRecord}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              <Download size={16} /> Carnet
            </button>
            <button
              onClick={() => onClose(false)}
              className="p-2 text-gray-300 hover:text-white hover:bg-red-500/20 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* --- CORPS DE LA MODALE --- */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* COLONNE GAUCHE : DOSSIER PATIENT COMPLET OU EXAMENS LABO */}
          <div className="w-full lg:w-[480px] xl:w-[520px] border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 flex flex-col overflow-y-auto custom-scrollbar shrink-0">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-[#00a896]/10 flex items-center justify-center text-[#00a896] shrink-0">
                  <User size={24} />
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-base text-gray-800 dark:text-white font-brand truncate">
                    {patient.first_name} {patient.last_name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {patient.gender === "M" ? "Homme" : "Femme"} • Né(e) le{" "}
                    {patient.bith_date || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* NAV TABS GAUCHE */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-800/80 p-1 gap-1">
              <button
                type="button"
                onClick={() => setLeftTab("BG")}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  leftTab === "BG"
                    ? "bg-white dark:bg-gray-900 text-[#003366] dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-700"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <Activity size={14} className="text-[#00a896]" /> Dossier
                Médical
              </button>
              <button
                type="button"
                onClick={() => setLeftTab("LAB")}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  leftTab === "LAB"
                    ? "bg-white dark:bg-gray-900 text-[#003366] dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-700"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <TestTube size={14} className="text-purple-500" /> Analyses &
                Résultats
              </button>
            </div>

            {/* TAB CONTENT: DOSSIER MÉDICAL */}
            {leftTab === "BG" ? (
              <div className="p-5 flex-1 space-y-5 text-sm">
                <div className="flex items-center justify-between mb-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                  <h4 className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300 font-brand uppercase tracking-wider text-xs">
                    <Activity size={14} className="text-[#00a896]" />{" "}
                    Antécédents Médicaux
                  </h4>
                  <button
                    onClick={() => setIsMedicalBgModalOpen(true)}
                    className="flex items-center gap-1 text-xs font-bold text-[#003366] dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded"
                  >
                    <Edit size={12} />{" "}
                    {localMedicalBg ? "Mettre à jour" : "Créer"}
                  </button>
                </div>

                {!localMedicalBg ? (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 text-center mt-4">
                    <AlertTriangle
                      size={24}
                      className="text-orange-500 mx-auto mb-2"
                    />
                    <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">
                      Le carnet médical est vide.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5 text-sm">
                    {/* Groupe sanguin & Allergies */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                        <span className="block text-xs text-red-400 uppercase tracking-wide font-bold mb-1">
                          Groupe Sanguin
                        </span>
                        <span className="font-black text-red-600 dark:text-red-400 text-lg">
                          {localMedicalBg.blood_type || "Inconnu"}
                        </span>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-lg border border-orange-100 dark:border-orange-900/50">
                        <span className="block text-xs text-orange-500 uppercase tracking-wide font-bold mb-1">
                          Allergies
                        </span>
                        <span className="font-bold text-orange-700 dark:text-orange-400 leading-tight block">
                          {localMedicalBg.allergies?.length
                            ? localMedicalBg.allergies.join(", ")
                            : "Aucune"}
                        </span>
                      </div>
                    </div>

                    {/* Maladies chroniques */}
                    <div>
                      <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wide mb-1.5">
                        <HeartPulse size={14} /> Pathologies Chroniques
                      </span>
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-medium">
                        {localMedicalBg.chronic_conditions?.length ? (
                          <ul className="list-disc pl-4 space-y-1">
                            {localMedicalBg.chronic_conditions.map(
                              (cond: string, i: number) => (
                                <li key={i}>{cond}</li>
                              ),
                            )}
                          </ul>
                        ) : (
                          "Néant"
                        )}
                      </div>
                    </div>

                    {/* Médicaments en cours */}
                    <div>
                      <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wide mb-1.5">
                        <Pill size={14} /> Traitements en cours
                      </span>
                      <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 text-blue-900 dark:text-blue-200 font-medium">
                        {localMedicalBg.current_medications?.length ? (
                          <ul className="list-disc pl-4 space-y-1">
                            {localMedicalBg.current_medications.map(
                              (med: string, i: number) => (
                                <li key={i}>{med}</li>
                              ),
                            )}
                          </ul>
                        ) : (
                          "Aucun traitement signalé"
                        )}
                      </div>
                    </div>

                    {/* Chirurgies */}
                    <div>
                      <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wide mb-1.5">
                        <Scissors size={14} /> Antécédents Chirurgicaux
                      </span>
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
                        {localMedicalBg.past_surgeries?.length ? (
                          <ul className="space-y-2">
                            {localMedicalBg.past_surgeries.map(
                              (surg: any, i: number) => (
                                <li
                                  key={i}
                                  className="text-gray-800 dark:text-gray-200"
                                >
                                  <span className="font-bold">{surg.name}</span>
                                  {surg.year && (
                                    <span className="text-gray-500 ml-2">
                                      ({surg.year})
                                    </span>
                                  )}
                                  {surg.notes && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {surg.notes}
                                    </p>
                                  )}
                                </li>
                              ),
                            )}
                          </ul>
                        ) : (
                          <span className="text-gray-500 font-medium">
                            Aucune intervention signalée
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mode de vie et Histoire familiale */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-wide mb-1">
                          <Coffee size={12} /> Mode de vie
                        </span>
                        <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                          {localMedicalBg.lifestyle_habits || "Non renseigné"}
                        </p>
                      </div>
                      <div>
                        <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-wide mb-1">
                          <History size={12} /> Familial
                        </span>
                        <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                          {localMedicalBg.family_history || "Non renseigné"}
                        </p>
                      </div>
                    </div>

                    {/* Vaccins */}
                    {localMedicalBg.immunizations?.length > 0 && (
                      <div>
                        <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wide mb-1.5">
                          <Syringe size={14} /> Vaccinations (Infos)
                        </span>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                          {localMedicalBg.immunizations.join(" • ")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* TAB CONTENT: ANALYSES & RÉSULTATS LABO */
              <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                {patientId ? (
                  <PatientLabResultsList
                    patientId={patientId}
                    patientVisitId={visit?.id || visit?.patient_visit_id}
                    consultationExams={exams}
                    defaultScope="THIS_CONSULTATION"
                    onPreviewImage={(url) => setPreviewImageUrl(url)}
                  />
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center py-10">
                    Patient non identifié.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* COLONNE DROITE : ESPACE DE TRAVAIL (Consultation) */}
          <div className="flex-1 flex flex-col bg-[#faf8f1] dark:bg-gray-900">
            <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
              {/* Bloc 1 : Motif et Notes */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="font-bold text-[#003366] dark:text-blue-400 mb-4 font-brand border-b border-gray-100 dark:border-gray-700 pb-2">
                  1. Examen Clinique
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Motif principal de la visite{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Notes de consultation
                    </label>
                    <textarea
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      rows={4}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none resize-y dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Bloc 2 : Actes Médicaux */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                  <h3 className="font-bold text-[#003366] dark:text-blue-400 font-brand">
                    2. Actes Médicaux Réalisés
                  </h3>
                  <button
                    onClick={() => setIsAddActModalOpen(true)}
                    className="flex items-center gap-1.5 text-sm font-medium text-[#00a896] hover:text-[#008f7f] bg-[#00a896]/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus size={16} /> Saisir un acte
                  </button>
                </div>
                {performedActs.length === 0 ? (
                  <p className="text-sm text-gray-400 italic text-center py-2">
                    Aucun acte médical facturable saisi.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {performedActs.map((act, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <Syringe size={18} className="text-indigo-500" />
                          <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                              {sharedMedicalActs.find(
                                (a) => a.id === act.medical_act_catalog_id,
                              )?.name || "Acte inconnu"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Tarif: {act.applied_price} FCFA{" "}
                              {act.equipment_id &&
                                `(Équipement #${act.equipment_id})`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeAct(idx)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bloc 3 : Ordonnance */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                  <h3 className="font-bold text-[#003366] dark:text-blue-400 font-brand">
                    3. Ordonnance (Prescriptions)
                  </h3>
                  <button
                    onClick={() => setIsAddMedModalOpen(true)}
                    className="flex items-center gap-1.5 text-sm font-medium text-[#00a896] hover:text-[#008f7f] bg-[#00a896]/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus size={16} /> Ajouter un médicament
                  </button>
                </div>
                {prescriptions.length === 0 ? (
                  <p className="text-sm text-gray-400 italic text-center py-2">
                    Aucun médicament prescrit.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {prescriptions.map((med, idx) => (
                      <li
                        key={idx}
                        className="flex justify-between p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <Pill size={18} className="text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-bold text-sm text-gray-800 dark:text-gray-200">
                              {med.custom_medication_name ||
                                allArticles.find((a) => a.id === med.article_id)
                                  ?.name ||
                                `Article #${med.article_id}`}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-wrap">
                              {med.dosage}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removePrescription(idx)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <X size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Bloc 4 : Examens Labo */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                  <h3 className="font-bold text-[#003366] dark:text-blue-400 font-brand">
                    4. Demande d'Examens
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddExamModalOpen(true)}
                    className="flex items-center gap-1.5 text-sm font-medium text-[#00a896] hover:text-[#008f7f] bg-[#00a896]/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus size={16} /> Prescrire un examen
                  </button>
                </div>
                {exams.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-2">
                    Aucun examen prescrit pour cette séance.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {exams.map((exam, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-800 text-xs font-bold shadow-xs"
                      >
                        <TestTube size={15} className="text-purple-500" />
                        <span>{exam.exam_name}</span>
                        <button
                          type="button"
                          onClick={() => removeExam(idx)}
                          title="Retirer cet examen"
                          className="text-purple-400 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-1 p-0.5 rounded-md"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* --- FOOTER (Masqué si succès) --- */}
            {!successConsultationId && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => onClose(false)}
                  disabled={isConsultingLoading}
                  className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                >
                  Suspendre / Annuler
                </button>
                <button
                  onClick={handleSubmitConsultation}
                  disabled={isConsultingLoading || !chiefComplaint.trim()}
                  className="px-8 py-3 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg disabled:opacity-50"
                >
                  {isConsultingLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />{" "}
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save size={20} /> Valider la Consultation
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- ÉCRAN DE SUCCÈS (OVERLAY DE VOTRE COLLÈGUE) --- */}
        {successConsultationId && (
          <div className="absolute inset-0 z-[55] bg-[#faf8f1] dark:bg-gray-900 flex flex-col items-center justify-center p-6 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border border-gray-200 dark:border-gray-700">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Save size={40} />
              </div>
              <h2 className="text-2xl font-bold font-brand text-gray-800 dark:text-white mb-2">
                Consultation Terminée
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Les informations ont été enregistrées avec succès. Le patient
                peut maintenant régler les frais ou récupérer ses documents.
              </p>

              <div className="space-y-3 mb-8">
                {prescriptions.length > 0 && (
                  <button
                    onClick={() => handleDownloadPdf("prescription")}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-blue-200 dark:border-blue-800"
                  >
                    <Download size={20} /> Imprimer l'Ordonnance
                  </button>
                )}
                {exams.length > 0 && (
                  <button
                    onClick={() => handleDownloadPdf("exam-request")}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 font-bold rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors border border-purple-200 dark:border-purple-800"
                  >
                    <Download size={20} /> Imprimer la demande d'Examens
                  </button>
                )}
              </div>

              <button
                onClick={() => onClose(true)}
                className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors w-full"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* MODALES ENFANTS */}
      {/* ================================================================= */}

      <AddMedicationModal
        AutoRefreshPage={handleAutoRefreshPage}
        isOpen={isAddMedModalOpen}
        onClose={() => setIsAddMedModalOpen(false)}
        onAdd={(med) => setPrescriptions((prev) => [...prev, med])}
        availableArticles={allArticles}
      />
      <AddExamModal
        isOpen={isAddExamModalOpen}
        onClose={() => setIsAddExamModalOpen(false)}
        onAdd={(exam) => setExams((prev) => [...prev, exam])}
        labTests={labTests}
      />
      <AddMedicalActModal
        AutoRefreshPage={handleAutoRefreshPage}
        isOpen={isAddActModalOpen}
        onClose={() => setIsAddActModalOpen(false)}
        onAdd={(act) => setPerformedActs((prev) => [...prev, act])}
        medicalActs={sharedMedicalActs}
        equipments={sharedEquipment}
      />

      <MedicalBackgroundModal
        AutoRefreshPage={handleAutoRefreshPage}
        isOpen={isMedicalBgModalOpen}
        onClose={(hasChanged?: boolean) => {
          setIsMedicalBgModalOpen(false);
          if (hasChanged) fetchLocalMedicalBg();
        }}
        patientId={patient.id}
        existingData={localMedicalBg}
      />

      {previewImageUrl && (
        <ImagePreviewModal
          imageSrc={previewImageUrl}
          isOpen={!!previewImageUrl}
          onClose={() => setPreviewImageUrl(null)}
        />
      )}
    </div>
  );
};
