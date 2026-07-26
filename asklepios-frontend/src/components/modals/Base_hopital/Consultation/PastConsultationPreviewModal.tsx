import React, { useEffect, useState } from "react";
import {
  X,
  CalendarDays,
  FileText,
  Activity,
  Pill,
  TestTube,
  Download,
  Syringe,
} from "lucide-react";
import useConsultationStore from "../../../../functions/base_hospital/useConsultationStore";
import useMedicalBgStore from "../../../../functions/base_hospital/useMedicalBgStore";
import { PatientLabResultsList } from "../laboratory/PatientLabResultsList";

import toast from "react-hot-toast";
import { ImagePreviewModal } from "../laboratory/ImagePreviewModal";
import { PrescribedExamAccordionItem } from "../laboratory/PrescribedExamAccordionItem";
import api from "../../../../api/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  consultationId: number | null;
}

export const PastConsultationPreviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  consultationId,
}) => {
  const { currentConsultation, getConsultationDetails, loading } =
    useConsultationStore();
  const { downloadMedicalRecord } = useMedicalBgStore();
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [labRequests, setLabRequests] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && consultationId) {
      setLabRequests([]); // Réinitialise les résultats précédents
      getConsultationDetails(consultationId);
    }
  }, [isOpen, consultationId, getConsultationDetails]);

  // 👉 RÉCUPÉRATION DYNAMIQUE (Visite Externe OU Hospitalisation OU Direct)
  const patient =
    currentConsultation?.patient_visit?.patient ||
    currentConsultation?.admission?.patient ||
    (currentConsultation as any)?.patient;

  useEffect(() => {
    if (isOpen && patient?.id) {
      api
        .get("/laboratory/requests", { params: { patient_id: patient.id } })
        .then((res) => {
          const data = Array.isArray(res.data)
            ? res.data
            : res.data?.data || [];
          setLabRequests(data);
        })
        .catch((err) => console.error("Erreur chargement labo :", err));
    }
  }, [isOpen, patient?.id]);

  if (!isOpen) return null;

  const medicalActs =
    currentConsultation?.patient_visit?.performed_medical_acts ||
    currentConsultation?.admission?.performed_medical_acts ||
    [];
  const prescriptions = currentConsultation?.prescriptions || [];
  const exams = currentConsultation?.exam_requests || [];

  const handleDownloadRecord = () => {
    if (patient?.id) {
      toast.promise(downloadMedicalRecord(patient.id, "download"), {
        loading: "Génération...",
        success: "Téléchargement démarré !",
        error: "Erreur",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-[#faf8f1] dark:bg-gray-900 w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 bg-[#003366] dark:bg-gray-950 text-white shrink-0 border-b border-blue-900 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <FileText size={26} className="text-[#00a896]" />
            <div>
              <h2 className="text-xl font-bold font-brand">
                Détails de la consultation
              </h2>
              {currentConsultation && patient && (
                <p className="text-sm text-blue-200 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                  <CalendarDays size={14} />{" "}
                  {new Date(currentConsultation.created_at).toLocaleDateString(
                    "fr-FR",
                  )}
                  -{" "}
                  <span className="font-bold text-white dark:text-teal-400">
                    {patient.first_name} {patient.last_name}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadRecord}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl text-xs font-bold transition-colors"
            >
              <Download size={15} /> Carnet Complet
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-300 hover:text-white hover:bg-red-500/20 rounded-full transition-colors"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {loading || !currentConsultation ? (
            <div className="flex justify-center py-20">
              <Activity className="animate-spin text-[#00a896]" size={40} />
            </div>
          ) : (
            <>
              {/* 1. Notes Cliniques */}
              <div className="bg-white dark:bg-gray-800/90 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="font-bold text-[#003366] dark:text-blue-400 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                  1. Examen Clinique
                </h3>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Motif :{" "}
                  <span className="font-normal text-gray-700 dark:text-gray-300">
                    {currentConsultation.chief_complaint}
                  </span>
                </p>
                <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/80 p-3.5 rounded-lg border border-gray-100 dark:border-gray-700 font-mono">
                  {currentConsultation.clinical_data?.notes
                    ? currentConsultation.clinical_data.notes.replace(
                        /<[^>]*>/g,
                        "",
                      )
                    : "Aucune note."}
                </div>
              </div>

              {/* 2. Actes Médicaux */}
              <div className="bg-white dark:bg-gray-800/90 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="font-bold text-[#003366] dark:text-blue-400 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                  2. Actes Médicaux Réalisés
                </h3>
                {medicalActs.length > 0 ? (
                  <ul className="space-y-2">
                    {medicalActs.map((act: any) => (
                      <li
                        key={act.id}
                        className="flex items-center justify-between gap-3 text-sm p-3 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-2.5">
                          <Syringe size={16} className="text-indigo-500" />
                          <span className="font-bold text-gray-800 dark:text-gray-200">
                            {act.medical_act_catalog?.name || "Acte"}
                          </span>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 font-mono font-bold">
                          {act.applied_price} FCFA
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Aucun acte facturable enregistré.
                  </p>
                )}
              </div>

              {/* 3. Ordonnance */}
              <div className="bg-white dark:bg-gray-800/90 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="font-bold text-[#003366] dark:text-blue-400 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                  3. Ordonnance
                </h3>
                {prescriptions.length > 0 ? (
                  <ul className="space-y-2">
                    {prescriptions.map((presc: any) =>
                      presc.prescription_lines?.map((line: any) => (
                        <li
                          key={line.id}
                          className="flex items-start gap-3 text-sm p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/50"
                        >
                          <Pill size={16} className="text-blue-500 mt-0.5" />
                          <div>
                            <p className="font-bold text-blue-950 dark:text-blue-200">
                              {line.custom_medication_name ||
                                line.article?.name ||
                                "Médicament"}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
                              {line.dosage}
                            </p>
                          </div>
                        </li>
                      )),
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Aucune prescription.
                  </p>
                )}
              </div>

              {/* 4. Examens Demandés en Consultation */}
              <div className="bg-white dark:bg-gray-800/90 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="font-bold text-[#003366] dark:text-blue-400 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center justify-between">
                  <span>
                    4. Prescriptions d'Examens lors de cette consultation
                  </span>
                  <span className="text-xs text-gray-500 font-normal">
                    Cliquez sur un examen pour dérouler le résultat
                  </span>
                </h3>
                {exams.length > 0 ? (
                  <div className="space-y-2.5">
                    {exams.map((exam: any) =>
                      exam.exam_request_lines?.map((line: any) => (
                        <PrescribedExamAccordionItem
                          key={line.id}
                          examName={line.exam_name}
                          examLine={line}
                          labRequests={labRequests}
                          patientGender={patient?.gender}
                          onPreviewImage={(url) => setPreviewImageUrl(url)}
                        />
                      )),
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Aucun examen demandé lors de cette séance.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* LIGHTBOX DE PRÉVISUALISATION D'IMAGE */}
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
